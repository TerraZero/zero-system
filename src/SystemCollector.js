const Path = require('path');
const Glob = require('glob');
const SystemItem = require('./SystemItem');

const register = [];

module.exports = class SystemCollector {

  /** @returns {SystemItem[]} */
  static get register() {
    return register;
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
   * @returns {Object[]}
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
   */
  static collect(collector) {
    collector.collect();
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

    this._current = null;
  }

  collect() {
    SystemCollector.set('collector.' + this.prefix, this);

    const files = Glob.sync(this.pattern, {
      cwd: this.path,
    });

    for (const file of files) {
      this.setCurrent(require(Path.join(this.path, file)));
      this.getCurrent().define(this);
    }
  }

  setCurrent(construct) {
    this._current = construct;
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
      .setConstruct(this._current)
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