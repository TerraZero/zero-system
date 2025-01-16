/**
 * @typedef {Object} T_SystemItemInfo
 * @property {Object} [factory]
 * @property {string} [factory.struct]
 * @property {string} [factory.method]
 * @property {string} [file]
 * @property {string[]} [tags]
 * @property {string} [construct]
 * @property {string} [collector]
 * @property {Object<string, string>} [actions]
 * @property {Object<string, any>} [attributes]
 * @property {boolean} [volatile]
 */

/**
 * @typedef {Object} T_SystemItemPack
 * @property {string} name
 * @property {T_SystemItemInfo} info
 */

module.exports = class SystemItem {

  /**
   * Lazy load ZeroRoot
   * @returns {typeof import('./ZeroRoot')}
   */
  static get ZeroRoot() {
    if (this._ZeroRoot === undefined) {
      this._ZeroRoot = require('./ZeroRoot');
    }
    return this._ZeroRoot;
  }

  /**
   * Lazy load SystemCollector
   * @returns {typeof import('./SystemCollector')}
   */
  static get SystemCollector() {
    if (this._SystemCollector === undefined) {
      this._SystemCollector = require('./SystemCollector');
    }
    return this._SystemCollector;
  }

  /**
   * @param {SystemItem} item 
   * @returns {?T_SystemItemPack}
   */
  static pack(item) {
    if (!item.info.file) return null;
    let file = item.info.file;
    if (file.startsWith('~/')) {
      file = file.substring(2);
    }
    return {
      name: item.name,
      info: item.info,
      file,
    };
  }

  /**
   * @param {T_SystemItemPack} object 
   * @returns {SystemItem}
   */
  static unpack(object) {
    return new SystemItem(object.name, null, object.info);
  }

  /**
   * @param {string} name 
   * @param {?Object} object 
   * @param {T_SystemItemInfo} info 
   */
  constructor(name, object, info = {}) {
    this.name = name;
    this.object = object;
    this.collector = undefined;
    this.factory = undefined;
    this.construct = undefined;
    this.info = info;
  }

  /**
   * Set the name or the id of the service. Used by `ServiceCollector.get()`.
   * 
   * @see SystemCollector.get
   * 
   * @param {string} name 
   * @returns {this}
   */
  setName(name) {
    this.name = name;
    return this;
  }

  /**
   * Set to true if the service is not cachable.
   * 
   * @param {boolean} volatile 
   * @returns {this}
   */
  setVolatile(volatile = true) {
    this.info.volatile = volatile;
    return this;
  }

  /**
   * Set the constructor for the service. The class of this item.
   * 
   * @param {string} construct 
   * @returns {this}
   */
  setConstruct(construct) {
    this.info.construct = SystemItem.ZeroRoot.getRequirePath(construct);
    return this;
  }

  /**
   * @param {string} file 
   * @returns {this}
   */
  setFile(file) {
    this.info.file = SystemItem.ZeroRoot.getRequirePath(file);
    return this;
  }

  /**
   * Set the collector for this item.
   * 
   * @param {(string|import('./SystemCollector'))} collector
   * @returns {this}
   */
  setCollector(collector) {
    if (collector instanceof SystemItem.SystemCollector) {
      this.info.collector = collector.id;
    } else {
      this.info.collector = collector;
    }
    return this;
  }

  /**
   * Define this item as remote item. If local than create a local instance for this item.
   * 
   * If local is null: Only a proxy object will be returned.
   * If local is set: The object will be created locally and the connection proxy will be givin.
   * 
   * @param {string} local 
   * @returns {this}
   */
  setRemote(local = null) {
    this.setTag('remote');
    if (local) {
      this.setAttribute('local', local);
    }
    return this;
  }

  /**
   * @returns {boolean}
   */
  isRemote() {
    return this.hasTag('remote');
  }

  /**
   * @returns {(string|null)}
   */
  getRemoteLocal() {
    return this.getAttribute('local');
  }

  /**
   * Set the factory method for this item. The method must return the object of this item.
   * 
   * @param {string} struct 
   * @param {string} method 
   * @returns {this}
   */
  setFactory(struct = 'this', method = 'factory') {
    this.info.factory = {
      struct: struct === 'this' ? this.info.file : struct,
      method,
    };
    return this;
  }

  /**
   * @returns {?string}
   */
  getRealFactoryStruct() {
    if (this.info.factory && this.info.factory.struct) {
      return SystemItem.ZeroRoot.getRealRequirePath(this.info.factory.struct);
    }
    return null;
  }

  /**
   * @returns {?CallableFunction}
   */
  getFactory() {
    if (this.factory === undefined) {
      this.factory = null;
      let struct = this.getRealFactoryStruct();
      if (struct === null && this.info.collector) {
        const collector = this.getCollector();
        if (collector) {
          this.factory = collector.factory.bind(collector);
        }
      } else if (struct !== null) {
        struct = require(struct);
        this.factory = struct[this.info.factory.method].bind(struct);
      }
    }
    return this.factory;
  }

  /**
   * @returns {?string}
   */
  getRealConstruct() {
    if (this.info.construct) {
      return SystemItem.ZeroRoot.getRealRequirePath(this.info.construct);
    }
    return null;
  }

  /**
   * @returns {?NewableFunction}
   */
  getConstruct() {
    if (this.construct === undefined) {
      this.construct = null;
      if (this.info.construct) {
        this.construct = require(this.getRealConstruct());
      }
    }
    return this.construct;
  }

  /**
   * @returns {?import('zero-system/src/SystemCollector')}
   */
  getCollector() {
    if (this.collector === undefined) {
      this.collector = null;
      if (this.info.collector) {
        this.collector = SystemItem.SystemCollector.get(this.info.collector);
      }
    }
    return this.collector;
  }

  /**
   * Set a tag for this item.
   * 
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
   * Set an attribute for this item.
   * 
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
      const Construct = this.getConstruct();
      
      if (factory === null) {
        this.object = new Construct();
      } else {
        this.object = factory(this, Construct);
      }
    }
    const obj = this.object ?? null;
    if (this.info.volatile) {
      this.object = null;
    }
    return obj;
  }

  /**
   * Add an action for this item.
   * 
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

  /**
   * @returns {?T_SystemItemPack}
   */
  pack() {
    return SystemItem.pack(this);
  }

}