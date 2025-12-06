import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, options } from "@/db/schema";

// Middleware to check admin authentication
function requireAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin-auth=true")) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all questions with their options
    const allQuestions = await db
      .select({
        id: questions.id,
        text: questions.text,
        order: questions.order,
        maxTokenPerQuestion: questions.maxTokenPerQuestion,
        createdAt: questions.createdAt
      })
      .from(questions)
      .orderBy(questions.order, questions.id);

    // Fetch options for each question
    const questionsWithOptions = await Promise.all(
      allQuestions.map(async (question: any) => {
        const questionOptions = await db
          .select()
          .from(options)
          .where(eq(options.questionId, question.id))
          .orderBy(options.order);

        return {
          ...question,
          options: questionOptions
        };
      })
    );

    return NextResponse.json(questionsWithOptions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, maxTokenPerQuestion = 4, questionOptions = [] } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    if (questionOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    }

    // Check if we already have 15 questions
    const questionCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions);

    if (questionCount[0]?.count >= 15) {
      return NextResponse.json({ error: "Maximum of 15 questions allowed" }, { status: 400 });
    }

    // Get the next order number
    const lastQuestion = await db
      .select({ order: questions.order })
      .from(questions)
      .orderBy(desc(questions.order))
      .limit(1);

    const nextOrder = (lastQuestion[0]?.order || 0) + 1;

    // Create the question
    const newQuestion = await db
      .insert(questions)
      .values({
        text: text.trim(),
        order: nextOrder,
        maxTokenPerQuestion,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Create the options
    const questionId = newQuestion[0].id;
    const optionsToInsert = questionOptions.map((option: any, index: number) => ({
      questionId,
      text: option.text,
      order: index + 1,
      tokenDeltaMarketing: option.tokenDeltaMarketing || 0,
      tokenDeltaCapital: option.tokenDeltaCapital || 0,
      tokenDeltaTeam: option.tokenDeltaTeam || 0,
      tokenDeltaStrategy: option.tokenDeltaStrategy || 0,
      totalScoreDelta: option.totalScoreDelta || 0,
      createdAt: new Date()
    }));

    await db.insert(options).values(optionsToInsert);

    // Return the complete question with options
    const createdOptions = await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(options.order);

    return NextResponse.json({
      ...newQuestion[0],
      options: createdOptions
    });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questionId } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    // Delete the question (options will be deleted automatically due to cascade)
    await db.delete(questions).where(eq(questions.id, questionId));

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questionId, text, maxTokenPerQuestion, questionOptions } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    if (questionOptions && questionOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    }

    // Update the question
    await db
      .update(questions)
      .set({
        text: text.trim(),
        maxTokenPerQuestion: maxTokenPerQuestion || 4,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId));

    // If options are provided, update them
    if (questionOptions) {
      // Delete existing options
      await db.delete(options).where(eq(options.questionId, questionId));

      // Insert new options
      const optionsToInsert = questionOptions.map((option: any, index: number) => ({
        questionId,
        text: option.text,
        order: index + 1,
        tokenDeltaMarketing: option.tokenDeltaMarketing || 0,
        tokenDeltaCapital: option.tokenDeltaCapital || 0,
        tokenDeltaTeam: option.tokenDeltaTeam || 0,
        tokenDeltaStrategy: option.tokenDeltaStrategy || 0,
        totalScoreDelta: option.totalScoreDelta || 0,
        createdAt: new Date()
      }));

      await db.insert(options).values(optionsToInsert);
    }

    // Return updated question with options
    const updatedQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    const updatedOptions = await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(options.order);

    return NextResponse.json({
      ...updatedQuestion[0],
      options: updatedOptions
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}