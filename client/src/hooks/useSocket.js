import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const sock = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = sock;
    // Expose the socket through state so consumers always get the live instance
    setSocket(sock);

    sock.on('connect', () => {
      console.log('[Socket] Connected with ID:', sock.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    sock.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setIsConnected(false);
      setConnectionError(err.message);
    });

    sock.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    return () => {
      sock.disconnect();
      setSocket(null);
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket,
    isConnected,
    connectionError,
    emit,
    on,
    off
  };
}
