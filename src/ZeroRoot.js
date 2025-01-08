const Path = require('path');
const scaffold = require('zero-scaffold');

const SystemCollector = require('./SystemCollector');
const ModuleCollector = require('./Collector/ModuleCollector');
const ServiceCollector = require('./Collector/ServiceCollector');
const StringUtil = require('./Util/StringUtil');

module.exports = class ZeroRoot {

  /**
   * @param {string} root 
   * @param {import('express').Express} app 
   */
  constructor(root, app) {
    SystemCollector.set('root', this);
    SystemCollector.addPath(root);
    this.root = root;
    this.app = app;

    this.setups = {};
  }

  /**
   * @param  {...string} paths 
   * @returns {string}
   */
  path(...paths) {
    return Path.join(this.root, ...paths);
  }

  boot() {
    const zero = scaffold.getZeroJson(this.root);
    if (zero) this.initModule(zero, this.root);

    SystemCollector.events.on('system:collect', () => {
      this.doSetup();
    });

    SystemCollector.addCollector(new ModuleCollector(this));
    SystemCollector.addCollector(new ServiceCollector());
    SystemCollector.collect();
    this.setup('boot', this);
  }

  init() {
    SystemCollector.collect();
    this.setup('init', this);
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
  }

}