const SystemCollector = require('../SystemCollector');

module.exports = class RemoteCollector extends SystemCollector {

  /**
   * @param {SystemCollector} collector 
   */
  static define(collector) {
    collector.add('remote');
  }

  /**
   * @param {string} path 
   */
  constructor(path = 'Remote') {
    super('remote', path, '**/*.remote.js');
  }

}