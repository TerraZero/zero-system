const SystemCollector = require('../SystemCollector');

module.exports = class RemoteCollector extends SystemCollector {

  /**
   * @param {string} path 
   */
  constructor(path = 'Remote') {
    super('remote', path, '**/*.remote.js');
  }

}