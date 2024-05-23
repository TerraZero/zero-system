const Path = require('path');
const scaffold = require('zero-scaffold');

const ModuleCollector = require('./ModuleCollector');
const SystemCollector = require('./SystemCollector');

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

    SystemCollector.addCollector(new ModuleCollector(this));
    SystemCollector.collect();
    this.hook('boot', this);
  }

  init() {
    SystemCollector.collect();
    this.hook('init', this);
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

  hook(hook, ...args) {
    SystemCollector.each(item => {
      if (item.hasTag('module') && typeof item.getObject()[hook] === 'function') {
        item.getObject()[hook](...args);
      }
    });
  }

  async hookAsync(hook, ...args) {
    for (const item of this.register) {
      if (item.hasTag('module') && typeof item.getObject()[hook] === 'function') {
        await item.getObject()[hook](...args);
      }
    }
  }

}