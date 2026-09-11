import { useState, useEffect, useCallback, useRef } from 'react';
import { SOCKET_EVENTS } from '../constants/events';

const SESSION_KEY = 'sp_rejoin'; // sessionStorage key for refresh recovery

export function useGameState({ socket, isConnected }) {
  const [room, setRoom] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [phase, setPhase] = useState('lobby'); // lobby, choosing, drawing, round_end, game_over
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [drawerId, setDrawerId] = useState(null);
  const [drawerName, setDrawerName] = useState('');
  const [wordOptions, setWordOptions] = useState([]);
  const [currentWord, setCurrentWord] = useState(''); // secret word (if drawer) or blanks
  const [wordLength, setWordLength] = useState(0);
  const [deadlineTimestamp, setDeadlineTimestamp] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const isHost = myPlayer?.id && room?.hostId === myPlayer.id;
  const isDrawer = myPlayer?.id && drawerId === myPlayer.id;

  // Bug 4 fix: roomRef lets handlers always access the latest room value
  // without adding room to the useEffect dependency array, which would cause
  // all socket listeners to be torn down and re-registered on every player
  // join/leave event, creating a window where events could be missed.
  const roomRef = useRef(room);
  useEffect(() => { roomRef.current = room; }, [room]);

  // Also keep a ref to myPlayer for use in auto-rejoin guard
  const myPlayerRef = useRef(myPlayer);
  useEffect(() => { myPlayerRef.current = myPlayer; }, [myPlayer]);

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === msg ? null : prev));
    }, 4000);
  }, []);

  // ─── Full state reset helper ───────────────────────────────────────────────
  const resetAllState = useCallback(() => {
    setRoom(null);
    setMyPlayer(null);
    setPlayers([]);
    setPhase('lobby');
    setRound(1);
    setTotalRounds(3);
    setDrawerId(null);
    setDrawerName('');
    setWordOptions([]);
    setCurrentWord('');
    setWordLength(0);
    setDeadlineTimestamp(null);
    setMessages([]);
    setRoundEndData(null);
    setGameOverData(null);
  }, []);

  // ─── Leave Room ────────────────────────────────────────────────────────────
  // Graceful exit: tell server, clear session, reset all local state.
  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM);
    }
    sessionStorage.removeItem(SESSION_KEY);
    resetAllState();
  }, [socket, resetAllState]);

  // ─── Auto-rejoin on page refresh ──────────────────────────────────────────
  // When the socket reconnects (e.g. after a browser refresh) and there is no
  // active room state, check sessionStorage for a saved roomCode + playerName
  // and attempt to rejoin automatically.
  useEffect(() => {
    if (!socket || !isConnected || myPlayerRef.current) return;

    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;

    try {
      const { roomCode, playerName } = JSON.parse(saved);
      if (roomCode && playerName) {
        console.log(`[GameState] Auto-rejoining room ${roomCode} as "${playerName}"`);
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, playerName });
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [socket, isConnected]);

  // ─── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Room creation acknowledgment
    const onRoomCreated = (data) => {
      setRoom(data.room);
      setMyPlayer(data.player);
      setPlayers(data.room.players || [data.player]);
      setPhase('lobby');
      // Save for refresh recovery
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        roomCode: data.roomCode,
        playerName: data.player.name
      }));
      showToast(`Room created! Code: ${data.roomCode}`, 'success');
    };

    // Joined room success (first join OR browser-refresh reconnect)
    const onJoinedRoomSuccess = (data) => {
      setRoom(data.room);
      setMyPlayer(data.player);
      setPlayers(data.room.players || []);

      // Hydrate game state from server snapshot (critical for refresh reconnect)
      const game = data.room.game;
      if (game) {
        setPhase(game.phase || 'drawing');
        setRound(game.round || 1);
        setTotalRounds(game.totalRounds || 3);
        setDrawerId(game.drawerId || null);
        setDeadlineTimestamp(game.deadlineTimestamp || null);
        setWordLength(game.wordLength || 0);
        // word / blanks: drawer gets actual word, others get blanks
        setCurrentWord(game.word || game.blanks || '');
      } else {
        setPhase('lobby');
      }

      // Save for refresh recovery
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        roomCode: data.roomCode,
        playerName: data.player.name
      }));

      // Only show toast for fresh joins, not silent reconnects (no toast on refresh)
      if (!game) {
        showToast(`Joined room ${data.roomCode}`, 'success');
      }
    };

    // Join error
    const onJoinError = (data) => {
      // If the room is gone (e.g. after refresh with stale session), clear saved data
      if (data.reason === 'room_not_found' || data.reason === 'join_failed') {
        sessionStorage.removeItem(SESSION_KEY);
      }
      showToast(data.message || data.reason || 'Could not join room', 'error');
    };

    // Player joined broadcast
    const onPlayerJoined = (data) => {
      setPlayers(data.players);
      showToast(`${data.player.name} joined the room!`, 'info');
    };

    // Player left broadcast
    const onPlayerLeft = (data) => {
      setPlayers(data.players);
      // Bug 4 fix: use roomRef (always current) instead of closed-over room
      if (data.hostId && roomRef.current) {
        setRoom(prev => (prev ? { ...prev, hostId: data.hostId } : null));
      }
      showToast(`${data.playerName} left the room.`, 'info');
    };

    // Round start - word options offered to drawer
    const onRoundStart = (data) => {
      setDrawerId(data.drawerId);
      // drawerName for the drawer is their own name; resolved via myPlayer
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setWordOptions(data.wordOptions || []);
      setPhase('choosing');
      setRoundEndData(null);
    };

    // Round start broadcast to others
    const onRoundStartBroadcast = (data) => {
      setDrawerId(data.drawerId);
      setDrawerName(data.drawerName);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setWordOptions([]);
      setPhase('choosing');
      setRoundEndData(null);
    };

    // Game state sync
    const onGameState = (data) => {
      if (data.phase) setPhase(data.phase);
      if (data.round) setRound(data.round);
      if (data.totalRounds) setTotalRounds(data.totalRounds);
      if (data.drawerId) setDrawerId(data.drawerId);
      if (data.drawerName) setDrawerName(data.drawerName);
      if (data.deadlineTimestamp) setDeadlineTimestamp(data.deadlineTimestamp);
      if (data.wordLength) setWordLength(data.wordLength);
      if (data.word) {
        setCurrentWord(data.word);
      } else if (data.blanks) {
        setCurrentWord(data.blanks);
      }
      if (data.players) setPlayers(data.players);
    };

    // Hint reveal
    const onHintReveal = (data) => {
      if (data.blanks) {
        setCurrentWord(data.blanks);
      }
    };

    // Chat message
    const onChatMessage = (data) => {
      setMessages(prev => [...prev.slice(-100), { ...data, id: Date.now() + Math.random() }]);
    };

    // Guess result
    const onGuessResult = (data) => {
      if (data.correct) {
        // Update player score in state
        setPlayers(prev =>
          prev.map(p =>
            p.id === data.playerId
              ? { ...p, score: p.score + data.points, hasGuessedCorrectly: true }
              : p
          )
        );

        const noticeText = data.maskedNotification || `${data.playerName} guessed the word! (+${data.points} pts)`;
        setMessages(prev => [
          ...prev.slice(-100),
          {
            id: Date.now() + Math.random(),
            isSystem: true,
            isCorrect: true,
            text: noticeText,
            timestamp: Date.now()
          }
        ]);
      }
    };

    // Round end
    const onRoundEnd = (data) => {
      setPhase('round_end');
      setRoundEndData(data);
      setCurrentWord(data.word);
      setDeadlineTimestamp(null); // hide timer between rounds
      if (data.leaderboard) {
        setPlayers(prev =>
          prev.map(p => {
            const entry = data.leaderboard.find(l => l.id === p.id);
            return entry ? { ...p, score: entry.score, hasGuessedCorrectly: false } : p;
          })
        );
      }
    };

    // Game over
    const onGameOver = (data) => {
      setPhase('game_over');
      setGameOverData(data);
      setDeadlineTimestamp(null); // hide timer
      showToast(`Game Over! Winner: ${data.winnerName}`, 'success');
    };

    // Error message
    const onErrorMessage = (data) => {
      showToast(data.message || 'An error occurred', 'error');
    };

    socket.on(SOCKET_EVENTS.ROOM_CREATED, onRoomCreated);
    socket.on(SOCKET_EVENTS.JOINED_ROOM_SUCCESS, onJoinedRoomSuccess);
    socket.on(SOCKET_EVENTS.JOIN_ERROR, onJoinError);
    socket.on(SOCKET_EVENTS.PLAYER_JOINED, onPlayerJoined);
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, onPlayerLeft);
    socket.on(SOCKET_EVENTS.ROUND_START, onRoundStart);
    socket.on(SOCKET_EVENTS.ROUND_START_BROADCAST, onRoundStartBroadcast);
    socket.on(SOCKET_EVENTS.GAME_STATE, onGameState);
    socket.on(SOCKET_EVENTS.HINT_REVEAL, onHintReveal);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SOCKET_EVENTS.GUESS_RESULT, onGuessResult);
    socket.on(SOCKET_EVENTS.ROUND_END, onRoundEnd);
    socket.on(SOCKET_EVENTS.GAME_OVER, onGameOver);
    socket.on(SOCKET_EVENTS.ERROR_MESSAGE, onErrorMessage);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_CREATED, onRoomCreated);
      socket.off(SOCKET_EVENTS.JOINED_ROOM_SUCCESS, onJoinedRoomSuccess);
      socket.off(SOCKET_EVENTS.JOIN_ERROR, onJoinError);
      socket.off(SOCKET_EVENTS.PLAYER_JOINED, onPlayerJoined);
      socket.off(SOCKET_EVENTS.PLAYER_LEFT, onPlayerLeft);
      socket.off(SOCKET_EVENTS.ROUND_START, onRoundStart);
      socket.off(SOCKET_EVENTS.ROUND_START_BROADCAST, onRoundStartBroadcast);
      socket.off(SOCKET_EVENTS.GAME_STATE, onGameState);
      socket.off(SOCKET_EVENTS.HINT_REVEAL, onHintReveal);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SOCKET_EVENTS.GUESS_RESULT, onGuessResult);
      socket.off(SOCKET_EVENTS.ROUND_END, onRoundEnd);
      socket.off(SOCKET_EVENTS.GAME_OVER, onGameOver);
      socket.off(SOCKET_EVENTS.ERROR_MESSAGE, onErrorMessage);
    };
  // Bug 4 fix: room is intentionally removed from deps. Handlers that need
  // room read from roomRef instead. Adding room here caused all listeners
  // to re-register on every player join/leave (high-churn events).
  }, [socket, showToast]);

  return {
    room,
    myPlayer,
    players,
    phase,
    round,
    totalRounds,
    drawerId,
    drawerName,
    wordOptions,
    currentWord,
    wordLength,
    deadlineTimestamp,
    messages,
    roundEndData,
    gameOverData,
    toastMessage,
    isHost,
    isDrawer,
    showToast,
    leaveRoom,
    resetToLobby: () => {
      setPhase('lobby');
      setRoundEndData(null);
      setGameOverData(null);
      setDeadlineTimestamp(null);
    }
  };
}
