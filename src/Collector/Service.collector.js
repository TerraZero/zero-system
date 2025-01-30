const SystemCollector = require('../SystemCollector');

module.exports = class ServiceCollector extends SystemCollector {

  /**
   * @param {SystemCollector} collector 
   */
  static define(collector) {
    collector.add('service');
  }

  /**
   * @param {string} path 
   */
  constructor(path = 'Service') {
    super('service', path, '**/*.service.js');
  }

}