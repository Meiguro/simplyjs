#include "simply_voice.h"

#include "simply_msg.h"

#include "simply.h"

#include <pebble.h>

#if !defined(PBL_PLATFORM_APLITE)
typedef struct VoiceStartPacket VoiceStartPacket;

struct __attribute__((__packed__)) VoiceStartPacket {
  Packet packet;
  bool enable_confirmation;
};


typedef struct VoiceDataPacket VoiceDataPacket;

struct __attribute__((__packed__)) VoiceDataPacket {
  Packet packet;
  int8_t status;
  char result[];
};

static SimplyVoice *s_voice;

static bool send_voice_data(int status, char *transcription) {
  // Handle NULL Case
  if (transcription == NULL) {
    return send_voice_data(DictationSessionStatusFailureSystemAborted, "");
  }

  // Handle success case
  size_t transcription_length = strlen(transcription) + 1;
  size_t packet_length = sizeof(VoiceDataPacket) + transcription_length;

  uint8_t buffer[packet_length];
  VoiceDataPacket *packet = (VoiceDataPacket *)buffer;
  *packet = (VoiceDataPacket) {
    .packet.type = CommandVoiceData,
    .packet.length = packet_length,
    .status = (uint8_t) status,
  };

  strncpy(packet->result, transcription, transcription_length);

  return simply_msg_send_packet(&packet->packet);
}

// Define a callback for the dictation session
static void dictation_session_callback(DictationSession *session, DictationSessionStatus status, 
                                       char *transcription, void *context) {
  s_voice->in_progress = false;

  // Send the result
  send_voice_data(status, transcription);
}

static void timer_callback_start_dictation(void *data) {
  dictation_session_start(s_voice->session);
}


static void handle_voice_start_packet(Simply *simply, Packet *data) {
  // Send an immediate response if there's already a dictation session in progress
  // Status 64 = SessionAlreadyInProgress
  if (s_voice->in_progress) {
    send_voice_data(64, "");
    return;
  }

  // Otherwise, start the timer as soon as possible
  // (we start a timer so we can return true as quickly as possible)
  s_voice->in_progress = true;

  VoiceStartPacket *packet = (VoiceStartPacket*) data;
  dictation_session_enable_confirmation(s_voice->session, packet->enable_confirmation);
  s_voice->timer = app_timer_register(0, timer_callback_start_dictation, NULL);
}

static void handle_voice_stop_packet(Simply *simply, Packet *data) {
  // Stop the session and clear the in_progress flag
  dictation_session_stop(s_voice->session);
  s_voice->in_progress = false;
}

bool simply_voice_handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandVoiceStart:
      handle_voice_start_packet(simply, packet);
      return true;
    case CommandVoiceStop:
      handle_voice_stop_packet(simply, packet);
      return true;
  }

  return false;
}

SimplyVoice *simply_voice_create(Simply *simply) {
  if (s_voice) {
    return s_voice;
  }

  SimplyVoice *self = malloc(sizeof(*self));
  *self = (SimplyVoice) {
    .simply = simply,
    .in_progress = false,
  };

  self->session = dictation_session_create(SIMPLY_VOICE_BUFFER_LENGTH, dictation_session_callback, NULL);

  s_voice = self;
  return self;
}

void simply_voice_destroy(SimplyVoice *self) {
  if (!self) {
    return;
  }

  free(self);
  s_voice = NULL;
}

bool simply_voice_dictation_in_progress() {
  return s_voice->in_progress;
}
#endif
