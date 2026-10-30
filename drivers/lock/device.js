'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const TTLockWebhookEvents = require('../../lib/TTLockWebhookEvents');

// Polling is split in two tiers to stay within TTLock's free-tier API budget
// (30k calls/month). The fast tier re-verifies lock state (1 call) every poll;
// the slow tier refreshes lock detail and gateway link (battery, auto-lock,
// sound, passage mode, signal) at most once per slow interval. Webhooks carry
// real-time changes, so the poll is mostly reconciliation. Both are tunable
// per device in the device settings.
const DEFAULT_POLL_MINUTES = 30;
const DEFAULT_SLOW_POLL_HOURS = 6;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const BATTERY_LOW_THRESHOLD = 20;
const AUTO_LOCK_ON_SECONDS = 10;

// TTLock `lock/queryOpenState` state: 0 = locked, 1 = unlocked, 2 = unknown
const STATE_LOCKED = 0;
const STATE_UNLOCKED = 1;

// TTLock `lock/queryOpenState` sensorState: 0 = opened, 1 = closed, null = unknown
const SENSOR_STATE_OPENED = 0;
const SENSOR_STATE_CLOSED = 1;

// TTLock `lock/detail` lockSound/passageMode: 0 = unknown, 1 = on, 2 = off
const ON_OFF_ON = 1;
const ON_OFF_OFF = 2;

// TTLock `lock/detail` featureValue is a hex bitmask; bit 13 = has a door sensor.
// https://euopen.ttlock.com/document/doc?urlName=cloud%2Flock%2FfeatureValueEn.html
const FEATURE_DOOR_SENSOR = 1 << 13;

// Capabilities every device should have, added on demand so already-paired
// devices pick up new capabilities without needing to be re-paired.
const MIGRATED_CAPABILITIES = [
  'alarm_battery',
  'measure_signal_strength',
  'autolock_enabled',
  'lock_sound_enabled',
  'passage_mode_enabled',
  'last_operator',
  'last_trigger',
];

// `onoff.*` capability instances make Homey's device tile toggle-able from
// that capability instead of `locked` (see athombv/homey-apps-sdk-issues#36),
// which is why these were replaced with custom boolean capabilities. Drop the
// old ones from already-paired devices so the tile stops being bound to them.
const LEGACY_CAPABILITIES = [
  'onoff.autolock',
  'onoff.lock_sound',
];

function hasFeature(featureValueHex, bit) {
  if (!featureValueHex) return false;
  return (parseInt(featureValueHex, 16) & bit) !== 0;
}

module.exports = class TTLockDevice extends OAuth2Device {

  async onOAuth2Init() {
    for (const capability of MIGRATED_CAPABILITIES) {
      if (!this.hasCapability(capability)) {
        await this.addCapability(capability);
      }
    }

    for (const capability of LEGACY_CAPABILITIES) {
      if (this.hasCapability(capability)) {
        await this.removeCapability(capability);
      }
    }

    this.registerCapabilityListener('locked', this.onCapabilityLocked.bind(this));
    this.registerCapabilityListener('autolock_enabled', this.onCapabilityAutoLock.bind(this));
    this.registerCapabilityListener('lock_sound_enabled', this.onCapabilityLockSound.bind(this));

    await this.syncState().catch((err) => this.error('Failed to fetch initial lock state', err));
    this._startPolling();
  }

  async onOAuth2Uninit() {
    this.homey.clearInterval(this._pollInterval);
  }

  _startPolling() {
    this.homey.clearInterval(this._pollInterval);
    const minutes = this.getSetting('poll_interval') || DEFAULT_POLL_MINUTES;
    this._pollInterval = this.homey.setInterval(() => {
      this.syncState().catch((err) => this.error('Failed to poll lock state', err));
    }, minutes * MINUTE_MS);
  }

  async onSettings({ changedKeys }) {
    // Restart on the next tick so getSetting() returns the new values, and
    // force a full refresh so the new slow cadence applies immediately.
    if (changedKeys.includes('poll_interval') || changedKeys.includes('slow_poll_interval')) {
      this.homey.setTimeout(() => {
        this._startPolling();
        this._slowLastFetched = null;
      }, 0);
    }
  }

  _slowTierDue() {
    const hours = this.getSetting('slow_poll_interval') || DEFAULT_SLOW_POLL_HOURS;
    return !this._slowLastFetched || Date.now() - this._slowLastFetched >= hours * HOUR_MS;
  }

  async onCapabilityLocked(locked) {
    const { id } = this.getData();
    const command = locked ? this.oAuth2Client.lock(id) : this.oAuth2Client.unlock(id);

    // TTLock's gateway/Bluetooth relay can take several seconds to confirm a
    // command, and Homey shows the tile as "busy" for as long as this listener's
    // promise is pending. Rather than block the UI on that relay round trip,
    // resolve immediately and correct the capability value if it turns out the
    // command actually failed.
    command
      .then(() => this.syncState())
      .catch(async (err) => {
        this.error('Lock command failed', err);
        await this.setCapabilityValue('locked', !locked).catch(() => undefined);
      });

    await this.setCapabilityValue('locked', locked);
  }

  async onCapabilityAutoLock(enabled) {
    const { id } = this.getData();
    await this.oAuth2Client.setAutoLockTime(id, enabled ? AUTO_LOCK_ON_SECONDS : 0);
    await this.syncState({ force: true });
  }

  async onCapabilityLockSound(enabled) {
    const { id } = this.getData();
    await this.oAuth2Client.setLockSound(id, enabled);
    await this.syncState({ force: true });
  }

  // Called by the app-level webhook listener with a single decoded TTLock
  // record for this lock, for near-instant updates instead of waiting for
  // the next poll.
  async onWebhookEvent(record) {
    const { action, description } = TTLockWebhookEvents.describe(record.recordType);

    if (action === TTLockWebhookEvents.ACTION_LOCK || action === TTLockWebhookEvents.ACTION_UNLOCK) {
      await this.setCapabilityValue('locked', action === TTLockWebhookEvents.ACTION_LOCK);
    }

    if (record.username) {
      await this.setCapabilityValue('last_operator', record.username);
    }

    await this.setCapabilityValue('last_trigger', description);

    await this._fireFlowTriggers(record, action, description);

    if (typeof record.electricQuantity === 'number') {
      await this.setCapabilityValue('measure_battery', record.electricQuantity);
      await this.setCapabilityValue('alarm_battery', record.electricQuantity < BATTERY_LOW_THRESHOLD);
    }
  }

  async _fireFlowTriggers(record, action, description) {
    const { flow } = this.homey;

    if (action === TTLockWebhookEvents.ACTION_LOCK || action === TTLockWebhookEvents.ACTION_UNLOCK) {
      await flow.getDeviceTriggerCard('lock_operated').trigger(
        this,
        {
          action: action === TTLockWebhookEvents.ACTION_LOCK ? 'locked' : 'unlocked',
          operator: record.username || '',
          method: description,
        },
        { action },
      );
    }

    if (record.recordType === TTLockWebhookEvents.RECORD_TAMPER_ALERT) {
      await flow.getDeviceTriggerCard('tamper_alert').trigger(this);
    }

    if (record.recordType === TTLockWebhookEvents.RECORD_INVALID_ATTEMPTS) {
      await flow.getDeviceTriggerCard('invalid_attempts').trigger(this);
    }
  }

  async syncState({ force = false } = {}) {
    const { id } = this.getData();
    const slowDue = force || this._slowTierDue();

    // Fast tier: lock/door state, every poll. Slow tier: detail + gateway,
    // fetched only when due and otherwise carried forward (capability values
    // persist, and the door-sensor feature flag is cached).
    const [state, detail, gateways] = await Promise.all([
      this.oAuth2Client.getLockState(id),
      slowDue ? this.oAuth2Client.getLockDetail(id) : null,
      slowDue ? this.oAuth2Client.getGatewaysForLock(id).catch(() => []) : null,
    ]);

    if (detail) {
      this._slowLastFetched = Date.now();
      this._hasDoorSensor = hasFeature(detail.featureValue, FEATURE_DOOR_SENSOR);
    }

    if (state.state === STATE_LOCKED || state.state === STATE_UNLOCKED) {
      await this.setCapabilityValue('locked', state.state === STATE_LOCKED);
    }

    if (
      (state.sensorState === SENSOR_STATE_OPENED || state.sensorState === SENSOR_STATE_CLOSED)
      && (this._hasDoorSensor || this.hasCapability('alarm_contact'))
    ) {
      if (!this.hasCapability('alarm_contact')) {
        await this.addCapability('alarm_contact');
      }
      await this.setCapabilityValue('alarm_contact', state.sensorState === SENSOR_STATE_OPENED);
    }

    if (!detail) return;

    if (typeof detail.electricQuantity === 'number') {
      await this.setCapabilityValue('measure_battery', detail.electricQuantity);
      await this.setCapabilityValue('alarm_battery', detail.electricQuantity < BATTERY_LOW_THRESHOLD);
    }

    if (typeof detail.autoLockTime === 'number') {
      await this.setCapabilityValue('autolock_enabled', detail.autoLockTime > 0);
    }

    if (detail.lockSound === ON_OFF_ON || detail.lockSound === ON_OFF_OFF) {
      await this.setCapabilityValue('lock_sound_enabled', detail.lockSound === ON_OFF_ON);
    }

    if (detail.passageMode === ON_OFF_ON || detail.passageMode === ON_OFF_OFF) {
      await this.setCapabilityValue('passage_mode_enabled', detail.passageMode === ON_OFF_ON);
    }

    const bestGateway = gateways[0];
    if (bestGateway && typeof bestGateway.rssi === 'number') {
      await this.setCapabilityValue('measure_signal_strength', bestGateway.rssi);
    }
  }

};
