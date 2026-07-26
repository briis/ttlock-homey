'use strict';

const Homey = require('homey');

class App extends Homey.App {

  async onInit() {
    this.log('App has been initialized');
  }

}

module.exports = App;
