import Path from 'path';

import RegistryValue from '~/zero.registry.json';
import Registry from 'zero-scaffold/src/Registry';

export default async (ctx, inject) => {
  const registry = new Registry(null, RegistryValue);
  const plugins = registry.all('plugin');
  const context = require.context('./extend', false, /\.js$/);

  for (const plugin of plugins) {
    const f = context('./' + plugin.id + '.js');
    console.log(f);
  }
};