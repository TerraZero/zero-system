import StringUtil from '../Util/StringUtil';

let _debug = false;
let _instance = null;

export default class Logger {

  /** @returns {Logger} */
  static get base() {
    if (_instance === null) {
      _instance = new Logger(['System']);
    }
    return _instance;
  }

  /**
   * @param {boolean} debug 
   */
  static setDebug(debug) {
    _debug = debug;
  }

  /**
   * @returns {boolean}
   */
  static isDebug() {
    return _debug;
  }

  constructor(ids = []) {
    this.ids = ids;
  }
  
  get id() {
    return '[' + this.ids.join('-') + ']';
  }

  isDebug() {
    return _debug;
  }

  /**
   * Create a new logger instance with new id.
   * 
   * @param {string} channel 
   * @returns {Logger}
   */
  channel(channel) {
    return new Logger([...this.ids, channel]);
  }

  log(message, placeholders = {}, type = 'note') {
    switch (type) {
      case 'debug':
        this.debug(message, placeholders);
        break;
      case 'note':
        this.note(message, placeholders);
        break;
      case 'warn':
        this.note(message, placeholders);
        break;
      case 'error':
        this.note(message, placeholders);
        break;
      default:
        throw new Error('Only "note", "warn" and "error" are supported log types.');
    }
  }

  /**
   * @param {string} message
   * @param {(Array|Object<string, string>|StringInserter)} placeholders
   */
  debug(message, placeholders = {}) {
    if (_debug) {
      console.log(this.id , 'DEBUG:', StringUtil.replaceMessage(message, placeholders));
    }
  }

  /**
   * @param {string} message
   * @param {(Array|Object<string, string>|StringInserter)} placeholders
   */
  note(message, placeholders = {}) {
    console.log(this.id + ':', StringUtil.replaceMessage(message, placeholders));
  }

  /**
   * @param {string} message
   * @param {(Array|Object<string, string>|StringInserter)} placeholders
   */
  warn(message, placeholders = {}) {
    console.log(this.id, 'WARNING:', StringUtil.replaceMessage(message, placeholders));
  }

  /**
   * @param {string} message
   * @param {(Array|Object<string, string>|StringInserter)} placeholders
   */
  error(message, placeholders = {}) {
    console.log(this.id, 'ERROR:', StringUtil.replaceMessage(message, placeholders));
  }

  /**
   * @param {Error} error
   * @param {string} message
   * @param {(Array|Object<string, string>|StringInserter)} placeholders
   */
  exception(error, message = null, placeholders = {}) {
    console.log(this.id, 'EXCEPTION:', error);
  }

}