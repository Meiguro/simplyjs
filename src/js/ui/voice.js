var simply = require('ui/simply');

var Voice = {};

Voice.startDictationSession = function(e, enableConfirmation) {
    // default parameter value for enableDictation = true
  enableConfirmation = typeof enableConfirmation !== 'undefined' ?  enableConfirmation : true;

  simply.impl.voiceDictationSession(e, enableConfirmation);
};

module.exports = Voice;