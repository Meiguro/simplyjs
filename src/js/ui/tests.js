
var tests = {};

tests.setTimeoutErrors = function () {
  /* global wind */
  var i = 0;
  var interval = setInterval(function() {
    clearInterval(interval);
    wind.titlex("i = " + i++);
  }, 1000);
};

tests.ajaxErrors = function() {
  var ajax = require('lib/ajax');
  var ajaxCallback = function(reqStatus, reqBody, request) {
    console.logx('broken call');
  };
  ajax({url: 'http://www.google.fr/' }, ajaxCallback, ajaxCallback);
};

tests.geolocationErrors = function () {
  navigator.geolocation.getCurrentPosition(function(coords) {
    console.logx("Got coords: " + coords);
  });
};

for (var test in tests) {
  console.log('Running test: ' + test);
  tests[test]();
}
