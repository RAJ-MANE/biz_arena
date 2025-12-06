import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-middleware';

// GET handler - Get system settings (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Require admin JWT (auth-token) or throw 403
    try {
      await requireAdmin(request as any);
    } catch (err) {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    const settings = await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.key);

    // Convert to key-value object for easier consumption
    const settingsMap = settings.reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(settingsMap);

  } catch (error) {
    console.error('GET system settings error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch system settings',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PATCH handler - Update system setting (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Require admin JWT (auth-token) or throw 403
    try {
      await requireAdmin(request as any);
    } catch (err) {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json({ 
        error: 'Setting key is required', 
        code: 'MISSING_KEY' 
      }, { status: 400 });
    }

    if (value === undefined) {
      return NextResponse.json({ 
        error: 'Setting value is required', 
        code: 'MISSING_VALUE' 
      }, { status: 400 });
    }

    // Special validation for registration_deadline
    if (key === 'registration_deadline' && value) {
      const deadline = new Date(value);
      if (isNaN(deadline.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid deadline format. Use ISO date string.', 
          code: 'INVALID_DEADLINE_FORMAT' 
        }, { status: 400 });
      }
    }

    // Check if setting exists
    const existingSetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json({ 
        error: 'Setting not found', 
        code: 'SETTING_NOT_FOUND' 
      }, { status: 404 });
    }

    // Update the setting
    const updatedSetting = await db
      .update(systemSettings)
      .set({
        value: String(value),
        updatedAt: new Date()
      })
      .where(eq(systemSettings.key, key))
      .returning();

    return NextResponse.json({
      ...updatedSetting[0],
      message: `Setting '${key}' updated successfully`
    });

  } catch (error: any) {
    console.error('PATCH system settings error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to update setting',
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}