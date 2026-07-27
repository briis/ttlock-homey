'use strict';

const { OAuth2Device } = require('homey-oauth2app');

const POLL_INTERVAL = 60 * 1000;
const BATTERY_LOW_THRESHOLD = 20;

// TTLock `lock/queryOpenState` state: 0 = locked, 1 = unlocked, 2 = unknown
const STATE_LOCKED = 0;
const STATE_UNLOCKED = 1;

module.exports = class TTLockDevice extends OAuth2Device {

  async onOAuth2Init() {
    if (!this.hasCapability('alarm_battery')) {
      await this.addCapability('alarm_battery');
    }

    this.registerCapabilityListener('locked', this.onCapabilityLocked.bind(this));

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

    if (locked) {
      await this.oAuth2Client.lock(id);
    } else {
      await this.oAuth2Client.unlock(id);
    }

    await this.syncState();
  }

  async syncState() {
    const { id } = this.getData();

    const [state, detail] = await Promise.all([
      this.oAuth2Client.getLockState(id),
      this.oAuth2Client.getLockDetail(id),
    ]);

    if (state.state === STATE_LOCKED || state.state === STATE_UNLOCKED) {
      await this.setCapabilityValue('locked', state.state === STATE_LOCKED);
    }

    if (typeof detail.electricQuantity === 'number') {
      await this.setCapabilityValue('measure_battery', detail.electricQuantity);
      await this.setCapabilityValue('alarm_battery', detail.electricQuantity < BATTERY_LOW_THRESHOLD);
    }
  }

};
