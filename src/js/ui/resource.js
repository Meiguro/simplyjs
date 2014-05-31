var myutil = require('lib/myutil');
var appinfo = require('appinfo');

var resources = (function() {
  var resources = appinfo.resources;
  return resources && resources.media || [];
})();

var Resource = {};

Resource.items = resources;

Resource.getId = function(opt) {
  var path = opt;
  if (typeof opt === 'object') {
    path = opt.url;
  }
  path = path.replace(/#.*/, '');
  var cname = myutil.toCConstantName(path);
  for (var i = 0, ii = resources.length; i < ii; ++i) {
    var res = resources[i];
    if (res.name === cname || res.file === path) {
      return i + 1;
    }
  }
};

module.exports = Resource;
