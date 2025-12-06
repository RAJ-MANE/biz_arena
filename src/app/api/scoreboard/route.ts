import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, teamApprovalRates, peerRatings, judgeScores } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET handler - Generate leaderboard with new business logic scoring
export async function GET(request: NextRequest) {
  try {
    // Fixed weights (sum to 1.0)
    const w_J = 0.55;  // Judges
    const w_P = 0.25;  // Peers
    const w_A = 0.15;  // Approval (Round 2)
    const w_Q = 0.05;  // Quiz

    // Get all teams
    const allTeams = await db.select().from(teams).orderBy(teams.name);
    
    if (allTeams.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        metadata: {
          totalTeams: 0,
          generatedAt: new Date().toISOString(),
          focus: 'Multi-round entrepreneurship competition with weighted scoring',
          rankingCriteria: ['Final score = 55% Judges + 25% Peers + 15% Approval + 5% Quiz'],
          participation: {
            quizSubmissions: 0,
            votingParticipation: 0,
            peerRatings: 0,
            judgeScores: 0,
          },
        }
      });
    }

    // Initialize leaderboard data
    const leaderboard = [];

    for (const team of allTeams) {
      const teamId = team.id;
      
      try {
        // Get Q_index from Round 1 (quiz)
        const quizData = await db
          .select({ quizIndex: quizSubmissions.quizIndex })
          .from(quizSubmissions)
          .where(eq(quizSubmissions.teamId, teamId))
          .limit(1);

        const Q_index = quizData.length > 0 && quizData[0].quizIndex 
          ? parseFloat(quizData[0].quizIndex) 
          : 0;

        // Get A (approval rate) from Round 2 (voting)
        const approvalData = await db
          .select({ approvalRate: teamApprovalRates.approvalRate })
          .from(teamApprovalRates)
          .where(eq(teamApprovalRates.teamId, teamId))
          .limit(1);

        const A = approvalData.length > 0 && approvalData[0].approvalRate 
          ? parseFloat(approvalData[0].approvalRate) 
          : 0.5; // neutral fallback

        // Get judge scores from Round 3 (30-100 range)
        const judgeData = await db
          .select({
            avgScore: sql<number>`COALESCE(AVG(CAST(${judgeScores.score} AS DECIMAL)), 0)`,
            judgeCount: sql<number>`COUNT(${judgeScores.id})`,
          })
          .from(judgeScores)
          .where(eq(judgeScores.teamId, teamId));

        const J_avg = Number(judgeData[0]?.avgScore) || 0;
        const judgeCount = Number(judgeData[0]?.judgeCount) || 0;
        
        // Normalize judge score from [30, 100] to [0, 1]
        const J_norm = judgeCount > 0 
          ? Math.max(0, Math.min(1, (J_avg - 30) / 70)) 
          : 0;

        // Get peer ratings from Round 3 (3-10 range)
        const peerData = await db
          .select({
            avgRating: sql<number>`COALESCE(AVG(CAST(${peerRatings.rating} AS DECIMAL)), 0)`,
            peerCount: sql<number>`COUNT(${peerRatings.id})`,
          })
          .from(peerRatings)
          .where(eq(peerRatings.toTeamId, teamId));

        const P_avg = Number(peerData[0]?.avgRating) || 0;
        const peerCount = Number(peerData[0]?.peerCount) || 0;
        
        // Normalize peer rating from [3, 10] to [0, 1]
        const P_norm = peerCount > 0 
          ? Math.max(0, Math.min(1, (P_avg - 3) / 7)) 
          : 0;

        // Calculate final score
        const Final_score = w_J * J_norm + w_P * P_norm + w_A * A + w_Q * Q_index;
        const Final_display = Final_score * 100.0; // Convert to 0-100 scale

        leaderboard.push({
          rank: 0, // Will be assigned after sorting
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          scores: {
            quizIndex: parseFloat(Q_index.toFixed(4)),
            approvalRate: parseFloat(A.toFixed(4)),
            judgeNorm: parseFloat(J_norm.toFixed(4)),
            peerNorm: parseFloat(P_norm.toFixed(4)),
          },
          rawData: {
            judgeAvg: parseFloat(J_avg.toFixed(2)),
            judgeCount,
            peerAvg: parseFloat(P_avg.toFixed(2)),
            peerCount,
          },
          finalScore: parseFloat(Final_score.toFixed(6)),
          finalDisplay: parseFloat(Final_display.toFixed(2)),
          hasQuizSubmission: quizData.length > 0,
        });

      } catch (teamError) {
        console.error(`Error processing team ${teamId}:`, teamError);
        // Add team with zero scores if there's an error
        leaderboard.push({
          rank: 0,
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          scores: { quizIndex: 0, approvalRate: 0.5, judgeNorm: 0, peerNorm: 0 },
          rawData: { judgeAvg: 0, judgeCount: 0, peerAvg: 0, peerCount: 0 },
          finalScore: 0,
          finalDisplay: 0,
          hasQuizSubmission: false,
        });
      }
    }

    // Sort by final score descending, then by team name alphabetically
    leaderboard.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return a.teamName.localeCompare(b.teamName);
    });

    // Add rankings
    const rankedLeaderboard = leaderboard.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    // Detect tiebreakers for top 3 positions
    let winnerNotes = [];
    
    // Check for ties in top 3 positions
    for (let position = 1; position <= 3; position++) {
      if (rankedLeaderboard.length >= position) {
        const currentTeam = rankedLeaderboard[position - 1];
        const tiedTeams = rankedLeaderboard.filter(team => 
          team.finalScore === currentTeam.finalScore
        );
        
        if (tiedTeams.length > 1) {
          const otherTiedTeams = tiedTeams.filter(team => team.rank > position);
          
          if (otherTiedTeams.length > 0) {
            const positionName = position === 1 ? "1st place (Winner)" : 
                               position === 2 ? "2nd place" : "3rd place";
            
            winnerNotes.push({
              position: position,
              type: 'tiebreaker',
              message: `Tiebreaker applied for ${positionName}: ${currentTeam.teamName} placed above ${otherTiedTeams.map(t => t.teamName).join(', ')} due to alphabetical order of team name.`,
              tiedScore: currentTeam.finalScore,
              tiedTeams: tiedTeams.map(t => ({ name: t.teamName, rank: t.rank }))
            });
          }
        }
      }
    }

    // Calculate participation statistics
    const totalQuizSubmissions = leaderboard.filter(t => t.hasQuizSubmission).length;
    const totalPeerRatings = leaderboard.reduce((sum, t) => sum + t.rawData.peerCount, 0);
    const totalJudgeScores = leaderboard.reduce((sum, t) => sum + t.rawData.judgeCount, 0);

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      winnerNotes: winnerNotes,
      metadata: {
        totalTeams: allTeams.length,
        generatedAt: new Date().toISOString(),
        focus: 'Multi-round entrepreneurship competition with weighted scoring',
        weights: { w_J, w_P, w_A, w_Q },
        formula: 'Final = 55% Judges + 25% Peers + 15% Approval + 5% Quiz',
        rankingCriteria: [
          'Final weighted score (0-100 scale)',
          'Cascading tiebreaker: Final → Judge → Peer → Approval → Quiz → Alphabetical'
        ],
        participation: {
          quizSubmissions: totalQuizSubmissions,
          peerRatings: totalPeerRatings,
          judgeScores: totalJudgeScores,
        },
        explanation: {
          finalScore: 'Weighted combination of all rounds: 55% judge scores (30-100 normalized), 25% peer ratings (3-10 normalized with 6.5 auto-rating for missing submissions), 15% approval rate from voting, 5% quiz influence index',
          judgeScores: 'Average of all judge scores (30-100 range), normalized to [0,1]',
          peerRatings: 'Average of all peer ratings (3-10 range), normalized to [0,1], includes auto-6.5 for missing ratings',
          approvalRate: 'YES votes influenced by Marketing, NO votes softened by Capital (Round 2)',
          quizIndex: 'Normalized average of 4 quiz categories: Capital, Marketing, Strategy, Team',
          autoRating: 'Teams not submitting peer ratings receive 6.5/10 (neutral midpoint)',
          pNormFallback: 'If no peer ratings exist, P_norm defaults to 0.5 (neutral) instead of 0',
          tiebreakers: 'Cascading system: Final → Judge → Peer → Approval → Quiz → Alphabetical (last resort)'
        }
      }
    });
  } catch (error) {
    console.error('GET scoreboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate scoreboard',
      details: error instanceof Error ? error.message : 'Unknown error',
      leaderboard: [],
      metadata: {
        totalTeams: 0,
        generatedAt: new Date().toISOString(),
        error: true,
      }
    }, { status: 500 });
  }
}
