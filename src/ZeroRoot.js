const Path = require('path');
const scaffold = require('zero-scaffold');

const StringUtil = require('zero-util/src/StringUtil');
const AsyncHandler = require('zero-util/src/AsyncHandler');

const SystemCollector = require('./SystemCollector');
const ModuleCollector = require('./Collector/ModuleCollector');
const ServiceCollector = require('./Collector/ServiceCollector');

module.exports = class ZeroRoot {

  static EVENT__BOOT = 'boot';
  static EVENT__INIT = 'init';

  /** @returns {ZeroRoot} */
  static get base() {
    return this._instance;
  }

  /**
   * @param  {...string} paths 
   * @returns {string}
   */
  static getRequirePath(...paths) {
    const fullpath = Path.join(...paths);
    
    if (Path.isAbsolute(fullpath)) {
      if (fullpath.startsWith(Path.normalize(this.base.root))) {
        return Path.join(this.base.subroot, fullpath.substring(Path.normalize(this.base.root).length)).replace(/\\/g, '/');
      }
    } else {
      if (require.resolve(fullpath)) {
        return fullpath;
      } 
      if (require.resolve(Path.join('~', fullpath))) {
        return Path.join('~', fullpath);
      }
    }
    throw new Error('Could not create require path: "' + fullpath + '"');
  }

  /**
   * @param {string} path 
   * @returns {string}
   */
  static getRealRequirePath(path) {
    path = Path.normalize(path);
    if (path.startsWith(this.base.subroot)) {
      return Path.join(this.base.root, path.substring(this.base.subroot.length));
    } else {
      return path;
    }
  } 

  /**
   * @param {string} root 
   * @param {string} subroot
   */
  constructor(root, subroot = '') {
    this.constructor._instance = this;
    this._root = root;
    this._subroot = subroot;
    SystemCollector.set('root', this);
    SystemCollector.addPath(root);
    this.events = new AsyncHandler();

    this.setups = {};
  }

  get root() {
    return Path.normalize(this._root);
  }

  get subroot() {
    return Path.normalize(this._subroot);
  }

  /**
   * @param  {...string} paths 
   * @returns {string}
   */
  path(...paths) {
    const fullpath = Path.join(...paths);
    if (Path.isAbsolute(fullpath)) {
      return fullpath;
    }
    return Path.join(this.root, fullpath);
  }

  /**
   * @param  {...string} paths 
   * @returns {string}
   */
  pathrel(...paths) {
    const fullpath = Path.join(...paths);
    if (Path.isAbsolute(fullpath)) {
      if (fullpath.startsWith(Path.normalize(this.root))) {
        return fullpath.substring(Path.normalize(this.root).length);
      }
    }
    return fullpath;
  }

  boot() {
    const zero = scaffold.getZeroJson(this.root);
    if (zero) this.initModule(zero, this.root);

    this.events.on(SystemCollector.EVENT__COLLECT, () => {
      this.doSetup();
    });

    SystemCollector.addCollector(new ModuleCollector(this));
    SystemCollector.addCollector(new ServiceCollector());
    SystemCollector.collect();
    this.setup('boot', this);
    SystemCollector.collect();
    this.events.emit(ZeroRoot.EVENT__BOOT, this);
  }

  init() {
    this.setup('init', this);
    this.events.emit(ZeroRoot.EVENT__INIT, this);
  }

  /**
   * @param {import('zero-scaffold/src/Scaffold').T_ZeroConfig} config 
   * @param {string} path
   */
  initModule(config, path) {
    for (const mod of (config?.includes || [])) {
      const root = scaffold.findPackageRootModule(mod);
      const zero = scaffold.getZeroJson(root);
      if (zero) this.initModule(zero, root);
    }
    if (config?.root) {
      SystemCollector.addPath(Path.join(path, config.root));
    }
  }

  setup(setup, ...args) {
    if (this.setups[setup] !== undefined) return false;

    this.setups[setup] = {
      register: [],
      args,
    };
    this.doSetup();
    return true;
  }

  doSetup() {
    for (const setup in this.setups) {
      for (const item of SystemCollector.register) {
        if (item.hasTag('module') && !this.setups[setup].register.includes(item.name)) {
          const object = item.getObject();
          const funcname = 'setup' + StringUtil.ucFirst(setup);
          if (typeof object[funcname] === 'function') {
            object[funcname](...this.setups[setup].args);
          }
          this.setups[setup].register.push(item.name);
        }
      }
    }
  }

  hook(hook, ...args) {
    for (const item of SystemCollector.register) {
      if (item.hasTag('module')) {
        const object = item.getObject();
        const funcname = 'hook' + StringUtil.ucFirst(hook);
        if (typeof object[funcname] === 'function') {
          object[funcname](...args);
        }
      }
    }
    this.events.emit('hook:' + hook, { args });
  }

  async hookAsync(hook, ...args) {
    for (const item of SystemCollector.register) {
      if (item.hasTag('module')) {
        const object = item.getObject();
        const funcname = 'hook' + StringUtil.ucFirst(hook);
        if (typeof object[funcname] === 'function') {
          await object[funcname](...args);
        }
      }
    }
    await this.events.trigger('hook:' + hook, { args });
  }

}