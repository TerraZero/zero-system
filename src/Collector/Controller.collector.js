const SystemCollector = require('../SystemCollector');

module.exports = class ControllerCollector extends SystemCollector {

  /**
   * @param {SystemCollector} collector 
   */
  static define(collector) {
    collector.add('controller');
  }

  /**
   * @param {string} path 
   */
  constructor(path = 'Controller') {
    super('controller', path, '**/*.controller.js');
  }

  /**
   * @param {NewableFunction} construct 
   * @param {string} file 
   */
  setCurrent(construct, file) {
    super.setCurrent(construct, file);
    this.add(construct.id).setTag('base');
  }

  /**
   * @param {string} name 
   * @param {string} path
   * @param {(string|CallableFunction)} callable 
   * @returns {import('../SystemItem')}
   */
  addRoute(name, path, callable = null) {
    return this.add(this.getCurrent().id + '.' + name)
      .setAttribute('base', this.prefix + '.' + this.getCurrent().id)
      .setAttribute('path', path)
      .setTag('route')
      .addAction('route', callable ?? name);
  }

  /**
   * @param {import('../SystemItem')} item 
   * @param {NewableFunction} Construct
   * @returns {*}
   */
  factory(item, Construct) {
    const id = item.getAttribute('base');

    if (id === null) {
      return new Construct();
    }

    return SystemCollector.get(id);
  } 

  getRoute(route) {
    const item = SystemCollector.getItem('controller.' + route);
    return item.getAction('route');
  }

}