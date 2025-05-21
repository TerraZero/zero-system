const ErrorUtil = require('zero-util/src/ErrorUtil');
const AsyncPromise = require('zero-util/src/AsyncPromise');

const Logger = require('../../Log/Logger');

/**
 * @typedef {Object} T_RequestEvent
 * @property {import('./Server').T_Request} request
 * @property {AsyncPromise} promise
 * @property {import('./Mount')} mount
 */

/**
 * @typedef {Object} T_ResponseEvent
 * @property {import('./Server').T_Request} request
 * @property {import('./Mount')} mount
 */

module.exports = class Mount {

  static EVENT__SOCKET_CONNECT = 'socket:connection';
  static EVENT__SOCKET_DISCONNECT = 'socket:disconnect';
  static EVENT__SOCKET_INIT = 'socket:init';
  static EVENT__MOUNT_SEND_REQUEST = 'socket:request:send';
  static EVENT__MOUNT_SEND_REQUEST_POST = 'socket:request:sendpost';
  static EVENT__MOUNT_SEND_RESPONSE = 'socket:response:send';
  static EVENT__MOUNT_SEND_RESPONSE_POST = 'socket:response:sendpost';
  static EVENT__MOUNT_GET_REQUEST_PREPARE = 'socket:request:getprepare';
  static EVENT__MOUNT_GET_REQUEST = 'socket:request:get';
  static EVENT__MOUNT_GET_RESPONSE = 'socket:response:get';
  static EVENT__MOUNT_GET_RESPONSE_REJECT = 'socket:response:reject';

  /**
   * @param {import('socket.io').Socket} socket
   * @param {import('../../Util/AsyncHandler')} events
   * @param {Object<string, import('./Server').C_Handler>} handlers
   * @param {Logger} logger
   */
  constructor(socket, events, handlers = {}, logger = null) {
    this.socket = socket;
    this.events = events;
    this.logger = (logger ?? Logger.base).channel(this.socket.id);
    this.handlers = handlers;
    this.info = {};

    this._id = null;
  }

  get id() {
    return this._id ?? this.socket.id;
  }

  init() {
    this.socket.on('request', this.onRequest.bind(this));
    this.socket.on('response', this.onResponse.bind(this));
    this.events.emit(Mount.EVENT__SOCKET_INIT, { mount: this });
  }

  setId(id) {
    this._id = id;
    return this;
  }

  /**
   * @param {string} event 
   * @param {import('./Server').C_Handler} handler 
   * @param {number} prio 
   * @returns {this}
   */
  addHandler(event, handler, prio = 0) {
    this.handlers[event] ??= [];
    this.handlers[event].push({ handler, prio });
    this.handlers[event].sort((a, b) => a.prio - b.prio);
    return this;
  }

  /**
   * @param {string} event 
   * @param {any} data 
   * @returns {import('./Server').T_Response}
   */
  async request(event, data, meta = {}) {
    const promise = new AsyncPromise();
    meta.uuid = promise.uuid;
    if (typeof meta.timeout !== 'number') {
      meta.timeout = 1000;
    }
    const request = {
      event, 
      meta,
      data,
    };
    await this.events.trigger(Mount.EVENT__MOUNT_SEND_REQUEST, { request, promise, mount: this });
    await this.events.trigger(Mount.EVENT__MOUNT_SEND_REQUEST_POST, { request, promise, mount: this });
    this.logger.debug('Request {request} - {uuid}', { request: request.event, uuid: request.meta.uuid });
    this.socket.emit('request', request);
    return promise.timeout(meta.timeout).promise;
  }

  /**
   * @param {import('./Server').T_Request} request 
   * @param {any} data 
   */
  async response(request, data = null) {
    if (request.meta.error instanceof Error) {
      request.meta.error = ErrorUtil.serialize(request.meta.error);
    }
    const response = {
      meta: request.meta,
      data,
    };
    await this.events.trigger(Mount.EVENT__MOUNT_SEND_RESPONSE, { response, mount: this });
    await this.events.trigger(Mount.EVENT__MOUNT_SEND_RESPONSE_POST, { request, mount: this });
    this.logger.debug('Response {response} - {uuid}', { response: request.event, uuid: response.meta.uuid });
    this.socket.emit('response', response);
  }

  /**
   * @param {import('./Server').T_Request} request 
   */
  async onRequest(request) {
    this.logger.debug('On request {request} - {uuid}', { request: request.event, uuid: request.meta.uuid });
    await this.events.trigger(Mount.EVENT__MOUNT_GET_REQUEST_PREPARE, { request, mount: this });
    await this.events.trigger(Mount.EVENT__MOUNT_GET_REQUEST, { request, mount: this });
    if (this.handlers[request.event]) {
      try {
        let response = undefined;
        for (const handler of this.handlers[request.event]) {
          await handler.handler(request, this, (value = null) => {
            response = value;
          });
          if (response !== undefined) break;
        }
        if (response === undefined) {
          request.meta.error = `No handlers responsible for request ${request.event}.`;
          this.response(request);
        } else {
          this.response(request, response);
        }
      } catch (e) {
        this.logger.debugException(e);
        request.meta.error = e.message;
        request.meta.exception = e;
        this.response(request);
      }
    } else {
      request.meta.error = `No handlers for ${request.event} defined.`;
      this.response(request);
    }
  }

  /**
   * @param {import('./Server').T_Response} response 
   */
  async onResponse(response) {
    const promise = AsyncPromise.get(response.meta.uuid);
    if (promise === null) return;

    this.logger.debug('On response {uuid}', { uuid: response.meta.uuid });
    if (response.meta.error) {
      const error = ErrorUtil.deserialize(response.meta.error);
      ErrorUtil.appendStack(error, promise.stack, ' REQUEST ' + response.meta.uuid + ' ');
      error.response = response;
      await this.events.trigger(Mount.EVENT__MOUNT_GET_RESPONSE_REJECT, { response, mount: this });
      AsyncPromise.reject(response.meta.uuid, error);
    } else {
      await this.events.trigger(Mount.EVENT__MOUNT_GET_RESPONSE, { response, mount: this });
      AsyncPromise.resolve(response.meta.uuid, response);
    }
  }

}