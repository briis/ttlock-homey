'use strict';

const crypto = require('crypto');

const Homey = require('homey');
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

  static CLIENT_ID = Homey.env.TTLOCK_CLIENT_ID;
  static CLIENT_SECRET = Homey.env.TTLOCK_CLIENT_SECRET;
  static API_URL = 'https://euapi.ttlock.com';
  static TOKEN_URL = 'https://euapi.ttlock.com/oauth2/token';
  static AUTHORIZATION_URL = null;
  static SCOPES = [];
  static TOKEN = TTLockOAuth2Token;

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
    const body = new URLSearchParams({
      clientId: this._clientId,
      clientSecret: this._clientSecret,
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
      clientId: this._clientId,
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

};
