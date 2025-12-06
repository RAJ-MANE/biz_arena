import { useEffect, useState } from 'react';

interface RatingEvent {
  type: string;
  data?: any;
  timestamp?: number;
  message?: string;
}

export function useRatingSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RatingEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let connectionAttempts = 0;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/sse/rating');

        eventSource.onopen = () => {
          console.log('Rating SSE connected');
          setIsConnected(true);
          setError(null);
          connectionAttempts = 0;
          setLastEvent({ type: 'connected' });
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Ignore heartbeat events
            if (data && data.type === 'heartbeat') return;
            console.log('Rating SSE event received:', data);
            setLastEvent(data);
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error('Rating SSE error:', error);
          setIsConnected(false);
          setError('Connection error');

          const backoff = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
          connectionAttempts++;
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => connect(), backoff);
        };

      } catch (error) {
        console.error('Error creating Rating SSE connection:', error);
        setError('Failed to connect');
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return { isConnected, lastEvent, error };
}