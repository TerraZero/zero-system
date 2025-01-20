/**
 * @typedef T_Session
 * @property {string} ident
 */

const { io } = require('socket.io-client');
const { v4: UUID } = require('uuid');
const Cookies = require('js-cookie');

const AsyncPromise = require('../../Util/AsyncPromise');

module.exports = class Client {

  constructor(socket = null) {
    this.context = null;
    this._socket = socket;
    this._session = null;
  }

  /** @returns {T_Session} */
  get session() {
    if (this._session === null) {
      const session = JSON.parse(Cookies.get('zero.socket.session') ?? '{}');

      if (!session.ident) {
        this._session = {
          ident: UUID(),
        };
        Cookies.set('zero.socket.session', JSON.stringify(this._session), { path: '', expires: 2 });
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
    }
    return this._socket;
  }

  /**
   * @param {import('../../RemoteSystem').T_NuxtContext} context 
   */
  setContext(context) {
    this.context = context;
  }

  response(response) {
    AsyncPromise.resolve(response.meta.uuid, response);
  }

  async request(event, ...args) {
    const point = new AsyncPromise();
    this.socket.emit(event, {
      meta: {
        uuid: point.uuid,
        session: this.session,
      },
      args,
    });
    return point.promise;
  }

}