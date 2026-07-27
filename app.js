'use strict';

const querystring = require('querystring');

const Homey = require('homey');
const { OAuth2App } = require('homey-oauth2app');

const TTLockOAuth2Client = require('./lib/TTLockOAuth2Client');

function parseWebhookBody(body) {
  if (typeof body === 'string') {
    return querystring.parse(body);
  }
  return body || {};
}

module.exports = class TTLockApp extends OAuth2App {

  static OAUTH2_CLIENT = TTLockOAuth2Client;

  async onOAuth2Init() {
    this.log('TTLock app has been initialized');

    if (Homey.env.WEBHOOK_ID && Homey.env.WEBHOOK_SECRET) {
      await this.initWebhook().catch((err) => this.error('Failed to register webhook', err));
    } else {
      this.log('WEBHOOK_ID/WEBHOOK_SECRET not set, skipping webhook registration (see DEVELOPMENT.md)');
    }
  }

  async initWebhook() {
    const webhook = await this.homey.cloud.createWebhook(
      Homey.env.WEBHOOK_ID,
      Homey.env.WEBHOOK_SECRET,
      {},
    );

    webhook.on('message', (args) => {
      this.onWebhookMessage(args).catch((err) => this.error('Failed to handle webhook message', err));
    });

    this.log('Webhook registered');
  }

  async onWebhookMessage(args) {
    const body = parseWebhookBody(args.body);
    if (!body.records) return;

    let records;
    try {
      records = JSON.parse(body.records);
    } catch (err) {
      this.error('Failed to parse webhook records', err);
      return;
    }

    const devices = this.homey.drivers.getDriver('lock').getDevices();

    for (const record of records) {
      const lockId = String(record.lockId || body.lockId);
      const device = devices.find((candidate) => candidate.getData().id === lockId);
      if (!device) continue;

      // eslint-disable-next-line no-await-in-loop
      await device.onWebhookEvent(record)
        .catch((err) => this.error(`Failed to process webhook event for lock ${lockId}`, err));
    }
  }

  // Used by /api.js so the Settings page can show the user their webhook URL.
  async getWebhookUrl() {
    if (!Homey.env.WEBHOOK_ID) return null;
    const homeyId = await this.homey.cloud.getHomeyId();
    return `https://webhooks.athom.com/webhook/${Homey.env.WEBHOOK_ID}/?homey=${homeyId}`;
  }

};
