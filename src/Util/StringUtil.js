/**
 * @callback StringInserter
 * @param {string} match
 * @param {string} message
 * @returns {string}
 */

module.exports = class StringUtil {

  /**
   * @param {string} message
   * @param {(Array|Object<string, string>|StringInserter)} placeholders
   * @param {(string|StringInserter)} inserter
   * @returns {string}
   */
  static replaceMessage(message, placeholders, inserter = '"') {
    if (typeof placeholders === 'function') {
      return this.replaceCallback(message, placeholders);
    } else if (Array.isArray(placeholders)) {
      return this.replaceArray(message, placeholders, inserter);
    } else {
      return this.replaceObject(message, placeholders, inserter);
    }
  }

  /**
   * @param {string} message
   * @param {Array} placeholders
   * @param {(string|StringInserter)} inserter
   * @returns {string}
   */
  static replaceArray(message, placeholders = [], inserter = '"') {
    let doInserter = inserter;

    if (typeof doInserter !== 'function') {
      doInserter = (v) => {
        if (typeof inserter === 'string') {
          return inserter + v + inserter;
        }
        return v;
      };
    }

    for (const index in placeholders) {
      message = message.replace(new RegExp('\\[' + index + '\\]', 'g'), doInserter(placeholders[index]));
    }
    return message;
  }

  /**
   * @param {string} message
   * @param {Object<string, string>} placeholders
   * @param {(string|StringInserter)} inserter
   * @returns {string}
   */
  static replaceObject(message, placeholders = {}, inserter = '"') {
    let doInserter = inserter;

    if (typeof doInserter !== 'function') {
      doInserter = (v) => {
        if (typeof inserter === 'string') {
          return inserter + v + inserter;
        }
        return v;
      };
    }

    for (const placeholder in placeholders) {
      message = message.replace(new RegExp('\\{' + placeholder + '\\}', 'g'), doInserter(placeholders[placeholder]));
    }
    return message;
  }

  /**
   * @param {string} message 
   * @param {StringInserter} callback 
   * @returns {string}
   */
  static replaceCallback(message, callback) {
    message = message.replace(new RegExp('(\\{[^}]*\\})', 'g'), (match, ...info) => {
      return callback(match.substring(1, match.length - 1), message, info);
    });
    return message;
  }

  /**
   * @param {string} string 
   * @returns {string}
   */
  static ucFirst(string) {
    return string.substring(0, 1).toUpperCase() + string.substring(1);
  }

}