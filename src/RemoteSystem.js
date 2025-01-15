const Handler = require('events');

module.exports = class RemoteSystem {

  /**
   * @param {string} name 
   * @returns 
   */
  static createRemoteProxy(name) {
    return new Proxy({}, {

      get(target, prop, receiver) {
        return async (...args) => {
          return await RemoteSystem.socketCall(name, prop, {
            args,
          });
        };
      },

    });
  }

  /**
   * @param {string} name 
   * @param {string} prop 
   * @param {Object} data 
   * @returns {*}
   */
  static async socketCall(name, prop, data = {}) {
    console.log('RemoteSystem.socketCall', name, prop, data);
  }

  /**
   * @param {import('zero-system/src/Nuxt/Socket/Client')} socket 
   */
  constructor(socket) {
    this.socket = socket;
    this.remoteInfo = null;
    this.services = {};
    this.handler = new Handler();
  }

  /**
   * @param {string} name 
   * @param {Object} service 
   */
  set(name, service) {
    this.services[name] = service;
    this.handler.emit('service:' + name, service);
  }

  /**
   * @param {string} name 
   * @param {CallableFunction} listener 
   */
  ensure(name, listener) {
    this.handler.on('service:' + name, listener);
    if (this.services[name]) {
      this.handler.emit('service:' + name, this.get(name));
    }
  }

  /**
   * @param {boolean} force 
   * @returns {Object}
   */
  async getRemoteInfo(force = false) {
    if (this.remoteInfo === null || force) {
      const response = await this.socket.request('zero:remote-info');
      this.remoteInfo = response.items;
    }
    return this.remoteInfo;
  }

  /**
   * @param {string} service 
   */
  async get(service) {
    const remoteInfo = await this.getRemoteInfo();

    console.log(remoteInfo);
  }

}