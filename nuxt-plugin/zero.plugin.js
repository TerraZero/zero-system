import RemoteSystem from 'zero-system/src/RemoteSystem';

export default async (ctx, inject) => {
  inject('zero', new RemoteSystem());
};