import Logger from '../../Log/Logger';
import AsyncHandler from '../../Util/AsyncHandler';
import Item from './Item';

export default class Server {

  /**
   * @param {import('socket.io')} socket
   * @param {Logger} logger
   */
  constructor(socket, logger = null) {
    this.socket = socket;
    this.clients = [];
    this.logger = null;
    this.handler = new AsyncHandler();

    this.setLogger(logger);

    this.logger.debug('Create socket server');
  }

  /**
   * @param {Logger} logger 
   * @param {this}
   */
  setLogger(logger = null) {
    if (logger === null && !this.logger) {
      logger = Logger.base.channel('socket');
    }
    this.logger = logger;
    return this;
  }

  init() {
    this.logger.debug('Init socket server');

    try {
      this.socket.on('connection', async mount => {
        this.logger.debug('Client {id} connect ...', { id: mount.id });

        const client = new Item(this, mount);
        client.init();
        this.clients.push(client);

        client.on('disconnect', async () => {
          this.logger.debug('Client {id} disconnect ...', { id: client.id });

          const index = this.clients.findIndex(v => v.id === client.id);
          this.clients.splice(index, 1);

          await this.handler.trigger('socket:disconnect', {
            server: this,
            socket: this.socket,
            client,
          });

          this.broadcast('server:controller', 'info', {
            type: 'disconnect',
            client: client.ident,
          });
        });

        await this.handler.trigger('socket:connection', {
          server: this,
          socket: this.socket,
          client,
        });

        this.broadcast('server:controller', 'info', {
          type: 'connect',
          client: client.ident,
        });

        this.logger.debug('Client {id} connected', { id: client.id });
      });
    } catch (error) {
      this.logger.exception(error, 'Fatal error');
    }

    this.logger.debug('Inited socket server');
  }

  /**
   * @param {string} event 
   * @param {string} handler 
   * @param {Object} data 
   */
  broadcast(event, handler, data) {
    this.logger.debug('Broadcast {event} with handler {handler} ...', { event, handler });
    this.socket.emit(event, { handler, data });
  }

}