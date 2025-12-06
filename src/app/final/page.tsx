"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Timer, Users, Trophy, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageLock from "@/components/ui/PageLock";
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useRatingSSE } from "@/hooks/useRatingSSE";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackButton } from "@/components/BackButton";
import { useRatingTimer } from '@/hooks/useRatingTimer';

interface Team {
  id: number;
  name: string;
  college: string;
}

interface PeerRating {
  id: number;
  fromTeamId: number;
  toTeamId: number;
  rating: number;
  createdAt: string;
}

interface JudgeScore {
  id: number;
  judgeName: string;
  teamId: number;
  score: number;
  createdAt: string;
}


interface RatingResponse {
  success?: boolean;
  error?: string;
  message?: string;
  rating?: any;
}

export default function FinalPage() {
  const isMobile = useIsMobile();
  // Page lock functionality
  const { isCompleted: isFinalCompleted, loading: roundLoading } = useRoundStatus('FINAL');
  
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myRatings, setMyRatings] = useState<PeerRating[]>([]);
  const [qualifiedTeams, setQualifiedTeams] = useState<any[]>([]);
  const [nonQualifiedTeams, setNonQualifiedTeams] = useState<any[]>([]);
  const [qualificationNote, setQualificationNote] = useState<any>(null);
  const [isQualified, setIsQualified] = useState<boolean>(false);
  const [finalScoreboard, setFinalScoreboard] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rate' | 'status'>('status');

  // Per-finals rating timer hook
  const { 
    currentPitchTeam, 
    ratingActive, 
    allPitchesCompleted, 
    ratingCycleActive, 
    currentPhase, 
    phaseTimeLeft, 
    cycleStartTime, 
    sseConnected,
    poll
  } = useRatingTimer();

  // Round completion tracking
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [votingCompleted, setVotingCompleted] = useState<boolean>(false);
  const [roundsLoading, setRoundsLoading] = useState<boolean>(true);

  // Rating form state (updated for Round 3)
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5); // Changed default to 5 for peer ratings (3-10)
  
  // Popup state for qualification status
  const [showQualificationPopup, setShowQualificationPopup] = useState<boolean>(false);

  const userTeamId = session?.user?.team?.id;
  const isAdmin = session?.user?.isAdmin;

  // Timer constants - match server-side constants from rating-state.ts
  const PITCH_SEC = 300; // 5 minutes (match server)
  const WARNING_SEC = 5; // 5 seconds
  const RATING_SEC = 120; // 2 minutes

  // Show message with auto-dismiss
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(null), 5000);
  }, []);

  // React to connection and state changes via hook's sseConnected and provided state
  useEffect(() => {
    if (sseConnected) {
      showMessage('Connected to real-time updates', 'success');
    }
  }, [sseConnected, showMessage]);

  useEffect(() => {
    // notify users on rating start/stop
    if (ratingActive) {
      showMessage('Rating is now active!', 'success');
    }
  }, [ratingActive, showMessage]);

  useEffect(() => {
    // Initial data load and round completion check
    loadData();
    checkRoundCompletion();

    // Poll scoreboard for updated final scores
    const pollScoreboard = async () => {
      try {
        const scoreboardRes = await fetch('/api/scoreboard');
        if (scoreboardRes.ok) {
          const scoreboardData = await scoreboardRes.json();
          setFinalScoreboard(scoreboardData.leaderboard || []);
        }
      } catch (error) {
        console.error("Error polling scoreboard:", error);
      }
    };

    const scoreboardInterval = setInterval(pollScoreboard, 5000); // Poll every 5 seconds

    // Poll ratings during active rating sessions to prevent hard-refresh issues
    const pollRatings = async () => {
      if (userTeamId && ratingCycleActive && currentPhase === 'rating-active') {
        try {
          const ratingsRes = await fetch(`/api/final/ratings?fromTeamId=${userTeamId}`);
          if (ratingsRes.ok) {
            const ratingsData = await ratingsRes.json();
            setMyRatings(ratingsData.ratings || []);
          }
        } catch (error) {
          console.error("Error polling ratings:", error);
        }
      }
    };

    const ratingsInterval = setInterval(pollRatings, 3000); // Poll every 3 seconds during rating

    return () => {
      clearInterval(scoreboardInterval);
      clearInterval(ratingsInterval);
    };
  }, [session, userTeamId, ratingCycleActive, currentPhase]);

  // Show qualification popup when qualification status is determined (only once per session)
  useEffect(() => {
    if (userTeamId && qualifiedTeams.length > 0 && !loading) {
      // Show a one-time modal that explains how final winners are declared
      const popupShownKey = `finals-winner-popup-shown-${userTeamId}`;
      const hasBeenShown = sessionStorage.getItem(popupShownKey) === 'true';

      if (!hasBeenShown) {
        setShowQualificationPopup(true);
        sessionStorage.setItem(popupShownKey, 'true');
      }
    }
  }, [userTeamId, qualifiedTeams.length, loading]);

  const checkRoundCompletion = async () => {
    try {
      setRoundsLoading(true);
      
      // Check if all teams have completed quiz and voting
      const [teamsRes, quizRes, votingRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/quiz/submissions'),
        fetch('/api/votes')
      ]);

      if (teamsRes.ok && quizRes.ok && votingRes.ok) {
        const teams = await teamsRes.json();
        const quizSubmissions = await quizRes.json();
        const votes = await votingRes.json();

        // Get all team IDs
        const allTeamIds = teams.map((team: any) => team.id);
        
        // Check quiz completion - all teams should have submissions
        const teamsWithQuizSubmissions = new Set(
          quizSubmissions.submissions?.map((sub: any) => sub.teamId) || []
        );
        const allTeamsCompletedQuiz = allTeamIds.every((teamId: number) => 
          teamsWithQuizSubmissions.has(teamId)
        );

        // Check voting completion - all teams should have voted
        const teamsWithVotes = new Set(
          votes.votes?.map((vote: any) => vote.fromTeamId) || []
        );
        const allTeamsCompletedVoting = allTeamIds.every((teamId: number) => 
          teamsWithVotes.has(teamId)
        );

        setQuizCompleted(allTeamsCompletedQuiz);
        setVotingCompleted(allTeamsCompletedVoting);
      } else {
        // Fallback to round status if submissions can't be checked
        const roundsRes = await fetch('/api/rounds');
        if (roundsRes.ok) {
          const rounds = await roundsRes.json();
          const quiz = rounds.find((r: any) => r.name === 'QUIZ');
          const voting = rounds.find((r: any) => r.name === 'VOTING');
          
          setQuizCompleted(quiz?.status === 'COMPLETED' || quiz?.isCompleted || false);
          setVotingCompleted(voting?.status === 'COMPLETED' || voting?.isCompleted || false);
        }
      }
    } catch (error) {
      console.error('Error checking round completion:', error);
      // Default to locked state on error
      setQuizCompleted(false);
      setVotingCompleted(false);
    } finally {
      setRoundsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load qualified teams first
      // Load final scoreboard with judge scores and peer ratings (authoritative for ranking)
      let scoreboardEntries: any[] = [];
      const scoreboardRes = await fetch('/api/scoreboard');
      if (scoreboardRes.ok) {
        const scoreboardData = await scoreboardRes.json();
        scoreboardEntries = scoreboardData.leaderboard || [];
        setFinalScoreboard(scoreboardEntries);
      }

      // Load teams
      const teamsRes = await fetch('/api/teams');
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData || []);

        // Compute qualification and ranking using the authoritative scoreboard entries
        try {
          const teamById = new Map<number, any>();
          (teamsData || []).forEach((t: any) => teamById.set(Number(t.id), t));

          // Build ranked list from scoreboardEntries; if scoreboardEntries missing, fall back to teamsData
          const ranked = (scoreboardEntries.length ? scoreboardEntries : []).map((row: any) => {
            const meta = teamById.get(Number(row.teamId)) || {};
            return {
              teamId: Number(row.teamId),
              teamName: meta.name || row.teamName || `Team #${row.teamId}`,
              college: meta.college || '',
              finalCumulativeScore: Number(row.finalCumulativeScore ?? row.combinedScore ?? 0),
              voting: row.voting || row.voteBreakdown || {},
            };
          });

          // Sort with explicit tiebreakers to match server intent:
          // 1) final cumulative score desc
          // 2) original yes votes (net) desc
          // 3) total votes including converted desc
          // 4) team name alphabetical asc
          ranked.sort((a: any, b: any) => {
            const scoreDiff = (b.finalCumulativeScore || 0) - (a.finalCumulativeScore || 0);
            if (scoreDiff !== 0) return scoreDiff;

            const aOriginalYes = Number(a.voting?.originalYesVotes ?? a.voting?.originalVotesNet ?? 0);
            const bOriginalYes = Number(b.voting?.originalYesVotes ?? b.voting?.originalVotesNet ?? 0);
            const yesDiff = bOriginalYes - aOriginalYes;
            if (yesDiff !== 0) return yesDiff;

            const aTotalVotes = Number(a.voting?.totalVotes ?? a.voting?.total ?? a.voting?.votes ?? 0);
            const bTotalVotes = Number(b.voting?.totalVotes ?? b.voting?.total ?? b.voting?.votes ?? 0);
            const totalVotesDiff = bTotalVotes - aTotalVotes;
            if (totalVotesDiff !== 0) return totalVotesDiff;

            const aName = (a.teamName || '').toString().toLowerCase();
            const bName = (b.teamName || '').toString().toLowerCase();
            return aName.localeCompare(bName);
          });

          const total = ranked.length || (teamsData || []).length;
          const qualified = ranked.map((r: any, idx: number) => ({
            teamId: r.teamId,
            teamName: r.teamName,
            college: r.college,
            rank: idx + 1,
            combinedScore: r.finalCumulativeScore,
            voting: r.voting,
          }));

          setQualifiedTeams(qualified);
          setNonQualifiedTeams([]);
          setQualificationNote({ message: `All ${total} teams are qualified for the finals.` });

          const userQualified = qualified.some((team: any) => team.teamId === userTeamId);
          setIsQualified(userQualified);
        } catch (e) {
          console.warn('Failed to compute local qualification, falling back to API if available', e);
        }
      }

  // Load my ratings if user has a team (don't wait for qualification check to avoid timing issues)
  if (userTeamId) {
    const ratingsRes = await fetch(`/api/final/ratings?fromTeamId=${userTeamId}`);
    if (ratingsRes.ok) {
      const ratingsData = await ratingsRes.json();
      setMyRatings(ratingsData.ratings || []);
    }
  }

    } catch (error) {
      console.error('Error loading data:', error);
      setMsg('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get final scores for qualified teams
  const getQualifiedTeamsWithFinalScores = () => {
    return qualifiedTeams.map(qualifiedTeam => {
      // Find the corresponding team in the scoreboard data
      const scoreboardTeam = finalScoreboard.find(team => team.teamId === qualifiedTeam.teamId);
      
      return {
        ...qualifiedTeam,
        finalScore: scoreboardTeam?.finalCumulativeScore || qualifiedTeam.combinedScore || 0,
        judgeScores: scoreboardTeam?.judgeScores || { total: 0, average: 0, count: 0 },
        peerRating: scoreboardTeam?.peerRating || { total: 0, count: 0 }
      };
    });
  };

  // Helper to fetch scoreboard entry for any team id
  const getScoreForTeam = (teamId?: number) => {
    if (!teamId) return null;
    return finalScoreboard.find(t => t.teamId === teamId) || null;
  };

  const submitRating = async () => {
    if (!userTeamId || !currentPitchTeam || rating < 3 || rating > 10) {
      showMessage("Please provide a rating between 3-10 for the current presenting team", 'error');
      return;
    }

    if (userTeamId === currentPitchTeam.id) {
      showMessage("Cannot rate your own team", 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/final/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ 
          fromTeamId: userTeamId, 
          toTeamId: currentPitchTeam.id, 
          rating 
        })
      });

      const data: RatingResponse = await res.json();
      
      if (res.ok && data.success) {
        showMessage(data.message || `Successfully rated ${currentPitchTeam.name} with ${rating}/10`, 'success');
        setRating(5); // Reset to default
        
        // Reload ratings with retry mechanism
        let retryCount = 0;
        const maxRetries = 3;
        
        const reloadRatings = async () => {
          try {
            const ratingsRes = await fetch(`/api/final/ratings?fromTeamId=${userTeamId}`);
            if (ratingsRes.ok) {
              const ratingsData = await ratingsRes.json();
              setMyRatings(ratingsData.ratings || []);
              return true;
            } else {
              throw new Error(`HTTP ${ratingsRes.status}`);
            }
          } catch (error) {
            console.error(`Failed to reload ratings (attempt ${retryCount + 1}):`, error);
            return false;
          }
        };
        
        // Try to reload ratings with exponential backoff
        const tryReload = async () => {
          const success = await reloadRatings();
          if (!success && retryCount < maxRetries) {
            retryCount++;
            setTimeout(tryReload, 1000 * Math.pow(2, retryCount)); // Exponential backoff
          } else if (!success) {
            showMessage("Rating submitted successfully, but your ratings list may not update immediately. Please refresh the page if needed.", 'info');
          }
        };
        
        tryReload();
      } else {
        console.error("API Error submitting rating:", data?.error || res.statusText);
        showMessage(data?.error || "Failed to submit rating", 'error');
      } 
    } catch (error: any) {
      console.error("Network or unexpected error submitting rating:", error);
      showMessage(`An unexpected error occurred: ${error.message || String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Don't block the entire UI while session/round checks are in progress.
  // We'll show a small non-blocking banner inside the page instead.
  
  // Only show sign-in prompt after session has finished loading.
  if (!isPending && !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md w-full rounded-lg border bg-white dark:bg-gray-800 p-6 sm:p-8 text-center shadow-lg">
          <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mb-4 text-sm sm:text-base text-muted-foreground">
            You need to be signed in with a team account or judge account to participate in the finals.
          </p>
          <div className="space-y-3">
            <a 
              href="/sign-in" 
              className="block w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm sm:text-base"
            >
              Sign In to Team
            </a>
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span>Are you a judge? </span>
              <a href="/judge/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Judge Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if previous rounds are completed (only for non-admin users)
  if (!isAdmin && (!quizCompleted || !votingCompleted)) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Round 3: Finals</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Finals round is currently locked
              </p>
            </div>
            <BackButton />
          </div>

          {/* Lock Message */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-2xl shrink-0">🔒</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Finals Round Locked</h2>
                <p className="text-sm sm:text-base text-yellow-700 dark:text-yellow-300 mb-4">
                  The finals round will be unlocked once all teams have completed both the Quiz and Voting rounds.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${quizCompleted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${quizCompleted ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      Quiz Round: {quizCompleted ? 'All teams completed ✓' : 'Waiting for all teams to complete ✗'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${votingCompleted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${votingCompleted ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      Voting Round: {votingCompleted ? 'All teams completed ✓' : 'Waiting for all teams to complete ✗'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button 
                    onClick={checkRoundCompletion}
                    className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Check Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableTeams = teams.filter(team => team.id !== userTeamId);
  const ratedTeamIds = new Set(myRatings.map(r => r.toTeamId));
  const unratedTeams = availableTeams.filter(team => !ratedTeamIds.has(team.id));

  // Rating permissions - both judges and teams can rate during rating-active phase
  const canRateAsPeer = session?.user && 
                        userTeamId && 
                        currentPitchTeam?.id && // Ensure currentPitchTeam and its id exist
                        userTeamId !== currentPitchTeam.id &&
                        ratingCycleActive && 
                        currentPhase === 'rating-active' && 
                        phaseTimeLeft > 0 &&
                        isQualified; // Only qualified teams can rate

  return (
    <PageLock roundType="FINAL" isCompleted={isFinalCompleted}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 transition-all duration-300 ease-in-out">
        {/* Small non-blocking loading banner */}
        {(isPending || roundsLoading) && (
          <div className="mb-4 p-2 sm:p-3 rounded-md text-xs sm:text-sm font-medium text-center bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300">
            Checking round status and loading data...
          </div>
        )}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <BackButton />
          <ThemeToggle />
        </div>
        
        {/* Round Header */}
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Round 3: Finals</h1>
          <div className="px-2">
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Ranking Criteria: Final cumulative score (judge total + peer total + remaining token score) • Original votes received (net) as first tiebreaker • Total votes (including converted votes) as final tiebreaker
            </p>
            <p className="text-xs text-muted-foreground mt-1">Generated at: 9/26/2025, 4:19:41 PM</p>
          </div>
        </div>
        
        {/* SSE Connection Status */}
        <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-md text-xs font-medium ${
          sseConnected 
            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
            : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
        }`}>
          {sseConnected ? '🟢 Real-time updates connected' : '🟡 Connecting to real-time updates...'}
        </div>

        {/* Rating Cycle Timer Display */}
        {ratingCycleActive && (
          <Card className="mb-4 sm:mb-6 border-purple-200 dark:border-purple-700">
            <CardContent className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-100 leading-tight">
                  {currentPhase === 'pitching' && '🎤 Team is Pitching (5 min)'}
                  {currentPhase === 'qna-pause' && '❓ Q&A Session (Admin Controlled)'}
                  {currentPhase === 'rating-warning' && '⚠️ Rating Starts Soon! (5 sec)'}
                  {currentPhase === 'rating-active' && '⭐ Rating Active - Judges & Teams (2 min)'}
                  {currentPhase === 'idle' && '⏸️ Rating Cycle Idle'}
                </h3>
                <div className="text-2xl sm:text-3xl font-bold text-purple-800 dark:text-purple-200 shrink-0">
                  {currentPhase === 'qna-pause' ? '∞' : 
                   `${Math.floor(phaseTimeLeft / 60)}:${(phaseTimeLeft % 60).toString().padStart(2, '0')}`}
                </div>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-3 sm:h-4 mb-2 overflow-hidden">
                <div 
                  className={`h-3 sm:h-4 rounded-full transition-all duration-1000 ease-linear ${
                    currentPhase === 'pitching' ? 'bg-blue-500 dark:bg-blue-600' :
                    currentPhase === 'qna-pause' ? 'bg-yellow-500 dark:bg-yellow-600' :
                    currentPhase === 'rating-warning' ? 'bg-red-500 dark:bg-red-600' :
                    currentPhase === 'rating-active' ? 'bg-green-500 dark:bg-green-600' :
                    'bg-gray-400 dark:bg-gray-500'
                  }`}
                  style={{ 
                    width: `${
                      currentPhase === 'pitching' ? Math.max(0, Math.min(100, ((PITCH_SEC - phaseTimeLeft) / PITCH_SEC) * 100)) :
                      currentPhase === 'qna-pause' ? 100 :
                      currentPhase === 'rating-warning' ? Math.max(0, Math.min(100, ((WARNING_SEC - phaseTimeLeft) / WARNING_SEC) * 100)) :
                      currentPhase === 'rating-active' ? Math.max(0, Math.min(100, ((RATING_SEC - phaseTimeLeft) / RATING_SEC) * 100)) :
                      0
                    }%`,
                    transition: 'width 1s linear'
                  }}
                ></div>
              </div>
              <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                {currentPhase === 'pitching' && 'Listen to the team presentation (5 minutes total)'}
                {currentPhase === 'qna-pause' && 'Q&A session in progress - Admin will start rating when ready'}
                {currentPhase === 'rating-warning' && '⚠️ Get ready! Rating will begin in 5 seconds!'}
                {currentPhase === 'rating-active' && 'Judges & Teams: Rate the team now! (2 minutes total)'}
                {currentPhase === 'idle' && 'Waiting for admin to start the next rating cycle'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Team Display */}
        {currentPitchTeam ? (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Currently Presenting</h3>
              <div className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300">
                {currentPitchTeam.name} (#{currentPitchTeam.id})
              </div>
              {/* Show live judge / peer summary for the presenting team */}
              {(() => {
                const presenting = getScoreForTeam(currentPitchTeam.id);
                const peerCount = presenting?.peerRating?.count ?? presenting?.peerRating?.ratingCount ?? 0;
                const peerTotal = presenting?.peerRating?.total ?? presenting?.peerRating?.totalPeerScore ?? 0;
                const judgeTotal = presenting?.judgeScores?.total ?? presenting?.judgeScores?.totalJudgeScore ?? 0;
                const judgeCount = presenting?.judgeScores?.count ?? presenting?.judgeScores?.judgeCount ?? 0;

                return (
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Peer: {peerTotal} ({peerCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span>Judge: {judgeTotal} ({judgeCount})</span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <p className="text-sm sm:text-base text-muted-foreground">No team is currently presenting.</p>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 sm:mb-6 bg-muted p-1 rounded-lg w-fit mx-auto sm:mx-0">
          <button 
            onClick={() => setActiveTab('status')}
            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors min-w-0 ${
              activeTab === 'status' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            Status Overview
          </button>
          {(userTeamId && isQualified) && (
            <button 
              onClick={() => setActiveTab('rate')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors min-w-0 ${
                activeTab === 'rate' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              Rate Teams
            </button>
          )}
        </div>

        {/* Status Overview Tab */}
        {activeTab === 'status' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Qualified Teams */}
            {qualifiedTeams.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">🏆 Qualified Teams</h2>

                  {/* Qualification Tiebreaker Note */}
                  {qualificationNote && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 dark:text-blue-400 text-sm shrink-0">⚖️</div>
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Automatic Tiebreaker Applied</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">{qualificationNote.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {getQualifiedTeamsWithFinalScores().map((team, index) => (
                      <div key={team.teamId} className="p-3 rounded-lg bg-muted dark:bg-muted/50">
                        <div className="text-sm text-muted-foreground">#{team.rank}</div>
                        <div className="mt-1 font-semibold text-lg">{team.teamName}</div>
                        <div className="text-xs text-muted-foreground mt-1">{team.college}</div>

                        <div className="mt-3 text-2xl font-bold">{(team.finalScore || 0).toFixed(1)} pts</div>
                        <div className="text-xs text-muted-foreground">Final Score</div>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Peer: {team.peerRating?.total ?? team.peerRating?.totalPeerScore ?? 0} ({team.peerRating?.count ?? 0})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span>Judge: {team.judgeScores?.total ?? team.judgeScores?.totalJudgeScore ?? 0} ({team.judgeScores?.count ?? 0})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Non-Qualified Teams (Spectators) */}
            {nonQualifiedTeams.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">📺 Spectator Teams</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    These teams didn't qualify for the final round but can watch the presentations.
                  </p>
                  <div className="grid gap-2">
                    {nonQualifiedTeams.map((team) => (
                      <div key={team.teamId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 dark:bg-muted/30 gap-2 sm:gap-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                            #{team.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{team.teamName}</p>
                            <p className="text-xs text-muted-foreground truncate">{team.college}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 w-full sm:w-auto">
                          <p className="text-sm font-medium">{team.combinedScore} pts</p>
                          <p className="text-xs text-muted-foreground">Qualification Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Team Status */}
            {userTeamId && isQualified && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Team Status</h2>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Peer Ratings Submitted:</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {myRatings.length} rating{myRatings.length !== 1 ? 's' : ''} submitted
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unratedTeams.length} team{unratedTeams.length !== 1 ? 's' : ''} available to rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Ratings */}
            {userTeamId && myRatings.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Submitted Ratings</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {myRatings.map((rating) => {
                      const ratedTeam = teams.find(t => t.id === rating.toTeamId);
                      return (
                        <div key={rating.id} className="rounded-lg border bg-muted dark:bg-muted/50 p-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-sm sm:text-base truncate">{ratedTeam?.name || `Team #${rating.toTeamId}`}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{ratedTeam?.college}</p>
                            </div>
                            <div className="text-right shrink-0 w-full sm:w-auto">
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{rating.rating}/10</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Rate Teams Tab */}
        {activeTab === 'rate' && userTeamId && (
          <div className="space-y-4 sm:space-y-6">
            {/* Rating Form */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Submit Peer Rating (3-10)</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Rate the currently presenting team on a scale of 3-10. You can only rate during the peers rating phase.
                </p>

                {/* Current presenting team info */}
                {currentPitchTeam && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border">
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      <strong>Currently Presenting:</strong> {currentPitchTeam.name} (#{currentPitchTeam.id})
                    </p>
                  </div>
                )}

                {/* Rating restrictions info */}
                {!canRateAsPeer && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-700">
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      {!ratingCycleActive && 'Waiting for rating cycle to start...'}
                      {ratingCycleActive && currentPhase === 'pitching' && 'Wait for rating phase to begin...'}
                      {ratingCycleActive && currentPhase === 'qna-pause' && 'Q&A in progress - Rating will start soon...'}
                      {ratingCycleActive && currentPhase === 'rating-warning' && 'Get ready! Rating starts in seconds...'}
                      {ratingCycleActive && currentPhase === 'rating-active' && phaseTimeLeft <= 0 && 'Rating time has ended.'}
                      {!isQualified && 'Only qualified teams can rate in the finals.'}
                      {userTeamId === currentPitchTeam?.id && 'You cannot rate your own team.'}
                      {!currentPitchTeam && 'No team is currently presenting.'}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Your Rating: {rating}/10
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>3 (Poor)</span>
                    <span>6</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>

                <Button 
                  onClick={submitRating} 
                  variant="secondary" 
                  size={isMobile ? "sm" : "default"} 
                  disabled={!canRateAsPeer || loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Submitting..." : `Submit Peer Rating (${rating}/10)`}
                </Button>
              </CardContent>
            </Card>

            {/* Rating Progress */}
            {availableTeams.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">Rating Progress</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Teams Rated:</span>
                      <span>{myRatings.length} / {availableTeams.length}</span>
                    </div>
                    <div className="w-full bg-muted dark:bg-muted/50 rounded-full h-2 sm:h-3">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(myRatings.length / availableTeams.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Message Display */}
        {msg && (
          <div className={`mb-4 sm:mb-6 rounded-md border px-3 sm:px-4 py-3 text-center font-medium flex items-center justify-center gap-2 text-sm ${
            msgType === 'success'
              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
              : msgType === 'error'
              ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
              : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300"
          }`}>
            {msgType === 'success' && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
            {msgType === 'error' && <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
            <span className="break-words">{msg}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            onClick={async () => {
              try {
                setLoading(true);
                // Let the rating hook refresh timer state first, then reload page data silently
                await poll();
                await loadData();
              } catch (e) {
                console.warn('Silent refresh failed', e);
              } finally {
                setLoading(false);
              }
            }}
            variant="secondary"
            size={isMobile ? "sm" : "default"}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <a href="/scoreboard" className="w-full sm:w-auto">
            <Button variant="default" size={isMobile ? "sm" : "default"} className="w-full">
              View Scoreboard
            </Button>
          </a>
        </div>

        {/* Qualification Status Popup */}
        {showQualificationPopup && userTeamId && qualifiedTeams.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl mx-4">
              <div className="text-center">
                <div className="text-4xl sm:text-6xl mb-4">
                  {isQualified ? '🎉' : '👀'}
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold mb-3 text-green-600 dark:text-green-400`}>
                  🏆 Finals — All Teams Qualified
                </h2>
                <p className={`text-base sm:text-lg mb-4 text-green-700 dark:text-green-300`}>
                  All teams are qualified for the finals. Please participate and rate other teams during the rating phases.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 px-2">
                  Ranking Criteria: Final cumulative score (judge total + peer total + remaining token score) • Original votes received (net) as first tiebreaker • Total votes (including converted votes) as final tiebreaker
                </p>
                <p className="text-xs text-muted-foreground mb-6 px-2">Generated at: 9/26/2025, 4:19:41 PM</p>
                <button
                  onClick={() => setShowQualificationPopup(false)}
                  className={`w-full px-4 py-2 sm:py-3 rounded-md font-medium text-white transition-colors text-sm sm:text-base ${
                    isQualified 
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' 
                      : 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
                  }`}
                >
                  Continue to Finals
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLock>
  );
}