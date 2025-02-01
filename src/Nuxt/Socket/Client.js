const { io } = require('socket.io-client');
const Cookies = require('js-cookie');

const AsyncHandler = require('zero-util/src/AsyncHandler');
const Logger = require('zero-system/src/Log/Logger');

const Mount = require('./Mount');

module.exports = class Client {

  constructor(socket = null) {
    this.context = null;
    this.events = new AsyncHandler();
    this._socket = socket;
    this._session = undefined;

    this.events.on(Mount.EVENT__MOUNT_GET_RESPONSE, this.onGetResponse.bind(this));
    this.events.on(Mount.EVENT__MOUNT_SEND_REQUEST, this.onSendAddSession.bind(this));
    this.events.on(Mount.EVENT__MOUNT_SEND_RESPONSE, this.onSendAddSession.bind(this));

    this.mount = new Mount(this.socket, this.events);
    if (this.session !== null) {
      Logger.base.debug('Has session {session}', { session: this._session });
      this.mount.setId(this.session);
    }
    this.mount.init();
  }

  /** @returns {?string} */
  get session() {
    if (this._session === undefined) {
      this._session = Cookies.get('zero.socket.session') ?? null;
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

  setSession(id, expired = 5) {
    this._session = id;
    this.mount.setId(id);
    Cookies.set('zero.socket.session', this._session, { path: '', expires });
    Logger.base.debug('Set session {session}', { session: this._session });
    return this;
  }

  /**
   * @param {import('../../RemoteSystem').T_NuxtContext} context 
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * @param {{ request: import('./Server').T_Request, response: import('./Server').T_Response }} params
   */
  onSendAddSession({ request, response }) {
    if (request) request.meta.session = this.session;
    if (response) response.meta.session = this.session;
  }

  /**
   * @param {{ response: import('./Server').T_Response }} params
   */
  onGetResponse({ response }) {
    if (response.meta.session && this.session !== response.meta.session) {
      this.setSession(response.meta.session);
    }
  }

}