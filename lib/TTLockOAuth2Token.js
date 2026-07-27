'use strict';

const { OAuth2Token } = require('homey-oauth2app');

// TTLock's cloud never returns a 401 for an expired token - it returns HTTP 200
// with an errcode instead - so the default reactive (401-triggered) refresh flow
// never fires. Track when the token was issued and refresh proactively instead.
module.exports = class TTLockOAuth2Token extends OAuth2Token {

  constructor(props) {
    super(props);
    this.obtained_at = props.obtained_at || Date.now();
  }

  isExpiring() {
    if (!this.expires_in) return false;
    return Date.now() > (this.obtained_at + (this.expires_in * 1000) - (5 * 60 * 1000));
  }

  toJSON() {
    return {
      ...super.toJSON(),
      obtained_at: this.obtained_at,
    };
  }

};
