var simply = require('ui/simply');

var Voice = {};

Voice.startDictationSession = function(e) {
  simply.impl.voiceDictationSession(e);
};

module.exports = Voice;