import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-middleware';

// PATCH handler - Update question (Admin only)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin(request);
    
    const { id } = await context.params;
    const questionId = parseInt(id);
    if (!questionId || isNaN(questionId)) {
      return NextResponse.json({ error: 'Valid question ID is required', code: 'INVALID_ID' }, { status: 400 });
    }
    const updates = await request.json();
    const allowedFields = ['text', 'order', 'maxTokenPerQuestion'];
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        if (key === 'text' && typeof value === 'string') {
          filteredUpdates[key] = value.trim();
        } else if (key === 'maxTokenPerQuestion' && typeof value === 'number') {
          if (value < 1 || value > 4) {
            return NextResponse.json({ error: 'Max token per question must be between 1 and 4', code: 'INVALID_MAX_TOKEN' }, { status: 400 });
          }
          filteredUpdates[key] = value;
        } else if (key === 'order' && (typeof value === 'number' || typeof value === 'string')) {
          filteredUpdates[key] = value;
        }
      }
    }
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update', code: 'NO_VALID_FIELDS' }, { status: 400 });
    }
    const updatedQuestion = await db
      .update(questions)
      .set({ ...filteredUpdates, updatedAt: new Date() })
      .where(eq(questions.id, questionId))
      .returning();
    if (updatedQuestion.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json(updatedQuestion[0]);
  } catch (error) {
    console.error('PATCH question error:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ 
        error: error.message,
        code: error.message === 'Authentication required' ? 'UNAUTHENTICATED' : 'ADMIN_REQUIRED'
      }, { status: error.message === 'Authentication required' ? 401 : 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler - Delete question (Admin only)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin(request);
    
    const { id } = await context.params;
    const questionId = parseInt(id);
    if (!questionId || isNaN(questionId)) {
      return NextResponse.json({ error: 'Valid question ID is required', code: 'INVALID_ID' }, { status: 400 });
    }
    // Delete question (cascade will handle options)
    const deletedQuestion = await db
      .delete(questions)
      .where(eq(questions.id, questionId))
      .returning();
    if (deletedQuestion.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Question successfully deleted', question: deletedQuestion[0] });
  } catch (error) {
    console.error('DELETE question error:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ 
        error: error.message,
        code: error.message === 'Authentication required' ? 'UNAUTHENTICATED' : 'ADMIN_REQUIRED'
      }, { status: error.message === 'Authentication required' ? 401 : 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}