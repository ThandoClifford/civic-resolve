import { useEffect, useRef, useCallback } from 'react';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socket';

export const useSmartLightSocket = (token, callbacks = {}) => {
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = initializeSocket(token);

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      if (callbacksRef.current.onConnect) {
        callbacksRef.current.onConnect();
      }
    });

    socket.on('streetlight:updated', (data) => {
      if (callbacksRef.current.onStreetlightUpdated) {
        callbacksRef.current.onStreetlightUpdated(data);
      }
    });

    socket.on('fault:new', (data) => {
      if (callbacksRef.current.onFaultNew) {
        callbacksRef.current.onFaultNew(data);
      }
    });

    socket.on('fault:updated', (data) => {
      if (callbacksRef.current.onFaultUpdated) {
        callbacksRef.current.onFaultUpdated(data);
      }
    });

    socket.on('fault:resolved', (data) => {
      if (callbacksRef.current.onFaultResolved) {
        callbacksRef.current.onFaultResolved(data);
      }
    });

    socket.on('smartlight:alert', (data) => {
      if (callbacksRef.current.onAlert) {
        callbacksRef.current.onAlert(data);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      if (callbacksRef.current.onDisconnect) {
        callbacksRef.current.onDisconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      if (callbacksRef.current.onDisconnect) {
        callbacksRef.current.onDisconnect();
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const sendTestTelemetry = useCallback(async (payload) => {
    const socket = getSocket();
    socket.emit('test:telemetry', payload);
  }, []);

  return { sendTestTelemetry };
};
