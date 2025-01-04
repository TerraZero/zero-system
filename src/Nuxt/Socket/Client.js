const { io } = require('socket.io-client');
const { v4: UUID } = require('uuid');

export default class Client {

  constructor(socket = null) {
    this._socket = socket;
  }

  /** @returns {import('socket.io-client').Socket} */
  get socket() {
    if (this._socket === null) {
      this._socket = io(window.location.protocol + '//' + window.location.host);
    }
    return this._socket;
  }

}