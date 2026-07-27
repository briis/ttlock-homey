'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class TTLockDriver extends OAuth2Driver {

  async onOAuth2Init() {
    this.log('TTLock driver has been initialized');
  }

  async onPairListDevices({ oAuth2Client }) {
    const locks = await oAuth2Client.getLocks();
    return locks.map((lock) => ({
      name: lock.lockAlias || lock.lockName,
      data: { id: String(lock.lockId) },
    }));
  }

};
