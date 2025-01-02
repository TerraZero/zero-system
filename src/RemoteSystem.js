module.exports = class RemoteSystem {

  /**
   * @param {string} name 
   * @returns 
   */
  static createRemoteProxy(name) {
    return new Proxy({}, {

      get(target, prop, receiver) {
        return async (...args) => {
          return await RemoteSystem.socketCall(name, prop, {
            args,
          });
        };
      },

    });
  }

  /**
   * @param {string} name 
   * @param {string} prop 
   * @param {Object} data 
   * @returns {*}
   */
  static async socketCall(name, prop, data = {}) {
    console.log('RemoteSystem.socketCall', name, prop, data);
  }

}