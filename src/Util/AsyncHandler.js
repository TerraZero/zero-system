const { EventEmitter } = require('events');

module.exports = class AsyncHandler extends EventEmitter {

  /**
   * @param {string} eventname 
   * @param {CallableFunction} listener 
   * @param {string[]} mapper
   */
  on(eventname, listener, mapper = null) {
    if (mapper === null) {
      super.on(eventname, listener);
    } else {
      super.on(eventname, (event, ...tail) => {
        listener(event, ...mapper.map(f => event[f] ?? null), ...tail);
      });
    }
  }

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