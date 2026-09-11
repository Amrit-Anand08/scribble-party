import { useState, useEffect, useCallback } from 'react';
import { SOCKET_EVENTS } from '../constants/events';

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

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === msg ? null : prev));
    }, 4000);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Room creation acknowledgment
    const onRoomCreated = (data) => {
      setRoom(data.room);
      setMyPlayer(data.player);
      setPlayers(data.room.players || [data.player]);
      setPhase('lobby');
      showToast(`Room created! Code: ${data.roomCode}`, 'success');
    };

    // Joined room success
    const onJoinedRoomSuccess = (data) => {
      setRoom(data.room);
      setMyPlayer(data.player);
      setPlayers(data.room.players || []);
      setPhase(data.room.status === 'in_progress' ? 'drawing' : 'lobby');
      showToast(`Joined room ${data.roomCode}`, 'success');
    };

    // Join error
    const onJoinError = (data) => {
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
      if (data.hostId && room) {
        setRoom(prev => (prev ? { ...prev, hostId: data.hostId } : null));
      }
      showToast(`${data.playerName} left the room.`, 'info');
    };

    // Round start - word options offered to drawer
    const onRoundStart = (data) => {
      setDrawerId(data.drawerId);
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
  }, [socket, room, showToast]);

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
    resetToLobby: () => {
      setPhase('lobby');
      setRoundEndData(null);
      setGameOverData(null);
    }
  };
}
