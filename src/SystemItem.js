/**
 * @typedef {Object} T_SystemItemInfo
 * @property {CallableFunction} [factory]
 * @property {string[]} [tags]
 * @property {NewableFunction} [construct]
 * @property {import('./SystemCollector')} [collector]
 * @property {Object<string, (string|CallableFunction)>} [actions]
 * @property {Object<string, any>} [attributes]
 */

module.exports = class SystemItem {

  /**
   * @param {string} name 
   * @param {?Object} object 
   * @param {T_SystemItemInfo} info 
   */
  constructor(name, object, info = {}) {
    this.name = name;
    this.object = object;
    this.info = info;
    this.volatile = false;
  }

  /**
   * @param {string} name 
   * @returns {this}
   */
  setName(name) {
    this.name = name;
    return this;
  }

  /**
   * @param {boolean} volatile 
   * @returns {this}
   */
  setVolatile(volatile = true) {
    this.volatile = volatile;
    return this;
  }

  /**
   * @param {NewableFunction} construct 
   * @returns {this}
   */
  setConstruct(construct) {
    if (construct) this.info.construct = construct;
    return this;
  }

  /**
   * @param {import('./SystemCollector')} collector 
   * @returns {this}
   */
  setCollector(collector) {
    this.info.collector = collector;
    return this;
  }

  /**
   * @returns {?import('./SystemCollector')}
   */
  getCollector() {
    return this.info.collector;
  }

  /**
   * @param {CallableFunction} factory 
   * @param {boolean} reset 
   * @returns {this}
   */
  setFactory(factory, reset = false) {
    this.info.factory = factory;
    if (reset) {
      this.object = null;
    }
    return this;
  }

  /**
   * @returns {?CallableFunction}
   */
  getFactory() {
    if (typeof this.info.factory === 'function') return this.info.factory;
    if (this.getCollector()?.getFactory()) return this.getCollector().getFactory();
    if (this.info.construct && typeof this.info.construct.factory === 'function') return this.info.construct.factory;
    return null;
  }

  /**
   * @param {string} tag 
   * @returns {this}
   */
  setTag(tag) {
    if (!this.hasTag(tag)) {
      if (!Array.isArray(this.info.tags)) this.info.tags = [];
      this.info.tags.push(tag);
    }
    return this;
  }

  /**
   * @param {string} tag 
   * @returns {boolean}
   */
  hasTag(tag) {
    if (Array.isArray(this.info.tags)) {
      return this.info.tags.findIndex(v => v === tag) !== -1;
    }
    return false;
  }

  /**
   * @param {string} key 
   * @param {any} value 
   * @returns {this}
   */
  setAttribute(key, value) {
    this.info.attributes ??= {};
    this.info.attributes[key] = value;
    return this;
  }

  /**
   * @param {string} key 
   * @returns {any}
   */
  getAttribute(key) {
    return this.info.attributes?.[key] ?? null;
  }

  /**
   * @returns {?Object}
   */
  getObject() {
    if (this.object === null) {
      const factory = this.getFactory();
      
      if (factory !== null) {
        this.object = factory(this);
      } else if (this.info.construct) {
        this.object = new this.info.construct();
      }
    }
    const obj = this.object ?? null;
    if (this.volatile) {
      this.object = null;
    }
    return obj;
  }

  /**
   * @param {string} action 
   * @param {(string|CallableFunction)} func 
   * @returns {this}
   */
  addAction(action, func) {
    this.info.actions ??= {};
    this.info.actions[action] = func;
    return this;
  }

  /**
   * @param {string} action 
   * @returns {boolean}
   */
  hasAction(action) {
    return !!(this.info.actions && this.info.actions[action]) || false;
  }

  /**
   * @param {string} action
   * @returns {CallableFunction}
   */
  getAction(action) {
    const object = this.getObject();
    let definition = this.info.actions[action];
    if (typeof definition === 'string') {
      definition = object[definition];
    }
    return definition.bind(object);
  }

}