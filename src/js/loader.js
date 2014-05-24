var __loader = (function() {

var __loader = {};

__loader.packages = {};
__loader.loaders = {};
__loader.require = function(path) {
  if (!path.match(/\.js$/)) {
    path += '.js';
  }
  var module = __loader.packages[path];
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

__loader.define = function(path, loader) {
  __loader.packages[path] = {
    filename: path,
    loader: loader,
  };
};

return __loader;

})();
