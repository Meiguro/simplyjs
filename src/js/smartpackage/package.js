var ajax = require('ajax');
var util2 = require('util2');
var myutil = require('myutil');
var Settings = require('settings/settings');
var simply = require('simply');

var package = module.exports;

package.packages = {};

package.basepath = function(path) {
  return path.replace(/[^\/]*$/, '');
};

package.basename = function(path) {
  return path.match(/[^\/]*$/)[0];
};

/**
 * Converts a relative path to an absolute path
 * using the path of the currently running script
 * (package.module) or optionaly, the given root.
 *
 * The first argument is optional:
 *   abspath(path);
 *   abspath(root, path);
 */
package.abspath = function(root, path) {
  // Handle optional first argument
  if (!path) {
    path = root;
    root = null;
  }
  // Use the package root if no root provided.
  if (!root && package.module) {
    root = package.basepath(package.module.filename);
  }
  return myutil.abspath(root, path);
};


package.name = function(rootfile, path) {
  if (!path) {
    path = rootfile;
    rootfile = null;
  }
  if (!rootfile && package.module) {
    rootfile = package.basepath(package.module.filename);
  }
  var name = path;
  if (typeof name === 'string') {
    name = name.replace(package.basepath(rootfile), '');
  }
  return name || package.basename(rootfile);
};

package.get = function(root, path) {
  return package.packages[package.abspath(root, path)];
};

package.make = function(path) {
  var pkg = package.packages[path];
  if (pkg) { return; }
  pkg = package.packages[path] = {
    name: package.basename(path),
    savename: 'script:' + path,
    filename: path
  };
  return pkg;
};

package.loader = function(pkg, script) {
  // console shim
  var console2 = util2.copy(console);

  console2.log = function() {
    var msg = pkg.name + ': ' + myutil.slog.apply(this, arguments);
    var width = 45;
    var prefix = (new Array(width + 1)).join('\b'); // erase source line
    var suffix = msg.length < width ? (new Array(width - msg.length + 1)).join(' ') : 0;
    console.log(prefix + msg + suffix);
  };

  // loader
  return function() {
    var exports = pkg.exports;
    var result = myutil.defun(pkg.execName,
      ['module', 'require', 'console', 'Pebble'], script)
      (pkg, package.require, console2, Pebble);

    // backwards compatibility for return-style modules
    if (pkg.exports === exports && result) {
      pkg.exports = result;
    }

    return pkg.exports;
  };
};

package.loadScript = function(url, async) {
  console.log('loading: ' + url);

  var pkg = package.make(url);

  if (!package.module) {
    package.module = pkg;
  }

  pkg.exports = {};

  var loader = util2.noop;
  var makeLoader = function(script) {
    return package.loader(pkg, script);
  };

  ajax({ url: url, cache: false, async: async },
    function(data) {
      if (data && data.length) {
        localStorage.setItem(pkg.savename, data);
        loader = makeLoader(data);
      }
    },
    function(data, status) {
      data = localStorage.getItem(pkg.savename);
      if (data && data.length) {
        console.log(status + ': failed, loading saved script instead');
        loader = makeLoader(data);
      }
    }
  );

  return package.impl.loadPackage(pkg, loader);
};

package.loadMainScript = function(scriptUrl) {
  simply.reset();

  scriptUrl = Settings.mainScriptUrl(scriptUrl);
  if (!scriptUrl) { return; }

  Settings.loadOptions(scriptUrl);

  try {
    package.loadScript(scriptUrl, false);
  } catch (e) {
    simply.text({
      title: 'Failed to load',
      body: scriptUrl,
    }, true);
    return;
  }
};

/**
 * Loads external dependencies, allowing you to write a multi-file project.
 * Package loading loosely follows the CommonJS format.
 * Exporting is possible by modifying or setting module.exports within the required file.
 * The module path is also available as module.path.
 * This currently only supports a relative path to another JavaScript file.
 * @global
 * @param {string} path - The path to the dependency.
 */

package.require = function(path) {
  if (!path.match(/\.js$/)) {
    path += '.js';
  }
  var pkg = package.get(path);
  if (pkg) {
    return pkg.exports;
  }
  path = package.abspath(path);
  return package.loadScript(path, false);
};
