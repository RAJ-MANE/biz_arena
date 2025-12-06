import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, votes, tokenConversions, peerRatings, judgeScores } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET handler - Generate token-based leaderboard with cumulative scoring
export async function GET(request: NextRequest) {
  try {
    // Get all teams
    const allTeams = await db.select().from(teams).orderBy(teams.name);
    
    if (allTeams.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        metadata: {
          totalTeams: 0,
          generatedAt: new Date().toISOString(),
          focus: 'Token-based competition with cumulative scoring',
          rankingCriteria: ['Total cumulative score from tokens and judge scores', 'Original yes votes (count) as tiebreaker'],
          participation: {
            quizSubmissions: 0,
            votingParticipation: 0,
            peerRatings: 0,
            tokenSpending: 0,
          },
          explanation: {
            tokens: 'Cumulative score from 4 token categories earned in quiz',
            voting: 'Original yes votes (count) are used as the tiebreaker; votes gained from token conversions are not counted for tiebreaks',
            judgeScores: 'Scores given by judges in final evaluation',
          }
        }
      });
    }

    // Initialize leaderboard data
    const leaderboard = [];

    for (const team of allTeams) {
      const teamId = team.id;
      
      try {
        // Get quiz tokens and remaining tokens (after any conversions)
        const quizData = await db
          .select({
            tokensMarketing: quizSubmissions.tokensMarketing,
            tokensCapital: quizSubmissions.tokensCapital,
            tokensTeam: quizSubmissions.tokensTeam,
            tokensStrategy: quizSubmissions.tokensStrategy,
            remainingMarketing: quizSubmissions.remainingMarketing,
            remainingCapital: quizSubmissions.remainingCapital,
            remainingTeam: quizSubmissions.remainingTeam,
            remainingStrategy: quizSubmissions.remainingStrategy,
          })
          .from(quizSubmissions)
          .where(eq(quizSubmissions.teamId, teamId))
          .limit(1);

        const tokens = quizData.length > 0 ? {
          marketing: quizData[0].tokensMarketing || 0,
          capital: quizData[0].tokensCapital || 0,
          team: quizData[0].tokensTeam || 0,
          strategy: quizData[0].tokensStrategy || 0,
        } : { marketing: 0, capital: 0, team: 0, strategy: 0 };

        const remaining = quizData.length > 0 ? {
          marketing: quizData[0].remainingMarketing ?? 0,
          capital: quizData[0].remainingCapital ?? 0,
          team: quizData[0].remainingTeam ?? 0,
          strategy: quizData[0].remainingStrategy ?? 0,
        } : { marketing: 0, capital: 0, team: 0, strategy: 0 };

        // Calculate totals
        // Earned total (original tokens from quiz)
        const earnedTokenScore = Math.round(Number(tokens.marketing)) + 
                                 Math.round(Number(tokens.capital)) + 
                                 Math.round(Number(tokens.team)) + 
                                 Math.round(Number(tokens.strategy));

        // Remaining total (after conversions) - this is the authoritative token score used for final ranking
        const remainingTokenScore = Math.round(Number(remaining.marketing)) + 
                                    Math.round(Number(remaining.capital)) + 
                                    Math.round(Number(remaining.team)) + 
                                    Math.round(Number(remaining.strategy));

        // Get voting data (original votes): net votes and counts of yes/no for transparency
        const voteData = await db
          .select({
            netVotes: sql<number>`COALESCE(SUM(${votes.value}), 0)`,
            yesCount: sql<number>`COALESCE(SUM(CASE WHEN ${votes.value} = 1 THEN 1 ELSE 0 END), 0)`,
            noCount: sql<number>`COALESCE(SUM(CASE WHEN ${votes.value} = -1 THEN 1 ELSE 0 END), 0)`,
          })
          .from(votes)
          .where(eq(votes.toTeamId, teamId));

        const originalVotesNet = Math.round(Number(voteData[0]?.netVotes)) || 0;
        const originalYesCount = Math.round(Number(voteData[0]?.yesCount)) || 0;
        const originalNoCount = Math.round(Number(voteData[0]?.noCount)) || 0;

        // Get token conversion votes
        const tokenVoteData = await db
          .select({
            totalTokenVotes: sql<number>`COALESCE(SUM(${tokenConversions.votesGained}), 0)`,
            tokensSpent: sql<number>`COALESCE(SUM(${tokenConversions.tokensUsed}), 0)`,
          })
          .from(tokenConversions)
          .where(eq(tokenConversions.teamId, teamId));

  const votesFromTokens = Math.round(Number(tokenVoteData[0]?.totalTokenVotes)) || 0;
  const tokensSpent = Math.round(Number(tokenVoteData[0]?.tokensSpent)) || 0;
  // totalVotes used for tiebreaker: net original votes + votes from token conversions
  const totalVotes = originalVotesNet + votesFromTokens;

  // tokensSpent is the total tokens used in conversions; remainingTokenScore is authoritative when available

        // Get peer ratings: sum of all peer ratings (not average) and count
        const peerRatingData = await db
          .select({
            totalPeerScore: sql<number>`COALESCE(SUM(CAST(${peerRatings.rating} AS INTEGER)), 0)`,
            ratingCount: sql<number>`COALESCE(COUNT(${peerRatings.id}), 0)`,
          })
          .from(peerRatings)
          .where(eq(peerRatings.toTeamId, teamId));

        const peerRatingTotal = Math.round(Number(peerRatingData[0]?.totalPeerScore)) || 0;
        const peerRatingCount = Math.round(Number(peerRatingData[0]?.ratingCount)) || 0;

        // Get judge scores (sum and average)
        const judgeScoreData = await db
          .select({
            totalJudgeScore: sql<number>`COALESCE(SUM(${judgeScores.score}), 0)`,
            avgJudgeScore: sql<number>`COALESCE(AVG(CAST(${judgeScores.score} AS DECIMAL)), 0)`,
            judgeCount: sql<number>`COALESCE(COUNT(${judgeScores.id}), 0)`,
          })
          .from(judgeScores)
          .where(eq(judgeScores.teamId, teamId));

  const totalJudgeScore = Math.round(Number(judgeScoreData[0]?.totalJudgeScore)) || 0;
  const avgJudgeScore = Number(judgeScoreData[0]?.avgJudgeScore) || 0;
  const judgeCount = Math.round(Number(judgeScoreData[0]?.judgeCount)) || 0;

  // Also fetch original quiz score (rawScore) for tiebreaker and transparency
        const quizRawData = await db
          .select({ rawScore: quizSubmissions.rawScore })
          .from(quizSubmissions)
          .where(eq(quizSubmissions.teamId, teamId))
          .limit(1);

        const originalQuizScore = quizRawData.length > 0 ? Number(quizRawData[0].rawScore || 0) : 0;

  // Calculate final cumulative score: judge total + peer total + remaining tokens (votes are only used for tiebreakers)
  const finalCumulativeScore = totalJudgeScore + peerRatingTotal + remainingTokenScore;

        leaderboard.push({
          rank: 0, // Will be set after sorting
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          tokens: {
            marketing: tokens.marketing,
            capital: tokens.capital,
            team: tokens.team,
            strategy: tokens.strategy,
            // Expose the authoritative token total as remaining tokens (used in ranking/score)
            total: remainingTokenScore,
            // also include remaining per-category for clarity
            remaining: {
              marketing: remaining.marketing,
              capital: remaining.capital,
              team: remaining.team,
              strategy: remaining.strategy,
            }
          },
          tokenActivity: {
            earned: earnedTokenScore,
            spent: tokensSpent,
            remaining: remainingTokenScore,
          },
          voting: {
            originalVotesNet: originalVotesNet,
            originalYesVotes: originalYesCount,
            originalNoVotes: originalNoCount,
            votesFromTokens: votesFromTokens,
            totalVotes: totalVotes,
          },
          peerRating: {
            total: peerRatingTotal,
            count: peerRatingCount,
          },
          judgeScores: {
            // Keep total available (authoritative for final ranking)
            total: totalJudgeScore,
            // For backward compatibility some clients read `.average` — map it to the total so UIs show totals instead of averages
            average: totalJudgeScore,
            count: judgeCount,
          },
          originalQuizScore,
          finalCumulativeScore: finalCumulativeScore,
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
          tokens: { marketing: 0, capital: 0, team: 0, strategy: 0, total: 0 },
          tokenActivity: { earned: 0, spent: 0, remaining: 0 },
          voting: { originalVotesNet: 0, originalYesVotes: 0, originalNoVotes: 0, votesFromTokens: 0, totalVotes: 0 },
          peerRating: { average: 0, count: 0 },
          judgeScores: { total: 0, average: 0, count: 0 },
          finalCumulativeScore: 0,
          hasQuizSubmission: false,
        });
      }
    }

    // Sort by final cumulative score DESC. First tiebreaker: original yes votes (count). Final tiebreaker: alphabetical team name.
    leaderboard.sort((a, b) => {
      if (b.finalCumulativeScore !== a.finalCumulativeScore) {
        return b.finalCumulativeScore - a.finalCumulativeScore;
      }
      const aOriginalYes = a.voting?.originalYesVotes || 0;
      const bOriginalYes = b.voting?.originalYesVotes || 0;
      if (bOriginalYes !== aOriginalYes) return bOriginalYes - aOriginalYes;
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
          team.finalCumulativeScore === currentTeam.finalCumulativeScore
        );
        
        if (tiedTeams.length > 1) {
          const otherTiedTeams = tiedTeams.filter(team => team.rank > position);
          
          if (otherTiedTeams.length > 0) {
            let reason = "";
            const nextBestTeam = otherTiedTeams[0];
            
            // Per rules: first tiebreaker is original yes votes (count)
            if ((currentTeam.voting?.originalYesVotes || 0) > (nextBestTeam.voting?.originalYesVotes || 0)) {
              reason = `higher original yes votes (${currentTeam.voting.originalYesVotes} vs ${nextBestTeam.voting.originalYesVotes})`;
            } else {
              reason = `alphabetical order of team name`;
            }
            
            const positionName = position === 1 ? "1st place (Winner)" : 
                               position === 2 ? "2nd place" : "3rd place";
            
            winnerNotes.push({
              position: position,
              type: 'tiebreaker',
              message: `Tiebreaker applied for ${positionName}: ${currentTeam.teamName} placed above ${otherTiedTeams.map(t => t.teamName).join(', ')} due to ${reason}.`,
              tiedScore: currentTeam.finalCumulativeScore,
              tiedTeams: tiedTeams.map(t => ({ name: t.teamName, rank: t.rank }))
            });
          }
        }
      }
    }

    // Calculate participation statistics
    const totalQuizSubmissions = leaderboard.filter(t => t.hasQuizSubmission).length;
  const totalVotingParticipation = leaderboard.filter(t => (t.voting?.totalVotes || 0) > 0).length;
    const totalPeerRatings = leaderboard.reduce((sum, t) => sum + t.peerRating.count, 0);
    const totalTokenSpending = leaderboard.filter(t => t.tokenActivity.spent > 0).length;

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      winnerNotes: winnerNotes,
      metadata: {
        totalTeams: allTeams.length,
        generatedAt: new Date().toISOString(),
        focus: 'Token-based competition with cumulative scoring from 4 categories plus judge evaluation',
        rankingCriteria: [
          'Final cumulative score (judge total + peer total + remaining token score)',
          'Original votes received (net) as first tiebreaker',
          'Team name alphabetical order as final tiebreaker'
        ],
        participation: {
          quizSubmissions: totalQuizSubmissions,
          votingParticipation: totalVotingParticipation,
          peerRatings: totalPeerRatings,
          tokenSpending: totalTokenSpending,
        },
        explanation: {
          tokens: 'Cumulative sum of Marketing + Capital + Team + Strategy tokens earned through quiz',
          voting: 'Original votes received (net) are used as the first tiebreaker; votes gained from token conversions are not considered for tiebreaking',
          judgeScores: 'Total scores awarded by judges during final evaluation round (sum of all judges)',
          peerScores: 'Sum of all peer ratings received by the team',
          finalScore: 'Sum of judge total + peer total + remaining token score (after conversions)',
          tiebreakers: 'If teams have identical final scores, the first tiebreaker is original votes (net); if still tied the alphabetical order of team name is used.'
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