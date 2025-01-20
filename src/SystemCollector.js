const Path = require('path');
const Glob = require('glob');
const SystemItem = require('./SystemItem');
const Logger = require('./Log/Logger');

const register = [];
const paths = [];
let isUnpacked = false;

module.exports = class SystemCollector {

  static EVENT__COLLECT = 'system:collect';

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
   * @returns {Object<string, import('./SystemItem').T_SystemItemPack>}
   */
  static pack() {
    const pack = {};
    for (const item of SystemCollector.register) {
      const itemPack = item.pack();
      if (itemPack === null) continue;
      pack[itemPack.name] = itemPack;
    }
    return pack;
  }

  /**
   * @param {import('./SystemItem').T_SystemItemPack[]} items 
   */
  static unpack(items) {
    Logger.base.debug('Load SystemCollector in unpack mode with {num} items.', { num: items.length });
    isUnpacked = true;
    for (const item of items) {
      this.setItem(new SystemItem(item.name, null, item.info));
      Logger.base.debug('- Load item {service} -> {file}', { service: item.name, file: item.info.file });
    }
  }

  /** @returns {SystemItem[]} */
  static get register() {
    return register;
  }

  /** @returns {string[]} */
  static get paths() {
    return paths;
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
   * @template T
   * @param {(item: SystemItem) => ?T} predicate 
   * @returns {T[]}
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
   * @param {(item: SystemItem) => boolean} predicate 
   * @returns {?SystemItem}
   */
  static find(predicate) {
    for (const item of this.register) {
      if (predicate(item)) return item;
    }
    return null;
  }

  /**
   * @param {(item: SystemItem) => boolean} predicate 
   * @returns {SystemItem[]}
   */
  static finds(predicate) {
    const array = [];

    for (const item of this.register) {
      if (predicate(item)) array.push(item);
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
   * @returns {this}
   */
  static addCollector(collector) {
    SystemCollector.set(collector.id, collector, {
      tags: ['collector'],
    });
    return this;
  }

  /**
   * @param {boolean} reset 
   * @returns {this}
   */
  static collect(reset = false) {
    if (isUnpacked) {
      throw new Error('Collect method is forbidden in unpack mode.');
    }
    SystemCollector.each(item => {
      if (item.hasTag('collector')) {
        item.getObject().collect(reset);
      }
    });
    this.ZeroRoot.base.events.emit(SystemCollector.EVENT__COLLECT, this);
    return this;
  }

  /**
   * @param {string} prefix 
   * @param {string} path
   * @param {string} pattern
   */
  constructor(prefix, path, pattern) {
    this.prefix = prefix;
    this.path = path;
    this.pattern = pattern;
    this.logger = Logger.base.channel(prefix);

    this._current = null;
    this._file = null;
    this._collected = [];
  }

  get id() {
    return 'collector.' + this.prefix;
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
      .setCollector(this.id)
      .setConstruct(this._file)
      .setFile(this._file)
      .setTag(this.prefix);
  }

  /**
   * @template T
   * @param {SystemItem} item 
   * @param {new (...args) => T} Construct
   * @returns {T}
   */
  factory(item, Construct) {
    return new Construct();
  }

}