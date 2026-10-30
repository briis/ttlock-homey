'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class TTLockDriver extends OAuth2Driver {

  async onOAuth2Init() {
    this.log('TTLock driver has been initialized');

    // "Lock was [locked/unlocked/either]" - the dropdown picks which direction
    // the flow should fire on; the device passes the actual direction as state.
    this.homey.flow.getDeviceTriggerCard('lock_operated')
      .registerRunListener((args, state) => args.action === 'any' || args.action === state.action);
  }

  async onPairListDevices({ oAuth2Client }) {
    const locks = await oAuth2Client.getLocks();
    return locks.map((lock) => ({
      name: lock.lockAlias || lock.lockName,
      data: { id: String(lock.lockId) },
    }));
  }

};
