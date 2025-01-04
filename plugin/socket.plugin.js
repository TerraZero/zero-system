import Client from 'zero-system/src/Nuxt/Socket/Client';

export default async (ctx, inject) => {
  inject('socket', new Client());
};