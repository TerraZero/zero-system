import sio from 'socket.io';

import Logger from 'zero-system/src/Log/Logger';
import Server from 'zero-system/src/Nuxt/Socket/Server';
import SystemCollector from 'zero-system/src/SystemCollector';

export default function () {
  Logger.setDebug(true);
  this.nuxt.hook('listen', http => {
    const socket = sio(http, {
      cors: {
        origin: '*',
      },
    });

    const server = new Server(socket);
    server.init();
    SystemCollector.set('socket', server);
    SystemCollector.get('root').setup('moduleSocket', server);
  });
}