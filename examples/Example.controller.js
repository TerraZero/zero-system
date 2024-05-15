module.exports = class ExampleController {

  static get id() { return 'example' }

  /**
   * @param {import('../src/ControllerCollector')} collection
   */
  static define(collection) {
    collection
      .addRoute('serve', 'serve');

    collection
      .addRoute('func', 'func');
  }

  constructor() {
    this.index = 0;
  }

  func() {
    console.log(this.index++);
  }

  serve() {
    console.log(this.index++);
  }

}