import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || '';

    // Mask the password for safety
    // Format: postgres://user:password@host:port/db
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');

    // Check if it contains the special encoding we expect
    const hasEncodedAt = dbUrl.includes('%40');

    return NextResponse.json({
        envCheck: {
            hasDbUrl: !!dbUrl,
            urlPreview: maskedUrl,
            isCorrectlyEncoded: hasEncodedAt,
            // Helper to see if it matches the project we expect
            host: dbUrl.split('@')[1]?.split(':')[0] || 'unknown'
        },
        message: "If 'isCorrectlyEncoded' is false, your Vercel Environment Variable is still using '@' instead of '%40'."
    });
}
