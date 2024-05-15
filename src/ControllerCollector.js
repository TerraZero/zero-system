const SystemCollector = require('./SystemCollector');

module.exports = class ControllerCollector extends SystemCollector {

  /**
   * @param {string} path 
   */
  constructor(path) {
    super('controller', path, '**/*.controller.js');
  }

  setCurrent(construct) {
    super.setCurrent(construct);
    this.add(construct.id).setTag('base');
  }

  /**
   * @param {string} name 
   * @param {(string|CallableFunction)} callable 
   * @returns {import('./SystemItem')}
   */
  addRoute(name, callable) {
    return this.add(this.getCurrent().id + '.' + name)
      .setAttribute('base', this.prefix + '.' + this.getCurrent().id)
      .setTag('route')
      .addAction('route', callable);
  }

  /**
   * @param {import('./SystemItem')} item 
   * @returns {Object}
   */
  doFactory(item) {
    const id = item.getAttribute('base');

    if (id === null) {
      const object = super.doFactory(item);
      if (object === null) return new item.info.construct();
      return object;
    }
    
    return SystemCollector.getItem(id).getObject();
  }

  getRoute(route) {
    const item = SystemCollector.getItem('controller.' + route);
    return item.getAction('route');
  }

}