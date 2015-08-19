var moment = require('vendor/moment');

var Clock = module.exports;

Clock.weekday = function(weekday, hour, minute, seconds) {
  var now = moment();
  var target = moment({ hour: hour, minute: minute, seconds: seconds }).day(weekday);
  if (moment.max(now, target) === now) {
    target.add(1, 'week');
  }
  return target.unix();
};
