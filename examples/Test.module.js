const ZeroModule = require('../src/ZeroModule');

module.exports = class TestModule extends ZeroModule {

  /**
   * @param {import('../src/ModuleCollector')} collector 
   */
  static define(collector) {
    collector.add('test');
  }

  init() {
    console.log('init test', this.root);
  }

}