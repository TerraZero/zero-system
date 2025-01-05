import Path from 'path';
import Scaffold from 'zero-scaffold';

export default function (...args) {
  const root = Scaffold.findPackageRoot(__dirname);
  const registry = Scaffold.getRegistry(root);
  const modules = registry.all('nuxt-module');

  for (const module of modules) {
    const extender = require(Path.join(root, module.file));
    extender.default.apply(this, args);
  }
}