const SystemCollector = require('./SystemCollector');

module.exports = class ModuleCollector extends SystemCollector {

  /**
   * @param {string} path 
   * @param {import('./ZeroRoot')} root
   */
  constructor(root, path = '') {
    super('module', path, '**/*.module.js');
    this.root = root;
  }

  /**
   * @param {SystemItem} item 
   * @returns {Object}
   */
  doFactory(item) {
    if (item.info.construct) {
      if (typeof item.info.construct.factory === 'function') {
        return item.info.construct.factory(item, this.root);
      } else {
        return new item.info.construct(this.root);
      }
    }
    
    return null;
  }

}