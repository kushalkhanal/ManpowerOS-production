import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { resolveSocketServerUrl } from '../utils/socketUrl.js';
import { devError } from '../utils/devLog';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated, loading } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    /* debug logs removed */

    // Don't touch the socket while auth is still being resolved
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const serverUrl = resolveSocketServerUrl(import.meta.env.VITE_SERVER_URL, window.location.origin);

    const socket = io(serverUrl, {
      auth: { token: tokenRef.current },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Max 10s delay with exponential backoff
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      window.dispatchEvent(new CustomEvent('socket-connected'));
    });

    socket.on('disconnect', (reason) => {
      window.dispatchEvent(new CustomEvent('socket-disconnected', { detail: { reason } }));
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      reconnectAttemptsRef.current = attemptNumber;
      window.dispatchEvent(new CustomEvent('socket-reconnecting', { 
        detail: { attempt: attemptNumber, max: maxReconnectAttempts } 
      }));
    });

    socket.on('reconnect_failed', () => {
      window.dispatchEvent(new CustomEvent('socket-reconnect-failed'));
    });

    socket.on('reconnect', (attemptNumber) => {
      reconnectAttemptsRef.current = 0;
      window.dispatchEvent(new CustomEvent('socket-reconnected', { 
        detail: { attempts: attemptNumber } 
      }));
    });

    socket.on('connect_error', (error) => {
      devError('SocketContext: Connection error:', error.message);
      // Dispatch a clean force-logout event so AuthContext handles state teardown.
      // Do NOT wipe localStorage or redirect here — that caused the instant-logout bug.
      if (error.message === 'Authentication required' || error.message === 'Invalid token') {
        devError('SocketContext: Auth failed, dispatching force-logout');
        window.dispatchEvent(new CustomEvent('force-logout'));
      }
    });

    socket.on('new_internal_alert', (alert) => {
      window.dispatchEvent(new CustomEvent('new-alert', { detail: alert }));
    });

    socket.on('candidate_status_changed', (data) => {
      window.dispatchEvent(new CustomEvent('candidate-update', { detail: data }));
    });

    socket.on('task_assigned', (task) => {
      window.dispatchEvent(new CustomEvent('task-assigned', { detail: task }));
    });

    socket.on('task_overdue', (task) => {
      window.dispatchEvent(new CustomEvent('task-overdue', { detail: task }));
    });

    socket.on('expiry_alert', (alert) => {
      window.dispatchEvent(new CustomEvent('expiry-alert', { detail: alert }));
    });

    socket.on('staff_online', (staff) => {
      window.dispatchEvent(new CustomEvent('staff-online', { detail: staff }));
    });

    socket.on('staff_offline', (staff) => {
      window.dispatchEvent(new CustomEvent('staff-offline', { detail: staff }));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, loading]);

  // Pass the ref itself so consumers always access the live socket via socketRef.current,
  // rather than a snapshot captured at render time that goes stale after reconnects.
  return (
    <SocketContext.Provider value={{ socketRef }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;