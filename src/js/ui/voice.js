var simply = require('ui/simply');

var Voice = {};

Voice.startDictationSession = function(cb) {
  simply.impl.voiceDictationSession(cb);
};

module.exports = Voice;