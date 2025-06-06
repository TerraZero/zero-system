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

const AsyncHandler = require('zero-util/src/AsyncHandler');

module.exports = class RemoteSystem {

  /** @returns {string} */
  static get REQUEST() {
    return '{{REQUEST}}';
  }

  /** @returns {RemoteSystem} */
  static get instance() {
    return this._instance;
  }

  /**
   * @param {string} id 
   * @returns {?Object}
   */
  static get(id) {
    return this.instance.get(id);
  }

  /**
   * @param {string} id 
   * @returns {?Object}
   */
  static getComponent(id) {
    return this.instance.getComponent(id);
  }

  /**
   * @param {import('zero-system/src/Nuxt/Socket/Client')} socket 
   * @param {Object<string, NewableFunction>} namespace
   */
  constructor(socket, namespace) {
    if (this.constructor.instance === undefined) {
      this.constructor._instance = this;
    } else {
      throw new Error('Only one RemoteSystem can be created.');
    }
    this.context = null;
    this.socket = socket;
    this.namespace = namespace;
    this.remoteInfo = null;
    this.services = {};
    this.components = {};
    this.resolvers = [];
    this.events = new AsyncHandler();
  }

  /**
   * @param {T_NuxtContext} context 
   */
  boot(context) {
    this.context = context;
    this.socket.setContext(context);
    this.addResolver(this.resolver.bind(this), -100);
    for (const id in this.namespace) {
      if (typeof this.namespace[id].setupInit === 'function') {
        this.namespace[id].setupInit(this);
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
  async resolver(id) {
    if (this.services[id] !== undefined) {
      return this.services[id];
    }
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
    if (id.startsWith('#')) {
      this.setComponent(id.substring(1), service);
      return this;
    }
    this.services[id] = service;
    return this;
  }

  /**
   * @param {string} id 
   * @returns {?Object}
   */
  async get(id) {
    if (id.startsWith('#')) {
      return this.getComponent(id.substring(1));
    }
    for (const resolver of this.resolvers) {
      const service = await resolver.resolver(id);
      if (service !== null) return service;
    }
    this.services[id] = null;
    return null;
  }

  setComponent(name, component) {
    this.components[name] = component;
    return this;
  }

  getComponent(name) {
    return this.components[name];
  }

  async executeActions(actions) {
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  async executeAction(action) {
    const object = await this.get(action.service);
    await object[action.method](...action.params);
  }

}