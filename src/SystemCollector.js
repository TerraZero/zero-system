const Path = require('path');
const Glob = require('glob');
const SystemItem = require('./SystemItem');
const Handler = require('events');
const Logger = require('./Log/Logger');

const register = [];
const paths = [];
const handler = new Handler();

module.exports = class SystemCollector {

  /** @returns {SystemItem[]} */
  static get register() {
    return register;
  }

  /** @returns {string[]} */
  static get paths() {
    return paths;
  }

  /** @returns {Handler} */
  static get events() {
    return handler;
  }

  /**
   * @param {string} path 
   * @returns {this}
   */
  static addPath(path) {
    this.paths.push(path);
    return this;
  }

  /**
   * @param {SystemItem} item 
   * @returns {this}
   */
  static setItem(item) {
    this.register.push(item);
    return this;
  }

  /**
   * @param {string} name 
   * @param {?Object} object 
   * @param {SystemItem.T_SystemItemInfo} info 
   * @returns {this}
   */
  static set(name, object = null, info = {}) {
    return this.setItem(new SystemItem(name, object, info));
  }

  /**
   * @param {string} name 
   * @returns {SystemItem}
   */
  static getItem(name) {
    return this.register.find(v => v.name === name) ?? null;
  }

  /**
   * @param {string} name 
   * @returns {?Object}
   */
  static get(name) {
    return this.getItem(name)?.getObject();
  }

  /**
   * @param {CallableFunction} predicate 
   * @returns {SystemItem.T_SystemItemInfo[]}
   */
  static each(predicate) {
    const array = [];

    for (const item of this.register) {
      const result = predicate(item);
      if (result) array.push(result);
    }
    return array;
  }

  /**
   * @param {CallableFunction} predicate 
   * @returns {?SystemItem}
   */
  static find(predicate) {
    for (const item of this.register) {
      if (predicate(item)) return item;
    }
    return null;
  }

  /**
   * @param {string} name 
   * @returns {?SystemItem.T_SystemItemInfo}
   */
  static getInfo(name) {
    return this.getItem(name)?.info;
  }

  /**
   * @param {string} name 
   * @returns {SystemItem}
   */
  static add(name) {
    this.set(name);
    return this.getItem(name);
  }

  /**
   * @param {SystemCollector} collector 
   * @returns {this}
   */
  static addCollector(collector) {
    SystemCollector.set('collector.' + collector.prefix, collector, {
      tags: ['collector'],
    });
    return this;
  }

  /**
   * @param {boolean} reset 
   * @returns {this}
   */
  static collect(reset = false) {
    SystemCollector.each(item => {
      if (item.hasTag('collector')) {
        item.getObject().collect(reset);
      }
    });
    this.events.emit('system:collect', this);
    return this;
  }

  /**
   * @param {string} prefix 
   * @param {string} path
   * @param {string} pattern
   * @param {CallableFunction} factory
   * @param {CallableFunction} validate
   */
  constructor(prefix, path, pattern, factory = null, validate = null) {
    this.prefix = prefix;
    this.path = path;
    this.pattern = pattern;
    this.factory = factory;
    this.validate = validate;
    this.logger = Logger.base.channel(prefix);

    this._current = null;
    this._file = null;
    this._collected = [];
  }

  collect(reset = false) {
    if (reset) this._collected = [];

    for (const path of SystemCollector.paths) {
      if (this._collected.includes(path)) {
        this.logger.debug(`Already collected "${path}"`);
        continue;
      }

      const fileroot = Path.join(path, this.path);
      this.logger.debug(`Glob "${fileroot}" with pattern "${this.pattern}"`);
      const files = Glob.sync(this.pattern, {
        cwd: fileroot,
      });
  
      for (const file of files) {
        const filepath = Path.join(path, this.path, file);
        this.logger.debug(`Load file "${filepath}"`);
        this.setCurrent(require(filepath), filepath);
        this.doDefine(this.getCurrent());
      }
      this._collected.push(path);
    }
  }

  doDefine(construct) {
    construct.define(this);
  }

  /**
   * @param {NewableFunction} construct 
   * @param {string} file 
   */
  setCurrent(construct, file) {
    this._current = construct;
    this._file = file;
  }

  getCurrent() {
    return this._current;
  }

  /**
   * @param {string} name 
   * @returns {SystemItem}
   */
  add(name) {
    return SystemCollector.add(this.prefix + '.' + name)
      .setCollector(this)
      .setConstruct(this.getCurrent())
      .setFile(this._file)
      .setTag(this.prefix);
  }

  /**
   * @returns {CallableFunction}
   */
  getFactory() {
    return this.factory ?? this.doFactory.bind(this);
  }

  /**
   * @param {SystemItem} item 
   * @returns {Object}
   */
  doFactory(item) {
    if (item.info.construct && typeof item.info.construct.factory === 'function') return item.info.construct.factory(item);
    return null;
  }

}