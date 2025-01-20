module.exports = class Item {

  /**
   * Lazy load Server
   * @returns {typeof import('./Server')}
   */
  static get Server() {
    if (this._Server === undefined) {
      this._Server = require('./Server');
    }
    return this._Server;
  }

  /**
   * @param {import('./Server')} socket 
   * @param {import('socket.io').Socket} mount 
   */
  constructor(socket, mount) {
    this.socket = socket;
    this.mount = mount;
    this.logger = this.socket.logger.channel(this.mount.id);
    this.info = {};
  }

  get id() {
    return this.mount.id;
  }

  get ident() {
    return {
      id: this.id,
      info: this.info,
    };
  }

  init() {
    this.mount.on('server:controller', async ({ handler, data }) => {
      let response = {};
      await this.socket.handler.trigger('handler:' + handler, { data, response });
      this.send('server:controller', { handler, data, response });
    });
  }

  send(event, data) {
    this.mount.emit(event, {
      client: this.ident,
      data,
    });
  }

  /**
   * @param {import('./Server').T_Request} request 
   * @param {any} data 
   */
  async response(request, data = null) {
    await this.socket.events.trigger(Item.Server.EVENT__SOCKET_RESPONSE, { request, data });
    this.mount.send('response', {
      meta: request.meta,
      data,
    });
  }

  /**
   * @param {string} event 
   * @param {(client: Item, ...args: any)} listener 
   * @returns 
   */
  on(event, listener) {
    this.mount.on(event, (...args) => {
      listener(this, ...args);
    });
    return this;
  }

}