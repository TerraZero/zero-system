import RegistryValue from '~/zero.registry.json';
import Registry from 'zero-scaffold/src/Registry';

export default function (...args) {
  const registry = new Registry(null, RegistryValue);
  const modules = registry.all('nuxt-module');
  const context = require.context('../modules', false, /\.js$/);

  for (const module of modules) {
    const extender = context('./' + module.id + '.js');
    extender.default.apply(this, args);
  }
}