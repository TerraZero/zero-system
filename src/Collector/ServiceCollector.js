const SystemCollector = require('../SystemCollector');

module.exports = class ServiceCollector extends SystemCollector {

  /**
   * @param {string} path 
   */
  constructor(path = '') {
    super('service', path, '**/*.service.js');
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