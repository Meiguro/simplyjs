var __loader = (function() {

var loader = {};

loader.packages = {};

loader.packagesLinenoOrder = [{ filename: 'loader.js', lineno: 0 }];

loader.extpaths = ['?', '?.js', '?.json', '?/index.js'];

loader.paths = ['lib', 'vendor'];

loader.require = function(path) {
  var module = loader.getPackage(path);
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

var compareLineno = function(a, b) { return a.lineno - b.lineno; };

loader.define = function(path, lineno, loadfun) {
  var module = {
    filename: path,
    lineno: lineno,
    loader: loadfun,
  };

  loader.packages[path] = module;
  loader.packagesLinenoOrder.push(module);
  loader.packagesLinenoOrder.sort(compareLineno);
};

loader.getPackage = function(path) {
  var module = loader.getPackageAtPath(path);
  var paths = loader.paths;
  for (var i = 0, ii = paths.length; !module && i < ii; ++i) {
    var dirpath = paths[i];
    module = loader.getPackageAtPath(dirpath + '/' + path);
  }
  return module;
};

loader.getPackageAtPath = function(path) {
  var module;
  var extpaths = loader.extpaths;
  for (var i = 0, ii = extpaths.length; !module && i < ii; ++i) {
    var filepath = extpaths[i].replace('?', path);
    module = loader.packages[filepath];
  }
  return module;
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
