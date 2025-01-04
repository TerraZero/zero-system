import RegistryValue from '~/zero.registry.json';
import Registry from 'zero-scaffold/src/Registry';

export default async (ctx, inject) => {
  const registry = new Registry(null, RegistryValue);
  const plugins = registry.all('nuxt-plugin');
  const context = require.context('../plugins', false, /\.js$/);

  for (const plugin of plugins) {
    const extender = context('./' + plugin.id + '.js');
    extender.default(ctx, inject);
  }
};