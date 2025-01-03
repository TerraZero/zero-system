import sio from 'socket.io';
import SocketServer from 'zero-system/src/Nuxt/Socket/SocketServer';

export default function () {
  this.nuxt.hook('listen', (server) => {
    const socket = sio(server, {
      cors: {
        origin: '*',
      },
    });

    const server = new SocketServer(socket);
    server.init();
  });
}