const SystemCollector = require('../SystemCollector');

module.exports = class ServiceCollector extends SystemCollector {

  /**
   * @param {string} path 
   */
  constructor(path = '') {
    super('service', path, '**/*.service.js');
  }

}