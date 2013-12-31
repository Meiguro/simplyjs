/*
 * ajax.js by Meiguro - MIT License
 */

var ajax = (function(){

var formify = function(data) {
  var params = [], i = 0;
  for (var name in data) {
    params[i++] = encodeURI(name) + '=' + encodeURI(data[name]);
  }
  return params.join('&');
};

var ajax = function(opt, success, failure) {
  var method = opt.method || 'GET';
  var url = opt.url;
  //console.log(method + ' ' + url);

  var onHandler = ajax.onHandler;
  if (onHandler) {
    if (success) { success = onHandler('success', success); }
    if (failure) { failure = onHandler('failure', failure); }
  }

  var req = new XMLHttpRequest();
  var headers = opt.headers;
  if (headers) {
    for (var name in headers) {
      req.setRequestHeader(name, headers[name]);
    }
  }

  var data = null;
  if (opt.data) {
    if (opt.type === 'json') {
      req.setRequestHeader('Content-Type', 'application/json');
      data = JSON.stringify(opt.data);
    } else {
      data = formify(opt.data);
    }
  }

  if (opt.cache === false) {
    var appendSymbol = url.indexOf('?') === -1 ? '?' : '&';
    url += appendSymbol + '_=' + new Date().getTime();
  }

  req.open(method.toUpperCase(), url, opt.async !== false);
  req.onreadystatechange = function(e) {
    if (req.readyState == 4) {
      var body = req.responseText;
      if (opt.type == 'json') {
        body = JSON.parse(body);
      }
      var callback = req.status == 200 ? success : failure;
      if (callback) {
        callback(body, req.status, req);
      }
    }
  }

  req.send(data);
};

ajax.formify = formify;

return ajax;

})();
