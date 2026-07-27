'use strict';

const crypto = require('crypto');

const { OAuth2Client, OAuth2Error, fetch } = require('homey-oauth2app');

const TTLockOAuth2Token = require('./TTLockOAuth2Token');

function md5(value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex');
}

// TTLock's gateways can't reliably handle concurrent commands, so lock/unlock
// calls are serialized through a single queue (mirrors hass-ttlock's GW_LOCK).
let gatewayQueue = Promise.resolve();
function throughGateway(fn) {
  const result = gatewayQueue.then(fn, fn);
  gatewayQueue = result.catch(() => undefined);
  return result;
}

module.exports = class TTLockOAuth2Client extends OAuth2Client {

  // Each user registers their own TTLock Open Platform application (see README) and
  // enters its Client ID/Secret in the app's Settings, rather than the app shipping
  // with one shared client registered by the maintainer.
  static CLIENT_ID = '';
  static CLIENT_SECRET = '';
  static API_URL = 'https://euapi.ttlock.com';
  static TOKEN_URL = 'https://euapi.ttlock.com/oauth2/token';
  static AUTHORIZATION_URL = null;
  static SCOPES = [];
  static TOKEN = TTLockOAuth2Token;

  get clientId() {
    return this.homey.settings.get('ttlockClientId') || '';
  }

  get clientSecret() {
    return this.homey.settings.get('ttlockClientSecret') || '';
  }

  async onGetTokenByCredentials({ username, password }) {
    this._token = await this._tokenRequest({
      username,
      password: md5(password),
    });
    return this.getToken();
  }

  async onRefreshToken() {
    const token = this.getToken();
    if (!token || !token.isRefreshable()) {
      throw new OAuth2Error('Token cannot be refreshed');
    }

    this.debug('Refreshing token...');
    this._token = await this._tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    });
    this.debug('Refreshed token!');
    this.save();
    return this.getToken();
  }

  async _tokenRequest(params) {
    if (!this.clientId || !this.clientSecret) {
      throw new OAuth2Error('Set a TTLock Client ID and Client Secret in the app\'s Settings first (see the README for how to get one)');
    }

    const body = new URLSearchParams({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      ...params,
    });

    const response = await fetch(this._tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const json = await response.json();
    if (json.errcode) {
      throw new OAuth2Error(json.errmsg || `TTLock error ${json.errcode}`);
    }

    return new TTLockOAuth2Token({ ...json, obtained_at: Date.now() });
  }

  async onRequestQuery({ query }) {
    const token = this.getToken();
    if (token && token.isExpiring()) {
      await this.refreshToken();
    }

    return {
      ...query,
      clientId: this.clientId,
      accessToken: this.getToken() ? this.getToken().access_token : undefined,
      date: String(Date.now()),
    };
  }

  async onRequestHeaders({ headers }) {
    // TTLock authenticates via query params (see onRequestQuery), not a
    // bearer token header, but still expects this content type on GETs.
    return {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async onHandleResult({ result }) {
    // TTLock returns HTTP 200 with { errcode, errmsg } even on failure.
    if (result && typeof result === 'object' && result.errcode) {
      throw new OAuth2Error(result.errmsg || `TTLock error ${result.errcode}`);
    }
    return result;
  }

  async getLocks() {
    const res = await this.get({
      path: '/v3/lock/list',
      query: { pageNo: 1, pageSize: 1000 },
    });
    return res.list || [];
  }

  async getLockDetail(lockId) {
    return this.get({
      path: '/v3/lock/detail',
      query: { lockId },
    });
  }

  async getLockState(lockId) {
    return throughGateway(() => this.get({
      path: '/v3/lock/queryOpenState',
      query: { lockId },
    }));
  }

  async lock(lockId) {
    return throughGateway(() => this.get({ path: '/v3/lock/lock', query: { lockId } }));
  }

  async unlock(lockId) {
    return throughGateway(() => this.get({ path: '/v3/lock/unlock', query: { lockId } }));
  }

  // Gateways currently in range of the lock, best (highest RSSI) signal first.
  async getGatewaysForLock(lockId) {
    const res = await this.get({
      path: '/v3/gateway/listByLock',
      query: { lockId },
    });
    return (res.list || []).slice().sort((a, b) => b.rssi - a.rssi);
  }

  async setAutoLockTime(lockId, seconds) {
    return throughGateway(() => this.post({
      path: '/v3/lock/setAutoLockTime',
      body: new URLSearchParams({ lockId, seconds, type: 2 }),
    }));
  }

  async setLockSound(lockId, enabled) {
    return throughGateway(() => this.post({
      path: '/v3/lock/updateSetting',
      body: new URLSearchParams({
        lockId, value: enabled ? 1 : 2, type: 6, changeType: 2,
      }),
    }));
  }

};
