import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { config } from '../config/env';

interface SocketContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  reconnect: () => void;
  sendMessage: (message: any) => void;
  lastMessage: any;
  error: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(3);
  const [isManualReconnect, setIsManualReconnect] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use refs to prevent stale closures in useEffect
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || isConnected) {
      console.log('Connection already in progress or already connected');
      return;
    }

    try {
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      setError(null);
      
      // Check if we have a valid server URL
      if (!config.IOT_SERVER_URL || config.IOT_SERVER_URL === 'http://localhost:8081') {
        console.log('No valid IoT server URL configured, skipping WebSocket connection');
        setConnectionStatus('disconnected');
        setError('No IoT server configured');
        isConnectingRef.current = false;
        return;
      }
      
      const wsUrl = config.IOT_SERVER_URL.replace('http', 'ws');
      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        console.log('WebSocket connected to GeoVAN IoT server');
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        setError(null);
        setIsManualReconnect(false);
        isConnectingRef.current = false;
        
        // Send a ping message to keep connection alive
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle ping-pong for connection keep-alive
          if (message.type === 'pong') {
            console.log('Received pong from server');
            return;
          }
          
          // Handle different message types
          switch (message.type) {
            case 'vehicles_update':
            case 'analytics_update':
            case 'vehicle_status_update':
            case 'emergency_alert':
              // These messages will be handled by the vehicle service
              break;
            default:
              console.log('Received WebSocket message:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        isConnectingRef.current = false;
        
        // Clean up the socket reference
        if (socketRef.current === newSocket) {
          socketRef.current = null;
        }
        
        // Only attempt to reconnect if it's not a manual disconnect and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts && !isManualReconnect) {
          const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
          console.log(`Attempting to reconnect in ${delay}ms... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached. Please check your server connection.');
        }
      };

      newSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionStatus('disconnected');
        isConnectingRef.current = false;
      };

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('disconnected');
      isConnectingRef.current = false;
    }
  }, [reconnectAttempts, maxReconnectAttempts, isManualReconnect, isConnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket) {
      setIsManualReconnect(true);
      socket.close(1000, 'User initiated disconnect');
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      socketRef.current = null;
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    setIsManualReconnect(false);
    
    // Wait a bit before attempting to reconnect
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        setError('Failed to send message');
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
      setError('WebSocket is not connected');
    }
  }, [socket]);

  // Keep-alive ping mechanism
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('Failed to send ping:', error);
        }
      }
    }, 30000); // Send ping every 30 seconds
    
    return () => clearInterval(pingInterval);
  }, [isConnected, socket]);

  // Auto-connect on mount only if we have a valid server URL and haven't initialized yet
  useEffect(() => {
    if (isInitialized) return;
    
    if (config.IOT_SERVER_URL && config.IOT_SERVER_URL !== 'http://localhost:8081') {
      connect();
    } else {
      console.log('Skipping WebSocket connection - no valid server URL configured');
      setConnectionStatus('disconnected');
      setError('No IoT server configured');
    }
    
    setIsInitialized(true);
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect, isInitialized]);

  // Auto-reconnect on network changes
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && config.IOT_SERVER_URL && config.IOT_SERVER_URL !== 'http://localhost:8081' && !isConnectingRef.current) {
        console.log('Network is back online, attempting to reconnect...');
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log('Network is offline');
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, reconnect]);

  const value: SocketContextType = {
    isConnected,
    connectionStatus,
    reconnect,
    sendMessage,
    lastMessage,
    error,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
