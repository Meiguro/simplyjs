var simply = require('ui/simply');

var Voice = {};

Voice.dictate = function(type, confirm, callback) {
  type = type.toLowerCase();
  switch (type){
    case 'stop':
      simply.impl.voiceDictationStop();
      break;
    case 'start':
      if (typeof callback === 'undefined') {
        callback = confirm;
        confirm = true;
      }

      simply.impl.voiceDictationStart(callback, confirm);
      break;
    default:
      console.log('Unsupported type passed to Voice.dictate');
  }
};

module.exports = Voice;
