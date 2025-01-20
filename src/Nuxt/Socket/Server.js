/**
 * @typedef {Object} T_Request
 * @property {string} event
 * @property {any} data
 * @property {Object} meta
 */

const Logger = require('../../Log/Logger');
const AsyncHandler = require('../../Util/AsyncHandler');
const Item = require('./Item');

module.exports = class Server {

  static EVENT__SOCKET_CONNECT = 'socket:connection';
  static EVENT__SOCKET_DISCONNECT = 'socket:disconnect';
  static EVENT__SOCKET_REQUEST = 'socket:request';
  static EVENT__SOCKET_RESPONSE = 'socket:response';

  /**
   * @param {import('socket.io')} socket
   * @param {Logger} logger
   */
  constructor(socket, logger = null) {
    this.socket = socket;
    this.clients = [];
    this.logger = null;
    this.events = new AsyncHandler();
    this.handlers = {};

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

          await this.events.trigger(Server.EVENT__SOCKET_DISCONNECT, {
            server: this,
            socket: this.socket,
            client,
          });

          this.broadcast('server:controller', 'info', {
            type: 'disconnect',
            client: client.ident,
          });
        });

        client.on('request', this.onRequest.bind(this));

        await this.events.trigger(Server.EVENT__SOCKET_CONNECT, {
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

  /**
   * @param {string} name 
   * @param {(request: T_Request, client: Object, answer) => any} handler 
   * @param {number} prio 
   * @returns {this}
   */
  addHandler(name, handler, prio = 0) {
    this.handlers[name] ??= [];
    this.handlers[name].push({ handler, prio });
    this.handlers[name].sort((a, b) => a.prio - b.prio);
    return this;
  }

  /**
   * @param {Item} client
   * @param {T_Request} request 
   */
  async onRequest(client, request) {
    await this.events.trigger(Server.EVENT__SOCKET_REQUEST, { client, request });
    if (this.handlers[request.event]) {
      try {
        let response = undefined;
        for (const handler of this.handlers[request.event]) {
          await handler.handler(request, client, (value = null) => {
            response = value;
          });
          if (response !== undefined) break;
        }
        client.response(request, response);
      } catch (e) {
        this.logger.debugException(e);
        request.meta.error = e.message;
        request.meta.exception = e;
        client.response(request);
      }
    } else {
      request.meta.error = `No handlers for ${request.event} defined.`;
      client.response(request);
    }
  }

}