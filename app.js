'use strict';

const { OAuth2App } = require('homey-oauth2app');

const TTLockOAuth2Client = require('./lib/TTLockOAuth2Client');

module.exports = class TTLockApp extends OAuth2App {

  static OAUTH2_CLIENT = TTLockOAuth2Client;

  async onOAuth2Init() {
    this.log('TTLock app has been initialized');
  }

};
