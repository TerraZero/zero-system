module.exports = class ZeroModule {

  /**
   * @param {import('./ZeroRoot')} root 
   */
  constructor(root) {
    this.root = root;
  }

}