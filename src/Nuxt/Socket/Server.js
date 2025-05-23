const AsyncHandler = require('zero-util/src/AsyncHandler');

const Logger = require('../../Log/Logger');
const Mount = require('./Mount');

/**
 * @callback C_SessionHandler
 * @param {Mount.T_RequestEvent} event
 * @param {string} key
 * @param {any} value
 * @returns {Promise<any>}
 */

/**
 * @callback C_SessionFunction
 * @param {string} key
 * @param {any} value
 * @returns {Promise<any>}
 */

/**
 * @typedef {Object} T_Request
 * @property {string} event
 * @property {any} data
 * @property {Object} meta
 * @property {string} meta.uuid
 * @property {import('../../Util/ErrorUtil').T_ErrorSerialize} meta.error
 * @property {string} meta.session
 * @property {Object} server
 * @property {number} server.timestamp
 * @property {C_SessionFunction} server.session
 */

/**
 * @callback C_Handler
 * @param {T_Request} request
 * @param {import('./Mount')} mount
 * @param {(data: any) => void} answer
 */

/**
 * @typedef {Object} T_Response
 * @property {Object} meta
 * @property {string} meta.uuid
 * @property {import('../../Util/ErrorUtil').T_ErrorSerialize} meta.error
 * @property {string} meta.session
 * @property {any} data
 */

module.exports = class Server {

  /**
   * @param {import('socket.io')} socket
   * @param {Logger} logger
   */
  constructor(socket, logger = null) {
    this.socket = socket;
    this.clients = [];
    this.logger = null;
    this.events = new AsyncHandler();

    this.events.on(Mount.EVENT__MOUNT_GET_REQUEST_PREPARE, (event) => {
      event.request.server = {
        session: async (key, value) => {
          if (this.sessionHandler === null) {
            throw new Error('No session handler awailable.');
          } else {
            return await this.sessionHandler(event, key, value);
          }
        },
        timestamp: this.timestamp,
      };
    });
    this.events.on(Mount.EVENT__MOUNT_SEND_RESPONSE_POST, ({ request }) => {
      delete request.server;
    });

    this.handlers = {};
    this.sessionHandler = null;

    this.setLogger(logger);
    this.logger.debug('Create socket server');
  }

  get timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * @param {C_SessionHandler} callback 
   * @returns {this}
   */
  setSessionHandler(callback) {
    this.sessionHandler = callback;
    return this;
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
      this.socket.on('connection', async socket => {
        this.logger.debug('Client {id} connect ...', { id: socket.id });

        const mount = new Mount(socket, this.events, this.handlers);
        mount.init();
        this.clients.push(mount);

        mount.socket.on('disconnect', async () => {
          this.logger.debug('Client {id} disconnect ...', { id: mount.id });

          const index = this.clients.findIndex(v => v.id === mount.id);
          this.clients.splice(index, 1);

          await this.events.trigger(Mount.EVENT__SOCKET_DISCONNECT, {
            server: this,
            socket: this.socket,
            mount,
          });

          this.broadcast('server:controller', 'info', {
            type: 'disconnect',
            mount: mount.id,
          });
        });

        await this.events.trigger(Mount.EVENT__SOCKET_CONNECT, {
          server: this,
          socket: this.socket,
          mount,
        });

        this.broadcast('server:controller', 'info', {
          type: 'connect',
          mount: mount.id,
        });

        this.logger.debug('Client {id} connected', { id: mount.id });
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
   * @param {string} event 
   * @param {C_Handler} handler 
   * @param {number} prio 
   * @returns {this}
   */
  addHandler(event, handler, prio = 0) {
    this.handlers[event] ??= [];
    this.handlers[event].push({ handler, prio });
    this.handlers[event].sort((a, b) => a.prio - b.prio);
    return this;
  }

}