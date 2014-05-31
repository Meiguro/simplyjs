var myutil = require('myutil');
var package = require('smartpackage/package');
var simply = require('simply/simply');

var packageImpl = module.exports;

var getExecPackage = function(execname) {
  var packages = package.packages;
  for (var path in packages) {
    var pkg = packages[path];
    if (pkg && pkg.execname === execname) {
      return path;
    }
  }
};

var getExceptionFile = function(e, level) {
  var stack = e.stack.split('\n');
  for (var i = level || 0, ii = stack.length; i < ii; ++i) {
    var line = stack[i];
    if (line.match(/^\$\d/)) {
      var path = getExecPackage(line);
      if (path) {
        return path;
      }
    }
  }
  return stack[level];
};

var getExceptionScope = function(e, level) {
  var stack = e.stack.split('\n');
  for (var i = level || 0, ii = stack.length; i < ii; ++i) {
    var line = stack[i];
    if (!line || line.match('native code')) { continue; }
    return line.match(/^\$\d/) && getExecPackage(line) || line;
  }
  return stack[level];
};

var setHandlerPath = function(handler, path, level) {
  var level0 = 4; // caller -> wrap -> apply -> wrap -> set
  handler.path = path ||
      getExceptionScope(new Error(), (level || 0) + level0) ||
      package.basename(package.module.filename);
  return handler;
};

var papply = packageImpl.papply = function(f, args, path) {
  try {
    return f.apply(this, args);
  } catch (e) {
    var scope = package.name(!path && getExceptionFile(e) || getExecPackage(path) || path);
    console.log(scope + ':' + e.line + ': ' + e + '\n' + e.stack);
    simply.text({
      subtitle: scope,
      body: e.line + ' ' + e.message,
    }, true);
  }
};

var protect = packageImpl.protect = function(f, path) {
  return function() {
    return papply(f, arguments, path);
  };
};

packageImpl.wrapHandler = function(handler, level) {
  if (!handler) { return; }
  setHandlerPath(handler, null, level || 1);
  var pkg = package.packages[handler.path];
  if (pkg) {
    return protect(pkg.fwrap(handler), handler.path);
  } else {
    return protect(handler, handler.path);
  }
};

var toSafeName = function(name) {
  name = name.replace(/[^0-9A-Za-z_$]/g, '_');
  if (name.match(/^[0-9]/)) {
    name = '_' + name;
  }
  return name;
};

var nextId = 1;

packageImpl.loadPackage = function(pkg, loader) {
  pkg.execname = toSafeName(pkg.name) + '$' + nextId++;
  pkg.fapply = myutil.defun(pkg.execname, ['f', 'args'],
    'return f.apply(this, args)'
  );
  pkg.fwrap = function(f) {
    return function() {
      return pkg.fapply(f, arguments);
    };
  };
  return papply(loader, null, pkg.name);
};

