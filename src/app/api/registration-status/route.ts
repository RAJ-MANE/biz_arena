import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET handler - Get registration status (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get registration deadline setting
    const deadlineSetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'registration_deadline'))
      .limit(1);

    let isOpen = true;
    let deadline = null;
    let message = 'Registration is open';

    if (deadlineSetting.length > 0 && deadlineSetting[0].value) {
      deadline = deadlineSetting[0].value;
      const deadlineDate = new Date(deadline);
      const now = new Date();
      
      if (!isNaN(deadlineDate.getTime())) {
        isOpen = now <= deadlineDate;
        message = isOpen 
          ? `Registration closes on ${deadlineDate.toLocaleString()}`
          : 'Registration deadline has passed';
      }
    }

    return NextResponse.json({
      isOpen,
      deadline,
      message
    });

  } catch (error) {
    console.error('GET registration status error:', error);
    // If there's an error, default to registration being open
    return NextResponse.json({
      isOpen: true,
      deadline: null,
      message: 'Registration is open'
    });
  }
}