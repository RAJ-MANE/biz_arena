import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quizSubmissions, teams, user, rounds, questions, options } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
  // Authenticate user
  const authUser = await requireAuth(req);
    
    const { teamId, answers, durationSeconds } = await req.json();

    // Validate required fields
    if (!teamId || !answers || !Array.isArray(answers) || durationSeconds === undefined) {
      return NextResponse.json({ 
        error: 'Team ID, answers array, and duration are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify user belongs to the specified team
    if (!authUser.team || authUser.team.id !== teamId) {
      return NextResponse.json({ 
        error: 'You can only submit quiz for your own team', 
        code: 'TEAM_MISMATCH' 
      }, { status: 403 });
    }

    // Check if quiz round is active
    const quizRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'QUIZ'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    if (quizRound.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz round is not currently active', 
        code: 'QUIZ_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Validate time limit (30 minutes = 1800 seconds)
    if (durationSeconds > 1800) {
      return NextResponse.json({ 
        error: 'Quiz submission exceeded time limit of 30 minutes', 
        code: 'TIME_LIMIT_EXCEEDED' 
      }, { status: 400 });
    }

    // Check if team already submitted
    const existingSubmission = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.teamId, teamId))
      .limit(1);

    if (existingSubmission.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already submitted quiz', 
        code: 'ALREADY_SUBMITTED' 
      }, { status: 409 });
    }



    // Validate answers format
    if (answers.length !== 15) {
      return NextResponse.json({ 
        error: 'Quiz must have exactly 15 answers', 
        code: 'INVALID_ANSWER_COUNT' 
      }, { status: 400 });
    }

    // Validate answer structure
    for (const answer of answers) {
      if (!answer.questionId || !answer.optionId) {
        return NextResponse.json({ 
          error: 'Each answer must have questionId and optionId', 
          code: 'INVALID_ANSWER_FORMAT' 
        }, { status: 400 });
      }
    }

    const questionIds = answers.map(a => a.questionId);
    const optionIds = answers.map(a => a.optionId);

    // Validate all question IDs are unique
    const uniqueQuestionIds = new Set(questionIds);
    if (uniqueQuestionIds.size !== 15) {
      return NextResponse.json({ 
        error: 'All 15 questions must be answered exactly once', 
        code: 'DUPLICATE_QUESTIONS' 
      }, { status: 400 });
    }

    // Get all questions and validate they exist
    const questionsData = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds));

    if (questionsData.length !== 15) {
      return NextResponse.json({ 
        error: 'Invalid questions in answers', 
        code: 'INVALID_QUESTIONS' 
      }, { status: 400 });
    }

    // Get all options and validate they exist
    const optionsData = await db
      .select()
      .from(options)
      .where(inArray(options.id, optionIds));

    if (optionsData.length !== 15) {
      return NextResponse.json({ 
        error: 'Invalid options in answers', 
        code: 'INVALID_OPTIONS' 
      }, { status: 400 });
    }

    // Validate that each option belongs to its corresponding question
    for (const answer of answers) {
      const option = optionsData.find((o: any) => o.id === answer.optionId);
      if (!option || option.questionId !== answer.questionId) {
        return NextResponse.json({ 
          error: 'Option does not belong to the specified question', 
          code: 'MISMATCHED_OPTION_QUESTION' 
        }, { status: 400 });
      }
    }

    // Calculate tokens and raw score
    let tokensMarketing = 0;
    let tokensCapital = 0;
    let tokensTeam = 0;
    let tokensStrategy = 0;
    let rawScore = 0;

    for (const answer of answers) {
      const option = optionsData.find((o: any) => o.id === answer.optionId);
      if (option) {
        tokensMarketing += option.tokenDeltaMarketing;
        tokensCapital += option.tokenDeltaCapital;
        tokensTeam += option.tokenDeltaTeam;
        tokensStrategy += option.tokenDeltaStrategy;
        
        // Calculate raw score as sum of all token deltas
        rawScore += option.tokenDeltaMarketing + option.tokenDeltaCapital + option.tokenDeltaTeam + option.tokenDeltaStrategy;
      }
    }

    // Create quiz submission
    const newSubmission = await db.insert(quizSubmissions).values({
      teamId: teamId,
      memberCount: 5,
      answers: answers,
      rawScore: rawScore,
      tokensMarketing: tokensMarketing,
      tokensCapital: tokensCapital,
      tokensTeam: tokensTeam,
      tokensStrategy: tokensStrategy,
      // Initialize remaining tokens to be same as earned tokens
      remainingMarketing: tokensMarketing,
      remainingCapital: tokensCapital,
      remainingTeam: tokensTeam,
      remainingStrategy: tokensStrategy,
      durationSeconds: durationSeconds,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      submission: newSubmission[0],
      tokens: {
        marketing: tokensMarketing,
        capital: tokensCapital,
        team: tokensTeam,
        strategy: tokensStrategy,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST quiz submit error:', error);
    
    // Handle specific authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    if (error.message === 'Team leader access required') {
      return NextResponse.json({ 
        error: 'Only team leaders can submit quiz', 
        code: 'LEADER_REQUIRED' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET handler - Get quiz submissions (optional, for admin or team viewing)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Users can only view their own team's submission
      if (authUser.team?.id !== parseInt(teamId)) {
        return NextResponse.json({ 
          error: 'You can only view your own team\'s submission', 
          code: 'UNAUTHORIZED' 
        }, { status: 403 });
      }

      const submission = await db
        .select()
        .from(quizSubmissions)
        .where(eq(quizSubmissions.teamId, parseInt(teamId)))
        .limit(1);

      return NextResponse.json(submission[0] || null);
    }

    // If no teamId specified, return user's team submission
    if (authUser.team) {
      const teamIdNum = Number(authUser.team.id);
      const submission = await db
        .select()
        .from(quizSubmissions)
        .where(eq(quizSubmissions.teamId, teamIdNum))
        .limit(1);

      return NextResponse.json(submission[0] || null);
    }

    return NextResponse.json(null);

  } catch (error: any) {
    console.error('GET quiz submit error:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}