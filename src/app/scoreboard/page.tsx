"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useVotingTimer } from '@/hooks/useVotingTimer';
import { useRatingTimer } from '@/hooks/useRatingTimer';
import { useIsMobile } from "@/hooks/use-mobile";
import { Trophy, Medal, Award, RefreshCw, Eye, EyeOff, ArrowLeft, Home, BarChart3, Users, Target, Zap, Crown, Star } from "lucide-react";

interface LeaderboardTeam {
  rank: number;
  teamId: number;
  teamName: string;
  college: string;
  tokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
    total: number;
  };
  tokenActivity: {
    earned: number;
    spent: number;
    remaining: number;
  };
  voting: {
  // originalYesVotes: count of original audience 'Yes' votes (used as tiebreaker)
  originalYesVotes?: number;
  // breakdown for transparency
    originalNoVotes?: number;
    votesFromTokens?: number;
    totalVotes: number;
  };
  peerRating: {
    total: number;
    count: number;
  };
  judgeScores: {
    total: number;
    average: number;
    count: number;
  };
  finalCumulativeScore: number;
  hasQuizSubmission: boolean;
  originalQuizScore?: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardTeam[];
  winnerNotes?: Array<{
    position: number;
    type: string;
    message: string;
    tiedScore: number;
    tiedTeams: Array<{ name: string; rank: number }>;
  }>;
  metadata: {
    totalTeams: number;
    generatedAt: string;
    focus: string;
    rankingCriteria: string[];
    participation: {
      quizSubmissions: number;
      votingParticipation: number;
      peerRatings: number;
      tokenSpending: number;
    };
    explanation: Record<string, string>;
  };
}

export default function ScoreboardPage() {
  const isMobile = useIsMobile();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScoreboard = async () => {
    try {
      setError(null);
      setRefreshing(true);
      const res = await fetch("/api/scoreboard", {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || "Failed to load scoreboard");
      }
      
      setData(json);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error('Scoreboard fetch error:', e);
      setError(e?.message || "Failed to load scoreboard");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchScoreboard();
      setLoading(false);
    };
    load();
  }, []);

  // Keep timer state fresh before manual scoreboard refreshes
  const { poll: pollVotingStatus } = useVotingTimer();
  const { poll: pollRatingStatus } = useRatingTimer();

  const refreshScoreboard = async () => {
    try {
      setRefreshing(true);
      await Promise.all([pollVotingStatus(), pollRatingStatus()]);
      await fetchScoreboard();
    } catch (e) {
      console.error('Failed to refresh scoreboard:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchScoreboard();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/25";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-500/25";
      case 3: return "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/25";
      default: return "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/20";
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (percentage >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Loading Scoreboard
            </h2>
            <p className="text-muted-foreground">Fetching the latest rankings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-red-500/20 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Scoreboard</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => refreshScoreboard()}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
              >
                Retry
              </Button>
              <Link
                href="/"
                className="px-6 py-3 bg-card/50 backdrop-blur-sm border border-border font-semibold rounded-xl hover:bg-accent/10 transition-all duration-300 hover:-translate-y-1"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.leaderboard || data.leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              No Teams Found
            </h2>
            <p className="text-muted-foreground mb-6">The scoreboard will appear here once teams start participating.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const topTeams = data.leaderboard.slice(0, 3);
  const remainingTeams = data.leaderboard.slice(3);
  const maxFinalScore = data.leaderboard[0]?.finalCumulativeScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  SCOREBOARD
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">Live Rankings</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-primary">Live • {data.metadata.totalTeams} Teams Competing</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                LIVE RANKINGS
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Real-time competition scoreboard
            </p>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <button
                onClick={refreshScoreboard}
                disabled={refreshing}
                className="group relative px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 inline ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-6 py-3 bg-card/50 backdrop-blur-sm border border-border font-semibold rounded-xl hover:bg-accent/10 transition-all duration-300 hover:-translate-y-1"
              >
                {showDetails ? <EyeOff className="w-4 h-4 mr-2 inline" /> : <Eye className="w-4 h-4 mr-2 inline" />}
                {showDetails ? 'Hide' : 'Show'} Details
              </button>

              <label className="flex items-center gap-2 px-4 py-3 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:bg-accent/10 transition-all duration-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Auto-refresh</span>
              </label>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>

          {/* Winner Tiebreaker Notes */}
          {data.winnerNotes && data.winnerNotes.length > 0 && (
            <div className="mb-12 space-y-4">
              {data.winnerNotes.map((note, index) => (
                <div key={index} className="p-6 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Automatic Tiebreaker Applied</h4>
                      <p className="text-blue-700 dark:text-blue-300">{note.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top 3 Podium */}
          {topTeams.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-20 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Championship Podium
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {topTeams.map((team, index) => (
                  <div
                    key={team.teamId}
                    className={`relative group ${
                      team.rank === 1 
                        ? 'md:order-2 md:scale-110 md:-translate-y-8' 
                        : team.rank === 2 
                        ? 'md:order-1 md:-translate-y-4' 
                        : 'md:order-3'
                    }`}
                  >
                    <div className={`p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl ${
                      team.rank === 1
                        ? 'bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-500/30 hover:shadow-yellow-500/20'
                        : team.rank === 2
                        ? 'bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-950/30 dark:to-gray-900/30 border-gray-400/30 hover:shadow-gray-400/20'
                        : 'bg-gradient-to-br from-amber-50/80 to-amber-100/80 dark:from-amber-950/30 dark:to-amber-900/30 border-amber-600/30 hover:shadow-amber-600/20'
                    }`}>
                      {/* Rank Badge */}
                      <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${getRankBadgeStyle(team.rank)}`}>
                        {getRankIcon(team.rank)}
                      </div>

                      <div className="text-center">
                        <h3 className="font-bold text-xl mb-2">{team.teamName}</h3>
                        <p className="text-muted-foreground mb-6 text-sm">{team.college}</p>
                        
                        <div className={`text-4xl font-black mb-4 ${getScoreColor(team.finalCumulativeScore, maxFinalScore)}`}>
                          {team.finalCumulativeScore.toFixed(1)}
                        </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="font-medium text-primary">Quiz Tokens</div>
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-500">Original:</span>
                                <span className="font-bold">{team.tokenActivity?.earned ?? (team.tokens?.total ?? 0)}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-green-500">Remaining:</span>
                                <span className="font-bold">{team.tokenActivity?.remaining ?? team.tokens?.total ?? 0}</span>
                              </div>
                            </div>
                          </div>
                                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="font-medium text-primary">Peer (total)</div>
                                    <div className="text-lg font-bold">{team.peerRating?.total ?? 0}</div>
                                  </div>
                          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="font-medium text-primary">Votes</div>
                            <div className="text-lg font-bold">{team.voting?.originalYesVotes ?? team.voting?.totalVotes ?? 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Yes: {team.voting?.originalYesVotes ?? 0} • No: {team.voting?.originalNoVotes ?? 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Converted: {team.voting?.votesFromTokens ?? 0}
                            </div>
                          </div>
                          <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                            <div className="font-medium text-accent">Judge</div>
                            <div className="text-lg font-bold">{team.judgeScores?.total || 0}</div>
                          </div>
                        </div>

                        {!team.hasQuizSubmission && (
                          <div className="mt-4 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-600 dark:text-orange-400">
                            No Quiz Submission
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Rankings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Complete Rankings
            </h2>

            {isMobile ? (
              /* Mobile Card Layout */
              <div className="space-y-4">
                {data.leaderboard.map((team: LeaderboardTeam, index: number) => (
                  <div
                    key={team.teamId}
                    className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10"
                  >
                    {/* Team Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-transform group-hover:scale-110 ${getRankBadgeStyle(team.rank)}`}>
                          {team.rank <= 3 ? getRankIcon(team.rank) : team.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg">{team.teamName}</h3>
                          <p className="text-muted-foreground text-sm">{team.college}</p>
                          {!team.hasQuizSubmission && (
                            <span className="inline-block mt-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-600 dark:text-orange-400">
                              No Quiz
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(team.finalCumulativeScore, maxFinalScore)}`}>
                          {team.finalCumulativeScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Final Score</div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-2">Quiz Tokens</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-500">Original Tokens:</span>
                            <span className="font-medium">{team.tokenActivity?.earned ?? (team.tokens?.total ?? 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-500">Remaining Tokens:</span>
                            <span className="font-medium">{team.tokenActivity?.remaining ?? team.tokens?.total ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <div className="text-xs text-muted-foreground mb-2">Performance</div>
                        <div className="space-y-2 text-sm">
                          {showDetails && (
                            <div className="flex justify-between">
                              <span>Votes (total):</span>
                              <span className="font-medium">{team.voting.totalVotes}</span>
                            </div>
                          )}
                          {showDetails && (
                            <div className="text-xs text-muted-foreground">
                              Yes: {team.voting.originalYesVotes ?? 0} | No: {team.voting.originalNoVotes ?? 0} | Converted: {team.voting.votesFromTokens ?? 0}
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Peer Rating (total):</span>
                            <span className="font-medium">{team.peerRating?.total ?? 0}</span>
                          </div>
                          {showDetails && team.peerRating?.count && (
                            <div className="text-xs text-muted-foreground">
                              ({team.peerRating.count} ratings)
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Judge Score:</span>
                            <span className="font-medium">{team.judgeScores?.total || 0}</span>
                          </div>
                          {showDetails && team.judgeScores?.count && (
                            <div className="text-xs text-muted-foreground">
                              ({team.judgeScores.count} judges)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table Layout */
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-primary/10 to-accent/10">
                      <tr>
                        <th className="text-left p-6 font-bold text-primary">Rank</th>
                        <th className="text-left p-6 font-bold text-primary">Team</th>
                        <th className="text-left p-6 font-bold text-primary">College</th>
                        <th className="text-center p-6 font-bold text-primary">Original Quiz Tokens</th>
                        <th className="text-center p-6 font-bold text-primary">Remaining Quiz Tokens</th>
                        <th className="text-center p-6 font-bold text-primary">Peer (total)</th>
                        <th className="text-center p-6 font-bold text-primary">Votes</th>
                        <th className="text-center p-6 font-bold text-primary">Judge (total)</th>
                        <th className="text-center p-6 font-bold text-primary">Final Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.map((team: LeaderboardTeam, index: number) => (
                        <tr key={team.teamId} className={`border-t border-border/30 hover:bg-accent/5 transition-colors ${index < 3 ? 'bg-primary/5' : ''}`}>
                          <td className="p-6">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold transition-transform hover:scale-110 ${getRankBadgeStyle(team.rank)}`}>
                              {team.rank <= 3 ? getRankIcon(team.rank) : team.rank}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="font-semibold">{team.teamName}</div>
                            {!team.hasQuizSubmission && (
                              <span className="inline-block mt-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-600 dark:text-orange-400">
                                No Quiz
                              </span>
                            )}
                          </td>
                          <td className="p-6 text-muted-foreground">{team.college}</td>
                          <td className="p-6 text-center">
                            <div className="font-semibold text-blue-500 text-lg">
                              {team.tokenActivity?.earned ?? (team.tokens?.total ?? 0)}
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <div className="font-semibold text-green-500 text-lg">
                              {team.tokenActivity?.remaining ?? team.tokens?.total ?? 0}
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <div className="font-semibold text-lg">{team.peerRating?.total ?? 0}</div>
                            {showDetails && team.peerRating?.count && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ({team.peerRating.count} ratings)
                              </div>
                            )}
                          </td>
                          <td className="p-6 text-center">
                            <div className="font-semibold text-lg">{team.voting.totalVotes ?? 0}</div>
                            {showDetails && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Yes: {team.voting.originalYesVotes ?? 0} • No: {team.voting.originalNoVotes ?? 0} • Converted: {team.voting.votesFromTokens ?? 0}
                              </div>
                            )}
                          </td>
                          <td className="p-6 text-center">
                            <div className="font-semibold text-lg">{team.judgeScores?.total || 0}</div>
                            {showDetails && team.judgeScores?.count && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ({team.judgeScores.count} judges)
                              </div>
                            )}
                          </td>
                          <td className="p-6 text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(team.finalCumulativeScore, maxFinalScore)}`}>
                              {team.finalCumulativeScore.toFixed(1)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          {showDetails && data.metadata && (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-12">
              <div className="group p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Scoring System</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="font-medium">Quiz Tokens</span>
                    <span className="text-muted-foreground">Original Quiz Tokens & Remaining Tokens after conversions</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg border border-accent/10">
                    <span className="font-medium">Judge Scores</span>
                    <span className="text-muted-foreground">Total judge evaluation</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="font-medium">Final Score</span>
                    <span className="text-muted-foreground">Final = Judge total + Peer total + Remaining quiz tokens (votes excluded from score)</span>
                  </div>
                </div>
              </div>

              <div className="group p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-accent/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-accent">Participation Stats</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg border border-accent/10">
                    <span className="font-medium">Quiz Submissions</span>
                    <span className="font-bold text-accent">{data.metadata.participation.quizSubmissions}/{data.metadata.totalTeams}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="font-medium">Voting Participation</span>
                    <span className="font-bold text-primary">{data.metadata.participation.votingParticipation}/{data.metadata.totalTeams}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg border border-accent/10">
                    <span className="font-medium">Peer Ratings</span>
                    <span className="font-bold text-accent">{data.metadata.participation.peerRatings}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="font-medium">Token Activity</span>
                    <span className="font-bold text-primary">{data.metadata.participation.tokenSpending}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Information */}
          <div className="text-center space-y-6">
            <div className="p-6 bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl">
                <p className="text-muted-foreground mb-2">
                <span className="font-medium">Ranking Criteria:</span> Final cumulative score (judge total + peer total + remaining token score) • Original votes received (net) as first tiebreaker • Total votes (including converted votes) as final tiebreaker
              </p>
              <p className="text-xs text-muted-foreground">
                Generated at: {new Date(data.metadata.generatedAt).toLocaleString()}
              </p>
            </div>

            {/* Navigation Links */}
            <div className="flex justify-center gap-4">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 font-semibold rounded-xl hover:from-primary/30 hover:to-accent/30 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              >
                <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent/20 to-primary/20 backdrop-blur-sm border border-accent/30 font-semibold rounded-xl hover:from-accent/30 hover:to-primary/30 hover:border-accent/50 transition-all duration-300 hover:-translate-y-1"
              >
                Dashboard
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}