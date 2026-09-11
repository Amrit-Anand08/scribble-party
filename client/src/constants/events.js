export const SOCKET_EVENTS = {
  // Room & Lobby
  CREATE_ROOM: 'create_room',
  ROOM_CREATED: 'room_created',
  JOIN_ROOM: 'join_room',
  JOINED_ROOM_SUCCESS: 'joined_room_success',
  JOIN_ERROR: 'join_error',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  START_GAME: 'start_game',

  // Game State
  GAME_STATE: 'game_state',
  ROUND_START: 'round_start',
  ROUND_START_BROADCAST: 'round_start_broadcast',
  WORD_CHOSEN: 'word_chosen',
  HINT_REVEAL: 'hint_reveal',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',

  // Drawing
  DRAW_START: 'draw_start',
  DRAW_MOVE: 'draw_move',
  DRAW_END: 'draw_end',
  DRAW_DATA: 'draw_data',
  CANVAS_CLEAR: 'canvas_clear',
  CANVAS_CLEARED: 'canvas_cleared',
  DRAW_UNDO: 'draw_undo',
  CANVAS_UNDO: 'canvas_undo',
  STROKE_HISTORY: 'stroke_history',

  // Chat & Guessing
  GUESS: 'guess',
  GUESS_RESULT: 'guess_result',
  CHAT: 'chat',
  CHAT_MESSAGE: 'chat_message',

  // System
  ERROR_MESSAGE: 'error_message'
};
