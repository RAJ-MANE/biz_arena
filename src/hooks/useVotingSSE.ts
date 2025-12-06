import { useEffect, useRef, useState } from 'react';

interface SSEEvent {
  type: string;
  data?: any;
  timestamp: number;
  message?: string;
}

export function useVotingSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const connect = () => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      const eventSource = new EventSource('/api/sse/voting');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE: Connected to voting updates');
        setIsConnected(true);
        setConnectionAttempts(0);
        // On connect, dispatch a synthetic event so consumers can react
        setLastEvent({ type: 'connected', timestamp: Date.now() });
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          // Skip heartbeat events for state updates
          if (data.type && data.type === 'heartbeat') {
            // ignore
            return;
          }

          setLastEvent(data);
          console.log('SSE: Received event:', data);
        } catch (error) {
          console.error('SSE: Error parsing event data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE: Connection error:', error);
        setIsConnected(false);
        
        // Close the connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt to reconnect with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`SSE: Attempting to reconnect (attempt ${connectionAttempts + 1})`);
          setConnectionAttempts(prev => prev + 1);
          connect();
        }, backoffDelay);
      };
    } catch (error) {
      console.error('SSE: Failed to create EventSource:', error);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  };

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Visibility change handler to reconnect when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !eventSourceRef.current) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    isConnected,
    lastEvent,
    connect,
    disconnect
  };
}