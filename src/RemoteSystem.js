/**
 * @typedef {Object} T_NuxtContext
 * @property {import('vue').default} app - Die Hauptanwendung (Vue-Instanz).
 * @property {import('vuex').Store} store - Der Vuex-Store.
 * @property {import('vue-router').Route} route - Die aktuelle Route.
 * @property {Function} redirect - Methode, um eine Umleitung auszuführen.
 * @property {Function} error - Methode, um Fehler zu behandeln.
 * @property {Object} params - Die Routenparameter.
 * @property {Object} query - Die Query-Parameter der Route.
 * @property {Object} env - Die Umgebungsvariablen.
 * @property {Object} $axios - Die Axios-Instanz (falls axios Module installiert ist).
 */


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
   * @param {Object<string, NewableFunction>} namespace
   */
  constructor(socket, namespace) {
    this.context = null;
    this.socket = socket;
    this.namespace = namespace;
    this.remoteInfo = null;
    this.services = {};
    this.handler = new Handler();
    this.resolvers = [];
  }

  /**
   * @param {T_NuxtContext} context 
   */
  boot(context) {
    this.context = context;
    this.socket.setContext(context);
    this.addResolver(this.resolver.bind(this), -100);
    for (const id in this.namespace) {
      if (typeof this.namespace[id].onBoot === 'function') {
        this.namespace[id].onBoot(this);
      }
    }
  }

  /**
   * @param {(id: string) => ?Object} resolver 
   * @param {number} prio
   * @returns {this}
   */
  addResolver(resolver, prio = 0) {
    this.resolvers.push({ resolver, prio });
    this.resolvers.sort((a, b) => a.prio - b.prio);
    return this;
  }

  /**
   * @param {string} id 
   * @returns {?Object}
   */
  resolver(id) {
    if (this.services[id] !== undefined) return this.services[id];
    if (this.namespace[id]) {
      if (typeof this.namespace[id].factory === 'function') {
        return this.namespace[id].factory(this);
      }
      this.services[id] = new this.namespace[id](this);
      return this.services[id];
    }
    return null;
  }

  /**
   * @param {string} id 
   * @param {Object} service 
   * @returns {this}
   */
  set(id, service) {
    this.services[id] = service;
    return this;
  }

  /**
   * @param {string} id 
   * @returns {?Object}
   */
  async get(id) {
    for (const resolver of this.resolvers) {
      const service = await resolver.resolver(id);
      if (service !== null) return service;
    }
    this.services[id] = null;
    return null;
  }

}