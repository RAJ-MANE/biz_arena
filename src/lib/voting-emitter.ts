// Global event emitter for server-sent events
class VotingEventEmitter {
  private static instance: VotingEventEmitter;
  private clients: Set<(data: any) => void> = new Set();
  private coalesceTimer: NodeJS.Timeout | null = null;
  private pending: any = null;
  private readonly COALESCE_MS = 150;
  private readonly HEARTBEAT_MS = 15000; // 15s heartbeat
  private heartbeatTimer: NodeJS.Timeout | null = null;

  static getInstance(): VotingEventEmitter {
    if (!VotingEventEmitter.instance) {
      VotingEventEmitter.instance = new VotingEventEmitter();
    }
    return VotingEventEmitter.instance;
  }

  addClient(sendEvent: (data: any) => void) {
    this.clients.add(sendEvent);
    console.log(`SSE: Client connected. Active connections: ${this.clients.size}`);
    // start heartbeat timer when first client connects
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        this.immediateBroadcast({ type: 'heartbeat', timestamp: Date.now() });
      }, this.HEARTBEAT_MS);
    }
  }

  removeClient(sendEvent: (data: any) => void) {
    this.clients.delete(sendEvent);
    console.log(`SSE: Client disconnected. Active connections: ${this.clients.size}`);
    // stop heartbeat when no clients
    if (this.clients.size === 0 && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  // Coalesced broadcast: batch rapid successive calls to reduce churn
  broadcast(data: any) {
    this.pending = data;
    if (this.coalesceTimer) return;
    this.coalesceTimer = setTimeout(() => {
      const d = this.pending;
      this.pending = null;
      this.coalesceTimer = null;
      this.immediateBroadcast(d);
    }, this.COALESCE_MS);
  }

  // Immediately broadcast without coalescing (used for heartbeats or critical events)
  immediateBroadcast(data: any) {
    const clientCount = this.clients.size;
    try {
      console.log(`SSE: Broadcasting to ${clientCount} clients:`, data.type || 'unknown');
    } catch (e) {
      // ignore logging errors
    }

    let successCount = 0;
    let errorCount = 0;

    this.clients.forEach(client => {
      try {
        client(data);
        successCount++;
      } catch (error) {
        console.error('SSE: Error sending event to client:', error);
        this.clients.delete(client);
        errorCount++;
      }
    });

    if (errorCount > 0) {
      console.log(`SSE: Broadcast completed. Success: ${successCount}, Errors: ${errorCount}, Remaining: ${this.clients.size}`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  // Health check method for monitoring
  getHealthStats() {
    return {
      activeConnections: this.clients.size,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage()
    };
  }
}

export const votingEmitter = VotingEventEmitter.getInstance();