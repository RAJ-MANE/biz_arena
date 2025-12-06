import { NextRequest, NextResponse } from 'next/server';
import { votingEmitter } from '@/lib/voting-emitter';
import { ratingEmitter } from '@/lib/rating-emitter';

export async function GET(request: NextRequest) {
  try {
    // Get health stats from both emitters
    const votingStats = votingEmitter.getHealthStats();
    const ratingStats = ratingEmitter.getHealthStats();

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      sse: {
        voting: {
          activeConnections: votingStats.activeConnections,
          lastCheck: votingStats.timestamp
        },
        rating: {
          activeConnections: ratingStats.activeConnections,
          lastCheck: ratingStats.timestamp
        },
        total: votingStats.activeConnections + ratingStats.activeConnections
      },
      memory: {
        used: Math.round(votingStats.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(votingStats.memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(votingStats.memoryUsage.external / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()) + 's'
    };

    return NextResponse.json(healthData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}