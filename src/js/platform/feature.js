var Platform = require('platform');

var Feature = module.exports;

Feature.platform = function(map, yes, no) {
  var v = map[Platform.version()];
  var rv;
  if (v && yes !== undefined) {
    rv = typeof yes === 'function' ? yes(v) : yes;
  } else if (!v && no !== undefined) {
    rv = typeof no === 'function' ? no(v) : no;
  }
  return rv !== undefined ? rv : v;
};

Feature.makePlatformTest = function(map) {
  return function(yes, no) {
    return Feature.platform(map, yes, no);
  };
};

Feature.blackAndWhite = Feature.makePlatformTest({
  aplite: true,
  basalt: false,
  chalk: false,
});

Feature.color = Feature.makePlatformTest({
  aplite: false,
  basalt: true,
  chalk: true,
});

Feature.rectangle = Feature.makePlatformTest({
  aplite: true,
  basalt: true,
  chalk: false,
});

Feature.round = Feature.makePlatformTest({
  aplite: false,
  basalt: false,
  chalk: true,
});

Feature.microphone = Feature.makePlatformTest({
  aplite: false,
  basalt: true,
  chalk: true,
});
