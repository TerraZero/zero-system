import RegistryValue from '~/zero.registry.json';
import Registry from 'zero-scaffold/src/Registry';

export default async (ctx, inject) => {
  const registry = new Registry(null, RegistryValue);
  const plugins = registry.all('plugin');
  const context = require.context('./extend', false, /\.js$/);

  for (const plugin of plugins) {
    const extender = context('./' + plugin.id + '.js');
    extender(ctx, inject);
  }
};

/*
import PluginRegistry from './plugins.registry';

export default async (ctx, inject) => {
  for (const plugin in PluginRegistry) {
    PluginRegistry[plugin](ctx, inject);
  }
};
*/