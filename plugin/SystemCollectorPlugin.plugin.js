import RemoteSystem from '../src/RemoteSystem';

export default async (ctx, inject) => {
  inject('zero', new RemoteSystem());
};