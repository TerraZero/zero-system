const { EventEmitter } = require('events');

module.exports = class AsyncHandler extends EventEmitter {

  async trigger(event, ...args) {
    const listeners = this.listeners(event);
    for (const listener of listeners) {
      await listener(...args);
    }
  }

  async triggerFirst(event, ...args) {
    const listeners = this.listeners(event);
    for (const listener of listeners) {
      const response = await listener(...args);
      if (response !== undefined) {
        return response;
      }
    }
    return null;
  }

}