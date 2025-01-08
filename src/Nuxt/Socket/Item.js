module.exports = class Item {

  /**
   * @param {import('./SocketServer').default} socket 
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

  on(event, listener) {
    this.mount.on(event, listener);
    return this;
  }

}