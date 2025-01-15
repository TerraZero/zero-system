const SystemCollector = require('../SystemCollector');

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
   * @param {NewableFunction} Construct
   * @returns {*}
   */
  factory(item, Construct) {
    return new Construct(this.root);
  }

}