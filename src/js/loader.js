var __loader = (function() {

var __loader = {};

__loader.packages = {};

__loader.packagesLinenoOrder = [{ filename: 'loader.js', lineno: 0 }];

__loader.extpaths = ['?', '?.js', '?.json', '?/index.js'];

__loader.require = function(path) {
  var module;
  var extpaths = __loader.extpaths;
  for (var i = 0, ii = extpaths.length; !module && i < ii; ++i) {
    var filepath = extpaths[i].replace('?', path);
    module = __loader.packages[filepath];
  }

  if (!module) {
    throw new Error("Cannot find module'" + path + "'");
  }

  if (module.exports) {
    return module.exports;
  }

  module.exports = {};
  module.loader(module, __loader.require);
  module.loaded = true;

  return module.exports;
};

__loader.define = function(path, lineno, loader) {
  var module = {
    filename: path,
    lineno: lineno,
    loader: loader,
  };

  __loader.packages[path] = module;
  __loader.packagesLinenoOrder.push(module);
  __loader.packagesLinenoOrder.sort(function(a, b) {
    return a.lineno - b.lineno;
  });
};

__loader.getPackageByLineno = function(lineno) {
  var packages = __loader.packagesLinenoOrder;
  var module;
  for (var i = 0, ii = packages.length; i < ii; ++i) {
    var next = packages[i];
    if (next.lineno > lineno) {
      break;
    }
    module = next;
  }
  return module;
};

return __loader;

})();
