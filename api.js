'use strict';

module.exports = {

  async getWebhookUrl({ homey }) {
    return homey.app.getWebhookUrl();
  },

};
