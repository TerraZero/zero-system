const ZeroModule = require('../../../src/ZeroModule');

module.exports = class ControllerModule extends ZeroModule {

  /**
   * @param {import('../../../src/ModuleCollector')} collector 
   */
  static define(collector) {
    collector.add('controller');
  }

  init() {
    console.log('init controller', this.root);
  }

}