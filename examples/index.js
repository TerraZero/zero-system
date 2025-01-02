/*
const SystemCollector = require('../src/SystemCollector');
const ControllerCollector = require('../src/ControllerCollector');
const ZeroRoot = require('../src/ZeroRoot');

SystemCollector.collect(new ControllerCollector(__dirname));

SystemCollector.set('test', null, {
  factory: (item) => {
    console.log('hioer');
    return new item.info.construct();
  },
  construct: require('./Example'),
});

SystemCollector.get('test').func();

SystemCollector.get('collector.controller').getRoute('example.serve')('ok');
SystemCollector.get('collector.controller').getRoute('example.func')('cool');

const controllers = SystemCollector.each(item => {
  if (item.hasTag('controller') && item.hasTag('base')) return item.getObject();
});

console.log(controllers);
*/

const RemoteSystem = require('../src/RemoteSystem');
const ZeroRoot = require('../src/ZeroRoot');
const SystemCollector = require('../src/SystemCollector');

SystemCollector.debug = true;

const root = new ZeroRoot(__dirname, null);

root.boot();
root.init();

const p = RemoteSystem.createRemoteProxy('test');
p.hallo('cool');