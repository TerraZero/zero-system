import sio from 'socket.io';
import Server from 'zero-system/src/Nuxt/Socket/Server';
import SystemCollector from 'zero-system/src/SystemCollector';

export default function () {
  this.nuxt.hook('listen', (http) => {
    const socket = sio(http, {
      cors: {
        origin: '*',
      },
    });

    const server = new Server(socket);
    server.init();
    SystemCollector.set('socket', server);
  });
}