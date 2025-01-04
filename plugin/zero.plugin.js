const RemoteSystem = require('zero-system/src/RemoteSystem');

export default async (ctx, inject) => {
  inject('zero', new RemoteSystem());
};