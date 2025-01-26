/**
 * @typedef T_Session
 * @property {string} ident
 */

const { io } = require('socket.io-client');
const { v4: UUID } = require('uuid');
const Cookies = require('js-cookie');

const AsyncHandler = require('zero-util/src/AsyncHandler');

const Mount = require('./Mount');

module.exports = class Client {

  constructor(socket = null) {
    this.context = null;
    this.events = new AsyncHandler();
    this._socket = socket;
    this._session = null;

    this.events.on(Mount.EVENT__MOUNT_SEND_REQUEST, this.onSendAddSession.bind(this));
    this.events.on(Mount.EVENT__MOUNT_SEND_RESPONSE, this.onSendAddSession.bind(this));

    this.mount = new Mount(this.socket, this.events);
    this.mount.setId(this.session.ident);
    this.mount.init();
  }

  /** @returns {T_Session} */
  get session() {
    if (this._session === null) {
      const session = JSON.parse(Cookies.get('zero.socket.session') ?? '{}');

      if (!session.ident) {
        this._session = {
          ident: UUID(),
        };
        Cookies.set('zero.socket.session', JSON.stringify(this._session), { path: '', expires: 5 });
      } else {
        this._session = session;
      }
    }
    return this._session;
  }

  /** @returns {import('socket.io-client').Socket} */
  get socket() {
    if (this._socket === null) {
      if (process.client) {
        this._socket = io(window.location.origin);
      } else {
        this._socket = io(`http://${this.context.req.headers.host}`);
      }
      if (this.mount)
      this._socket.on('response', this.onResponse.bind(this));
    }
    return this._socket;
  }

  /**
   * @param {import('../../RemoteSystem').T_NuxtContext} context 
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * @param {{ request: import('./Server').T_Request, response: import('./Server').T_Response }} param0
   */
  onSendAddSession({ request, response }) {
    if (request) request.meta.session = this.session;
    if (response) response.meta.session = this.session;
  }

}