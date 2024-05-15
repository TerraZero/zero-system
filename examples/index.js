const SystemCollector = require('../src/SystemCollector');
const ControllerCollector = require('../src/ControllerCollector');

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