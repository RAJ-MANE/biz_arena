import { NextRequest } from 'next/server';
import { votingEmitter } from '@/lib/voting-emitter';

// Free tier optimization: limit concurrent connections
const MAX_CONNECTIONS = 50;
let activeConnections = 0;

export async function GET(request: NextRequest) {
  // Free tier protection: limit concurrent SSE connections
  if (activeConnections >= MAX_CONNECTIONS) {
    return new Response('Too many connections', { status: 503 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      activeConnections++;
      
      // Send initial connection message
      const initialData = JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
        message: 'Connected to voting updates',
        connectionId: Math.random().toString(36).substr(2, 9)
      });
      
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Create sender function for this client with throttling
      let lastSent = 0;
      const THROTTLE_DELAY = 1000; // Minimum 1 second between messages

      const sendEvent = (data: any) => {
        const now = Date.now();
        if (now - lastSent < THROTTLE_DELAY) {
          return; // Skip this event due to throttling
        }
        
        try {
          const eventData = JSON.stringify({
            ...data,
            timestamp: now
          });
          controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
          lastSent = now;
        } catch (error) {
          console.error('Error encoding SSE data:', error);
          cleanup();
        }
      };

      // Add client to emitter
      votingEmitter.addClient(sendEvent);

      // Optimized heartbeat for free tier - less frequent
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now(),
            activeConnections: votingEmitter.getClientCount()
          });
          controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
        } catch (error) {
          cleanup();
        }
      }, 60000); // Every 60 seconds instead of 30

      const cleanup = () => {
        clearInterval(heartbeat);
        votingEmitter.removeClient(sendEvent);
        activeConnections = Math.max(0, activeConnections - 1);
        try {
          controller.close();
        } catch (e) {
          // Connection already closed
        }
      };

      // Handle client disconnect
      request.signal?.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}