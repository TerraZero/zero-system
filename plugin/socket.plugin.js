import SocketClient from 'zero-system/src/Nuxt/Socket/SocketClient';

export default async (ctx, inject) => {
  inject('socket', new SocketClient());
};