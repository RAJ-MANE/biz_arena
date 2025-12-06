import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown'
    };

    // Test database connection
    try {
      await db.execute('SELECT 1 as test');
      health.database = 'connected';
    } catch (dbError) {
      health.database = 'disconnected';
      health.status = 'degraded';
    }

    // Check if admin accounts exist
    try {
      const { user } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const adminCount = await db.select().from(user).where(eq(user.isAdmin, true));
      health.adminAccounts = adminCount.length;
    } catch (error) {
      health.adminAccounts = 'unknown';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}