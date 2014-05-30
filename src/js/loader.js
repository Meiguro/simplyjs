var __loader = (function() {

var loader = {};

loader.packages = {};

loader.packagesLinenoOrder = [{ filename: 'loader.js', lineno: 0 }];

loader.extpaths = ['?', '?.js', '?.json', '?/index.js'];

loader.require = function(path) {
  var module;
  var extpaths = loader.extpaths;
  for (var i = 0, ii = extpaths.length; !module && i < ii; ++i) {
    var filepath = extpaths[i].replace('?', path);
    module = loader.packages[filepath];
  }

  if (!module) {
    throw new Error("Cannot find module'" + path + "'");
  }

  if (module.exports) {
    return module.exports;
  }

  module.exports = {};
  module.loader(module, loader.require);
  module.loaded = true;

  return module.exports;
};

loader.define = function(path, lineno, loader) {
  var module = {
    filename: path,
    lineno: lineno,
    loader: loader,
  };

  loader.packages[path] = module;
  loader.packagesLinenoOrder.push(module);
  loader.packagesLinenoOrder.sort(function(a, b) {
    return a.lineno - b.lineno;
  });
};

loader.getPackageByLineno = function(lineno) {
  var packages = loader.packagesLinenoOrder;
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

return loader;

})();
