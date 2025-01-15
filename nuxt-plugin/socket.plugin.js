import Client from 'zero-system/src/Nuxt/Socket/Client';

const client = new Client();
export default client;

export function startup(context) {
  client.setContext(context);

  client.socket.on('response', response => {
    client.response(response);
  });
}