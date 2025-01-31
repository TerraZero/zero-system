const SystemCollector = require('../SystemCollector');

module.exports = class ModuleCollector extends SystemCollector {

  /**
   * @param {SystemCollector} collector 
   */
  static define(collector) {
    collector.add('module');
  }

  /**
   * @param {import('./ZeroRoot')} root
   */
  constructor(path = '') {
    super('module', path, '**/*.module.js');
  }

  /**
   * @param {import('../SystemItem')} item 
   * @param {NewableFunction} Construct
   * @returns {*}
   */
  factory(item, Construct) {
    return new Construct(SystemCollector.get('root'));
  }

}