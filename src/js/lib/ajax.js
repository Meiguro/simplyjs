/*
 * ajax.js by Meiguro - MIT License
 */

var ajax = (function(){

var formify = function(data) {
  var params = [], i = 0;
  for (var name in data) {
    params[i++] = encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
  }
  return params.join('&');
};

var deformify = function(form) {
  var params = {};
  form.replace(/(?:([^=&]*)=?([^&]*)?)(?:&|$)/g, function(_, name, value) {
    if (name) {
      params[name] = value || true;
    }
    return _;
  });
  return params;
};

/**
 * ajax options. There are various properties with url being the only required property.
 * @typedef ajaxOptions
 * @property {string} [method='get'] - The HTTP method to use: 'get', 'post', 'put', 'delete', 'options',
 *    or any other standard method supported by the running environment.
 * @property {string} url - The URL to make the ajax request to. e.g. 'http://www.example.com?name=value'
 * @property {string} [type] - The content and response format. By default, the content format
 *    is 'form' and response format is separately 'text'. Specifying 'json' will have ajax send `data`
 *    as json as well as parse the response as json. Specifying 'text' allows you to send custom
 *    formatted content and parse the raw response text. If you wish to send form encoded data and
 *    parse json, leave `type` undefined and use `JSON.decode` to parse the response data.
 * @property {object} [data] - The request body, mainly to be used in combination with 'post' or 'put'.
 *    e.g. { username: 'guest' }
 * @property {object} headers - Custom HTTP headers. Specify additional headers.
 *    e.g. { 'x-extra': 'Extra Header' }
 * @property {boolean} [async=true] - Whether the request will be asynchronous.
 *    Specify false for a blocking, synchronous request.
 * @property {boolean} [cache=true] - Whether the result may be cached.
 *    Specify false to use the internal cache buster which appends the URL with the query parameter _
 *    set to the current time in milliseconds.
 */

/**
 * ajax allows you to make various http or https requests.
 * See {@link ajaxOptions}
 * @global
 * @param {ajaxOptions} opt - Options specifying the type of ajax request to make.
 * @param {function} success - The success handler that is called when a HTTP 200 response is given.
 * @param {function} failure - The failure handler when the HTTP request fails or is not 200.
 */
var ajax = function(opt, success, failure) {
  if (typeof opt === 'string') {
    opt = { url: opt };
  }
  var method = opt.method || 'GET';
  var url = opt.url;
  //console.log(method + ' ' + url);

  var onHandler = ajax.onHandler;
  if (onHandler) {
    if (success) { success = onHandler('success', success); }
    if (failure) { failure = onHandler('failure', failure); }
  }

  if (opt.cache === false) {
    var appendSymbol = url.indexOf('?') === -1 ? '?' : '&';
    url += appendSymbol + '_=' + Date.now();
  }

  var req = new XMLHttpRequest();
  req.open(method.toUpperCase(), url, opt.async !== false);

  var headers = opt.headers;
  if (headers) {
    for (var name in headers) {
      req.setRequestHeader(name, headers[name]);
    }
  }

  var data = opt.data;
  if (data) {
    if (opt.type === 'json') {
      req.setRequestHeader('Content-Type', 'application/json');
      data = JSON.stringify(opt.data);
    } else if (opt.type === 'xml') {
      req.setRequestHeader('Content-Type', 'text/xml');
    } else if (opt.type !== 'text') {
      req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      data = formify(opt.data);
    }
  }

  var ready = false;
  req.onreadystatechange = function(e) {
    if (req.readyState === 4 && !ready) {
      ready = true;
      var body = req.responseText;
      var okay = req.status >= 200 && req.status < 300 || req.status === 304;

      try {
        if (opt.type === 'json') {
          body = JSON.parse(body);
        } else if (opt.type === 'form') {
          body = deformify(body);
        }
      } catch (err) {
        okay = false;
      }
      var callback = okay ? success : failure;
      if (callback) {
        callback(body, req.status, req);
      }
    }
  };

  req.send(data);
};

ajax.formify = formify;
ajax.deformify = deformify;

if (typeof module !== 'undefined') {
  module.exports = ajax;
} else {
  window.ajax = ajax;
}

return ajax;

})();
