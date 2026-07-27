'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const TTLockWebhookEvents = require('../../lib/TTLockWebhookEvents');

const POLL_INTERVAL = 5 * 60 * 1000;
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
  'onoff.autolock',
  'onoff.lock_sound',
  'passage_mode_enabled',
  'last_operator',
  'last_trigger',
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

    this.registerCapabilityListener('locked', this.onCapabilityLocked.bind(this));
    this.registerCapabilityListener('onoff.autolock', this.onCapabilityAutoLock.bind(this));
    this.registerCapabilityListener('onoff.lock_sound', this.onCapabilityLockSound.bind(this));

    await this.syncState().catch((err) => this.error('Failed to fetch initial lock state', err));
    this._pollInterval = this.homey.setInterval(() => {
      this.syncState().catch((err) => this.error('Failed to poll lock state', err));
    }, POLL_INTERVAL);
  }

  async onOAuth2Uninit() {
    this.homey.clearInterval(this._pollInterval);
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
    await this.syncState();
  }

  async onCapabilityLockSound(enabled) {
    const { id } = this.getData();
    await this.oAuth2Client.setLockSound(id, enabled);
    await this.syncState();
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

    if (typeof record.electricQuantity === 'number') {
      await this.setCapabilityValue('measure_battery', record.electricQuantity);
      await this.setCapabilityValue('alarm_battery', record.electricQuantity < BATTERY_LOW_THRESHOLD);
    }
  }

  async syncState() {
    const { id } = this.getData();

    const [state, detail, gateways] = await Promise.all([
      this.oAuth2Client.getLockState(id),
      this.oAuth2Client.getLockDetail(id),
      this.oAuth2Client.getGatewaysForLock(id).catch(() => []),
    ]);

    if (state.state === STATE_LOCKED || state.state === STATE_UNLOCKED) {
      await this.setCapabilityValue('locked', state.state === STATE_LOCKED);
    }

    if (
      (state.sensorState === SENSOR_STATE_OPENED || state.sensorState === SENSOR_STATE_CLOSED)
      && hasFeature(detail.featureValue, FEATURE_DOOR_SENSOR)
    ) {
      if (!this.hasCapability('alarm_contact')) {
        await this.addCapability('alarm_contact');
      }
      await this.setCapabilityValue('alarm_contact', state.sensorState === SENSOR_STATE_OPENED);
    }

    if (typeof detail.electricQuantity === 'number') {
      await this.setCapabilityValue('measure_battery', detail.electricQuantity);
      await this.setCapabilityValue('alarm_battery', detail.electricQuantity < BATTERY_LOW_THRESHOLD);
    }

    if (typeof detail.autoLockTime === 'number') {
      await this.setCapabilityValue('onoff.autolock', detail.autoLockTime > 0);
    }

    if (detail.lockSound === ON_OFF_ON || detail.lockSound === ON_OFF_OFF) {
      await this.setCapabilityValue('onoff.lock_sound', detail.lockSound === ON_OFF_ON);
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
