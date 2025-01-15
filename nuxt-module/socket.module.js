import sio from 'socket.io';
import Logger from 'zero-system/src/Log/Logger';
import Server from 'zero-system/src/Nuxt/Socket/Server';
import SystemCollector from 'zero-system/src/SystemCollector';
import ZeroRoot from 'zero-system/src/ZeroRoot';

let _remoteInfo = null;

export default function () {
  Logger.setDebug(true);
  this.nuxt.hook('listen', (http) => {
    const socket = sio(http, {
      cors: {
        origin: '*',
      },
    });

    const server = new Server(socket);
    server.init();
    SystemCollector.set('socket', server);
    SystemCollector.get('root').setup('moduleSocket', server);

    server.handler.on(Server.EVENT__SOCKET_CONNECT, ({ client }) => {

      console.log('client mount');
      client.mount.on('zero:remote-info', (request) => {
        if (_remoteInfo === null) {
          _remoteInfo = SystemCollector.finds(item => item.hasTag('remote')).map(item => {
            const info = {};
            const local = item.getAttribute('local');
            info.name = item.name;
            if (local) {
              const localItem = SystemCollector.getItem(item.getAttribute('local'));
              info.local = localItem.name;
              info.file = localItem.info.file;
              info.tags = localItem.info.tags;
              info.attributes = localItem.info.attributes ?? {};
            } else {
              info.tags = item.info.tags;
              info.attributes = item.info.attributes ?? {};
            }
            return info;
          });
        }
        client.send('response', {
          items: _remoteInfo,
        }, request.meta);
      });

    });
  });
}