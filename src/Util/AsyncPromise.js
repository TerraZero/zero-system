const { v4: UUID } = require('uuid');

module.exports = class AsyncPromise {

  /** @returns {Object<string, AsyncPromise>} */
  static get register() {
    if (this._register === undefined) {
      this._register = {};
    }
    return this._register;
  }

  /**
   * @param {AsyncPromise} promise 
   */
  static add(promise) {
    this.register[promise.uuid] = promise;
  }

  /**
   * @param {AsyncPromise} promise 
   */
  static remove(promise) {
    delete this.register[promise.uuid];
  }

  static resolve(uuid, value = null) {
    this.register[uuid].resolve(value);
  }

  static reject(uuid, value = null) {
    this.register[uuid].reject(value);
  }

  constructor() {
    this._res = null;
    this._rej = null;
    this.promise = new Promise((res, rej) => {
      this._res = res;
      this._rej = rej;
    });
    this.uuid = UUID();
    this.constructor.add(this);
  }

  resolve(value) {
    this._res(value);
    this.remove();
  }

  reject(value) {
    this._rej(value);
    this.remove();
  }

  remove() {
    this.constructor.remove(this);
  }

}