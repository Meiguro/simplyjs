var Clock = module.exports;

Clock.weekday = function(weekday, hour, minute, seconds) {
  return moment({ hour: hour, minute: minute, seconds: seconds }).day(weekday).unix();
};
