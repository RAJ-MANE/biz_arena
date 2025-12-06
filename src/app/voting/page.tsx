"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Timer, Users, Trophy, AlertCircle, CheckCircle2, ArrowLeft, Zap, Vote, Clock, Play, Pause, Target, Coins, TrendingUp, BarChart3, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import VotingLayout from '@/components/ui/VotingLayout';
import PageLock from "@/components/ui/PageLock";
import { Button } from "@/components/ui/button";
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useVotingTimer } from '@/hooks/useVotingTimer';
import { useVotingSSE } from '@/hooks/useVotingSSE';
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  teamId?: number | null;
}

interface Team {
  id: number;
  name: string;
  college?: string;
}

interface CurrentPitchData {
  team: Team | null;
  votingActive: boolean;
  allPitchesCompleted: boolean;
  pitchCycleActive?: boolean;
  currentPhase?: 'idle' | 'pitching' | 'preparing' | 'voting';
  phaseTimeLeft?: number;
  cycleStartTime?: number | null;
}

interface VoteResponse {
  success?: boolean;
  error?: string;
  message?: string;
  vote?: any;
  conversion?: any;
}

interface TokenStatus {
  teamId: number;
  availableTokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
  };
  canConvert: boolean;
  totalVotesGained: number;
  maxPossibleConversions: number;
  hasQuizSubmission: boolean;
}

interface VotingStatus {
  fromTeamId: number;
  votescast: any[];
  downvoteCount: number;
  remainingDownvotes: number;
  votedTeams: number[];
}

export default function VotingPage() {
  const isMobile = useIsMobile();
  
  // Page lock functionality
  const { isCompleted: isVotingCompleted, loading: roundLoading } = useRoundStatus('VOTING');
  
  // Timer + SSE handled by useVotingTimer
  const { currentPitchTeam, votingActive: votingActiveFromHook, allPitchesCompleted: allPitchesFromHook, pitchCycleActive: pitchCycleActiveFromHook, currentPhase: phaseFromHook, phaseTimeLeft: phaseTimeLeftFromHook, cycleStartTime: cycleStartTimeFromHook, sseConnected } = useVotingTimer();

  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [currentPitchTeamLocal, setCurrentPitchTeam] = useState<Team | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [votingRoundCompleted, setVotingRoundCompleted] = useState(false);
  const [voteValue, setVoteValue] = useState<1 | -1>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isConvertingTokens, setIsConvertingTokens] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [currentTeamVotes, setCurrentTeamVotes] = useState<{ upvotes: number; downvotes: number; totalVotes: number } | null>(null);
  const [conversionQuantity, setConversionQuantity] = useState(1);
  
  // Auto-timeout functionality
  const [votingTimeLeft, setVotingTimeLeft] = useState<number | null>(null);
  const [votingStartTime, setVotingStartTime] = useState<number | null>(null);
  
  // Pitch cycle state
  const [pitchCycleActive, setPitchCycleActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'preparing' | 'voting'>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);

  useEffect(() => {
    setIsPending(true);
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      setUser(null);
    }
    setIsPending(false);
  }, []);

  // Fetch user's team when user is loaded
  useEffect(() => {
    if (user?.teamId) {
      fetchUserTeam(user.teamId);
    } else {
      setUserTeam(null);
    }
  }, [user]);

  // Show message with auto-dismiss
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const fetchUserTeam = async (teamId: number) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.ok) {
        const team = await response.json();
        setUserTeam(team);
      } else {
        console.error('Failed to fetch user team');
        setUserTeam(null);
      }
    } catch (error) {
      console.error('Error fetching user team:', error);
      setUserTeam(null);
    }
  };

  const userTeamId = userTeam?.id;

  // Sync local UI states with hook outputs (debounced to avoid jitter)
  useEffect(() => {
    setCurrentPitchTeam(currentPitchTeam || null);
  }, [currentPitchTeam]);

  // Listen to voting SSE for real-time updates and refresh counts when events arrive
  const { lastEvent: votingLastEvent, isConnected: votingSseConnected } = useVotingSSE();

  const fetchTeamVotes = useCallback(async (teamId?: number | null) => {
    if (!teamId) {
      setCurrentTeamVotes(null);
      return;
    }

    try {
      const res = await fetch(`/api/votes?teamId=${teamId}`);
      if (!res.ok) {
        console.warn(`Failed to fetch votes for team ${teamId}: ${res.status}`);
        return;
      }
      const data = await res.json();
      setCurrentTeamVotes({ upvotes: data.upvotes || 0, downvotes: data.downvotes || 0, totalVotes: data.totalVotes || 0 });
    } catch (err) {
      console.warn('Error fetching team votes:', err);
    }
  }, []);

  // Refresh when the currently pitching team object changes
  useEffect(() => {
    if (currentPitchTeam && currentPitchTeam.id) {
      fetchTeamVotes(currentPitchTeam.id);
    } else {
      setCurrentTeamVotes(null);
    }
  }, [currentPitchTeam, fetchTeamVotes]);

  // Refresh when SSE indicates a state change (coarse-grained)
  useEffect(() => {
    if (!votingLastEvent) return;
    // Ignore simple connected/heartbeat events
    if (votingLastEvent.type === 'connected' || votingLastEvent.type === 'heartbeat') return;
    if (currentPitchTeam && currentPitchTeam.id) {
      fetchTeamVotes(currentPitchTeam.id);
    }
  }, [votingLastEvent, currentPitchTeam, fetchTeamVotes]);

  useEffect(() => {
    setVotingActive(!!votingActiveFromHook);
  }, [votingActiveFromHook]);

  useEffect(() => {
    setAllPitchesCompleted(!!allPitchesFromHook);
  }, [allPitchesFromHook]);

  // keep pitchCycleActive/phaseTimeLeft/local currentPhase in sync with hook
  useEffect(() => {
    setPitchCycleActive(!!pitchCycleActiveFromHook);
    setCurrentPhase(phaseFromHook as any);
    setPhaseTimeLeft(phaseTimeLeftFromHook ?? 0);
    setCycleStartTime(cycleStartTimeFromHook ?? null);
  }, [pitchCycleActiveFromHook, phaseFromHook, phaseTimeLeftFromHook, cycleStartTimeFromHook]);

  // Load teams data
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (!res.ok) {
          console.warn(`Failed to load teams: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading teams:", error);
      }
    };

    loadTeams();
  }, []);

  // Load token status for user's team
  useEffect(() => {
    const loadTokenStatus = async () => {
      if (!userTeamId) return;
      
      try {
        const res = await fetch(`/api/tokens/convert?teamId=${userTeamId}`);
        if (!res.ok) {
          console.warn(`Failed to load token status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data: TokenStatus = await res.json();
        setTokenStatus(data);
        
        // Reset conversion quantity if it exceeds new maximum
        if (data.maxPossibleConversions < conversionQuantity) {
          setConversionQuantity(Math.max(1, data.maxPossibleConversions));
        }
      } catch (error) {
        console.error("Error loading token status:", error);
      }
    };

    loadTokenStatus();
  }, [userTeamId, conversionQuantity]);

  // Load voting status for user's team
  useEffect(() => {
    const loadVotingStatus = async () => {
      if (!userTeamId) return;
      
      try {
        const res = await fetch(`/api/votes?fromTeamId=${userTeamId}`);
        if (!res.ok) {
          console.warn(`Failed to load voting status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data: VotingStatus = await res.json();
        // Ensure all required fields are present with defaults
        const safeData: VotingStatus = {
          fromTeamId: data.fromTeamId || userTeamId,
          votescast: data.votescast || [],
          downvoteCount: data.downvoteCount || 0,
          remainingDownvotes: data.remainingDownvotes ?? 3,
          votedTeams: data.votedTeams || [],
        };
        setVotingStatus(safeData);
      } catch (error) {
        console.error("Error loading voting status:", error);
      }
    };

    loadVotingStatus();
  }, [userTeamId]);

  // Poll current pitch status
  // polling handled inside useVotingTimer; just ensure voting round completion state
  useEffect(() => {
    const checkRounds = async () => {
      try {
        const roundsRes = await fetch('/api/rounds');
        if (roundsRes.ok) {
          const rounds = await roundsRes.json();
          if (Array.isArray(rounds)) {
            const votingRound = rounds.find((r: any) => r.type === 'VOTING');
            setVotingRoundCompleted(votingRound?.isCompleted || false);
          }
        }
      } catch (e) {
        console.warn('Failed to check rounds status', e);
      }
    };

    checkRounds();
  }, []);

  // hook provides phaseTimeLeft and other data; no manual timers needed here

  // Cast vote function
  const castVote = async () => {
    if (!userTeamId || !currentPitchTeam?.id) {
      if (!userTeamId) {
        showMessage("You are not assigned to a team. Please contact an administrator.", 'error');
      } else {
        showMessage("No team is currently pitching", 'error');
      }
      return;
    }

    // Prevent voting for own team
    if (userTeamId === currentPitchTeam.id) {
      showMessage("You cannot vote for your own team", 'error');
      return;
    }

    // Check if already voted for this team
    if (votingStatus?.votedTeams?.includes(currentPitchTeam.id)) {
      showMessage("You have already voted for this team", 'error');
      return;
    }

    // Check downvote limit
    if (voteValue === -1 && votingStatus && votingStatus.remainingDownvotes <= 0) {
      showMessage("You have reached the maximum of 3 downvotes", 'error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: 'include', // Important for cookie authentication
        body: JSON.stringify({ 
          fromTeamId: userTeamId, 
          toTeamId: currentPitchTeam.id, 
          value: voteValue 
        })
      });

      const data: VoteResponse = await res.json();
      
      // Debug logging
      console.log('Vote response:', {
        status: res.status,
        ok: res.ok,
        data: data
      });

      if (res.ok && data.success) {
        showMessage(data.message || `Vote recorded successfully (${voteValue === 1 ? 'Yes' : 'No'})`, 'success');
        
        // Refresh voting status
        if (userTeamId) {
          const statusRes = await fetch(`/api/votes?fromTeamId=${userTeamId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            // Ensure all required fields are present with defaults
            const safeStatusData: VotingStatus = {
              fromTeamId: statusData.fromTeamId || userTeamId,
              votescast: statusData.votescast || [],
              downvoteCount: statusData.downvoteCount || 0,
              remainingDownvotes: statusData.remainingDownvotes ?? 3,
              votedTeams: statusData.votedTeams || [],
            };
            setVotingStatus(safeStatusData);
          }
        }
        // Refresh the displayed counts for the currently pitching team
        if (currentPitchTeam && currentPitchTeam.id) {
          fetchTeamVotes(currentPitchTeam.id);
        }
      } else {
        showMessage(data?.error || "Failed to cast vote", 'error');
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      showMessage("Network error while casting vote", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert tokens function
  const convertToken = async () => {
    if (!userTeamId) {
      showMessage("No team detected", 'error');
      return;
    }

    if (!tokenStatus?.canConvert) {
      if (!tokenStatus?.hasQuizSubmission) {
        showMessage("Complete the quiz first to earn tokens", 'error');
      } else {
        showMessage("Insufficient tokens: need at least 1 in each category", 'error');
      }
      return;
    }

    if (conversionQuantity > (tokenStatus?.maxPossibleConversions || 0)) {
      showMessage(`Cannot convert ${conversionQuantity} tokens. Maximum possible: ${tokenStatus?.maxPossibleConversions || 0}`, 'error');
      return;
    }

    setIsConvertingTokens(true);

    try {
      const res = await fetch("/api/tokens/convert", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: 'include', // Important for cookie authentication
        body: JSON.stringify({ teamId: userTeamId, quantity: conversionQuantity })
      });

      const data: VoteResponse = await res.json();

      if (res.ok && data.success) {
        showMessage(data.message || "Successfully converted tokens to votes", 'success');
        
        // Refresh token status
        const tokenRes = await fetch(`/api/tokens/convert?teamId=${userTeamId}`);
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          setTokenStatus(tokenData);
        }
      } else {
        showMessage(data?.error || "Failed to convert tokens", 'error');
      }
    } catch (error) {
      console.error("Error converting tokens:", error);
      showMessage("Network error while converting tokens", 'error');
    } finally {
      setIsConvertingTokens(false);
    }
  };

  // Show loading state while session is loading
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Loading Voting Portal
            </h2>
            <p className="text-muted-foreground">Checking authentication status...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-red-500/20 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Vote className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in with a team account to participate in voting.
            </p>
            <div className="space-y-3">
              <Link
                href="/sign-in" 
                className="block w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
              >
                Sign In to Team
              </Link>
              <div className="text-sm text-muted-foreground">
                <span>Are you a judge? </span>
                <Link href="/judge/login" className="text-primary hover:underline">
                  Judge Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle judge users who might not have teams
  const isJudgeUser = user && !user.teamId && user.name.toLowerCase().includes('judge');
  
  if (isJudgeUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-purple-500/20 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-purple-500 mb-4">Judge Account Detected</h2>
            <p className="text-muted-foreground mb-6">
              Judge accounts cannot participate in team voting. Please use the judge console for scoring.
            </p>
            <div className="space-y-3">
              <Link
                href="/judge" 
                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1"
              >
                Go to Judge Console
              </Link>
              <Link
                href="/dashboard" 
                className="block w-full px-6 py-3 bg-card/50 backdrop-blur-sm border border-border font-semibold rounded-xl hover:bg-accent/10 transition-all duration-300 hover:-translate-y-1"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canVoteForCurrentTeam = currentPitchTeam && 
                               userTeamId !== currentPitchTeam.id &&
                               !votingStatus?.votedTeams?.includes(currentPitchTeam.id) &&
                               (() => {
                                 // In pitch cycle mode, check if we're in voting phase with time left
                                 if (pitchCycleActive) {
                                   return currentPhase === 'voting' && phaseTimeLeft > 0;
                                 }
                                 // In legacy mode, check if voting is active with time left
                                 return votingActive && (votingTimeLeft === null || votingTimeLeft > 0);
                               })();

  const canDownvote = voteValue === -1 && votingStatus && votingStatus.remainingDownvotes > 0;

  return (
    <PageLock roundType="VOTING" isCompleted={isVotingCompleted || votingRoundCompleted}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
          
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  TEAM VOTING PORTAL
                </h1>
                <p className="text-muted-foreground">Peer Evaluation • Token Strategy • Customer Validation</p>
              </div>
            </div>
          </div>

          {/* SSE Connection Status */}
          <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
            sseConnected 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {sseConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-yellow-500" />
              )}
              <span className={`font-medium ${sseConnected ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {sseConnected ? 'Real-time updates connected' : 'Connecting to real-time updates...'}
              </span>
            </div>
          </div>

          {/* Team Info Banner */}
          {userTeam && (
            <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary">Your Team: {userTeam.name}</h3>
                  <p className="text-muted-foreground">Team ID #{userTeam.id} • Ready to vote and convert tokens</p>
                  {votingStatus && (
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        Votes cast: {votingStatus.votescast?.length || 0}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        Downvotes remaining: {votingStatus.remainingDownvotes || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pitch Cycle Timer Display */}
          {pitchCycleActive && (
            <div className="mb-8 group">
              <div className="relative p-6 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {currentPhase === 'pitching' && <Play className="w-6 h-6 text-green-500" />}
                    {currentPhase === 'preparing' && <Clock className="w-6 h-6 text-yellow-500" />}
                    {currentPhase === 'voting' && <Vote className="w-6 h-6 text-red-500" />}
                    {currentPhase === 'idle' && <Pause className="w-6 h-6 text-gray-400" />}
                    <div>
                      <h3 className="text-xl font-bold">
                        {currentPhase === 'pitching' && 'Team is Pitching'}
                        {currentPhase === 'preparing' && 'Get Ready to Vote'}
                        {currentPhase === 'voting' && 'Voting is Active'}
                        {currentPhase === 'idle' && 'Pitch Cycle Idle'}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {currentPhase === 'pitching' && 'Listen to the team presentation'}
                        {currentPhase === 'preparing' && 'Prepare to make your voting decision'}
                        {currentPhase === 'voting' && 'Vote now! Time is running out'}
                        {currentPhase === 'idle' && 'Waiting for admin to start the next pitch cycle'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">{phaseTimeLeft}s</div>
                  </div>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      currentPhase === 'pitching' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      currentPhase === 'preparing' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      currentPhase === 'voting' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                      'bg-gradient-to-r from-gray-400 to-gray-600'
                    }`}
                    style={{ 
                      width: `${
                        currentPhase === 'pitching' ? (phaseTimeLeft / 90) * 100 :
                        currentPhase === 'preparing' ? (phaseTimeLeft / 5) * 100 :
                        currentPhase === 'voting' ? (phaseTimeLeft / 30) * 100 :
                        0
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 mb-8">
            {/* Cast Vote Card */}
            <div className="group">
              <div className="relative p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Vote className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary">Cast Your Vote</h2>
                </div>

                {/* Team Info Display */}
                {!userTeam && !user?.isAdmin && (
                  <div className="mb-6 p-4 bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">Team Assignment Required</p>
                        <p className="text-sm text-orange-600/80 dark:text-orange-400/80">You need to be assigned to a team to participate in voting. Please contact an administrator.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {user?.isAdmin && !userTeam && (
                  <div className="mb-6 p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">Admin Account</p>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Contact organizers to get a team assignment for voting participation.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Current Pitching Team */}
                {currentPitchTeam ? (
                  <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-accent/5 rounded-xl border border-primary/20">
                    <label className="block text-sm font-semibold mb-2 text-primary">
                      Currently Pitching Team
                    </label>
                    <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-xl text-white font-bold text-lg">
                      {currentPitchTeam.name} (#{currentPitchTeam.id})
                    </div>
                    {currentTeamVotes && (
                      <div className="mt-3 text-sm text-muted-foreground flex items-center gap-4">
                        <div className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M9 21V11h6v10h4V9h3L12 0 2 9h3v12z" />
                          </svg>
                          <span className="font-medium text-green-600">Yes: {currentTeamVotes.upvotes}</span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M15 3v10H9V3H5l7-9 7 9h-4zM3 13h18v8H3v-8z" />
                          </svg>
                          <span className="font-medium text-red-600">No: {currentTeamVotes.downvotes}</span>
                        </div>
                        <div className="ml-2 text-sm text-muted-foreground">Net: <span className="font-semibold">{currentTeamVotes.totalVotes}</span></div>
                      </div>
                    )}
                    {userTeamId === currentPitchTeam.id && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          This is your team - you cannot vote for yourself
                        </p>
                      </div>
                    )}
                    {votingStatus?.votedTeams?.includes(currentPitchTeam.id) && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-sm text-green-600 dark:text-green-400">
                          You have already voted for this team
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border/30">
                    <p className="text-muted-foreground">No team is currently pitching.</p>
                  </div>
                )}

                {/* Vote Options */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-4 text-foreground">
                    Are you the customer for this product?
                  </label>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <button
                      onClick={() => setVoteValue(1)}
                      className={`group relative p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
                        voteValue === 1
                          ? "bg-gradient-to-r from-green-500 to-green-600 border-green-400 text-white shadow-lg shadow-green-500/25"
                          : "border-border hover:border-green-400 hover:bg-green-500/10"
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-center gap-2 font-semibold">
                        <CheckCircle2 className="w-5 h-5" />
                        Yes, I'm a Customer
                      </div>
                    </button>
                    <button
                      onClick={() => setVoteValue(-1)}
                      className={`group relative p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
                        voteValue === -1
                          ? "bg-gradient-to-r from-red-500 to-red-600 border-red-400 text-white shadow-lg shadow-red-500/25"
                          : "border-border hover:border-red-400 hover:bg-red-500/10"
                      } ${votingStatus && votingStatus.remainingDownvotes <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isLoading || !!(votingStatus && votingStatus.remainingDownvotes <= 0)}
                    >
                      <div className="flex items-center justify-center gap-2 font-semibold">
                        <AlertCircle className="w-5 h-5" />
                        No, Not for Me
                        {votingStatus && <span className="text-xs">({votingStatus.remainingDownvotes} left)</span>}
                      </div>
                    </button>
                  </div>
                  {voteValue === -1 && votingStatus && votingStatus.remainingDownvotes <= 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-500/10 rounded-lg">
                      You have used all 3 downvotes
                    </p>
                  )}
                </div>

                {/* Voting Timer */}
                {(() => {
                  if (pitchCycleActive && currentPhase === 'voting') {
                    return (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <Timer className="h-5 w-5 text-red-500" />
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            Voting closes in: <span className="text-xl font-bold">{phaseTimeLeft}s</span>
                          </span>
                        </div>
                        <div className="w-full bg-red-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(phaseTimeLeft / 30) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  
                  if (votingActive && votingTimeLeft !== null && !pitchCycleActive) {
                    return (
                      <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <Timer className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            Voting closes in: <span className="text-xl font-bold">{votingTimeLeft}s</span>
                          </span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(votingTimeLeft / 30) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}

                {/* Submit Button */}
                <button
                  onClick={castVote}
                  disabled={!canVoteForCurrentTeam || isLoading || (voteValue === -1 && !canDownvote)}
                  className="group relative w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting Vote...
                      </>
                    ) : (
                      <>
                        <Vote className="w-5 h-5" />
                        Submit Vote
                      </>
                    )}
                  </div>
                </button>

                {/* Status Messages */}
                {!votingActive && !pitchCycleActive && (
                  <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                      Voting will be enabled by admin during each pitch.
                    </p>
                  </div>
                )}
                
                {!votingActive && pitchCycleActive && currentPhase !== 'voting' && (
                  <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs text-primary text-center font-medium">
                      {currentPhase === 'pitching' && 'Listen to the pitch presentation...'}
                      {currentPhase === 'preparing' && 'Get ready to vote...'}
                      {currentPhase === 'idle' && 'Waiting for next pitch cycle...'}
                    </p>
                  </div>
                )}
                
                {votingActive && votingTimeLeft === 0 && !pitchCycleActive && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
                      Voting time has expired for this pitch.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Convert Tokens Card */}
            <div className="group">
              <div className="relative p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Coins className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-purple-500">Convert Tokens</h2>
                </div>
                
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Convert tokens from each category (Marketing, Capital, Team, Strategy) to get votes. Each conversion uses 1 token from each category to get 1 vote.
                </p>
                
                {/* Token Status Display */}
                {tokenStatus && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-xl border border-purple-500/20">
                    <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">Available Tokens:</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Marketing: <span className="font-bold">{tokenStatus.availableTokens.marketing}</span></span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Capital: <span className="font-bold">{tokenStatus.availableTokens.capital}</span></span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Team: <span className="font-bold">{tokenStatus.availableTokens.team}</span></span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">Strategy: <span className="font-bold">{tokenStatus.availableTokens.strategy}</span></span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-purple-600 dark:text-purple-400 font-semibold text-center">
                        Maximum possible conversions: {Math.max(0, tokenStatus.maxPossibleConversions)}
                      </p>
                    </div>
                    {tokenStatus.totalVotesGained > 0 && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-600 dark:text-green-400 font-semibold text-center">
                          Total votes gained so far: {tokenStatus.totalVotesGained}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                {tokenStatus?.canConvert && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-3 text-foreground">
                      How many tokens do you want to convert?
                    </label>
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="number"
                        min="1"
                        max={tokenStatus.maxPossibleConversions}
                        value={conversionQuantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setConversionQuantity(Math.min(Math.max(1, value), tokenStatus.maxPossibleConversions));
                        }}
                        className="w-20 px-3 py-2 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                      />
                      <span className="text-sm text-muted-foreground">
                        (max: {tokenStatus.maxPossibleConversions})
                      </span>
                    </div>
                    
                    {/* Conversion Preview */}
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-xl">
                      <h5 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Conversion Preview:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tokens used per category:</span>
                          <span className="font-bold">{conversionQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total tokens used:</span>
                          <span className="font-bold">{conversionQuantity * 4}</span>
                        </div>
                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                          <span>Votes you'll gain:</span>
                          <span className="font-bold">{conversionQuantity}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-500/20">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2">
                          Remaining after conversion:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Marketing: {tokenStatus.availableTokens.marketing - conversionQuantity}</div>
                          <div>Capital: {tokenStatus.availableTokens.capital - conversionQuantity}</div>
                          <div>Team: {tokenStatus.availableTokens.team - conversionQuantity}</div>
                          <div>Strategy: {tokenStatus.availableTokens.strategy - conversionQuantity}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Convert Button */}
                <button
                  onClick={convertToken}
                  disabled={!tokenStatus?.canConvert || isConvertingTokens}
                  className="group relative w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    {isConvertingTokens ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Converting Tokens...
                      </>
                    ) : (
                      <>
                        <Coins className="w-5 h-5" />
                        Convert {conversionQuantity} Token{conversionQuantity > 1 ? 's' : ''} → {conversionQuantity} Vote{conversionQuantity > 1 ? 's' : ''}
                      </>
                    )}
                  </div>
                </button>

                {tokenStatus && !tokenStatus.canConvert && (
                  <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                      {!tokenStatus.hasQuizSubmission 
                        ? "Complete the quiz first to earn tokens"
                        : "Need at least 1 token in each category to convert"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voting Statistics */}
          {votingStatus && (
            <div className="mb-8">
              <div className="p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Your Voting History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-500/20">
                    <div className="text-4xl font-bold text-blue-500 mb-2">{votingStatus?.votescast?.length || 0}</div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Votes Cast</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl border border-green-500/20">
                    <div className="text-4xl font-bold text-green-500 mb-2">
                      {votingStatus?.votescast?.filter(v => v.value === 1).length || 0}
                    </div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Yes Votes</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl border border-red-500/20">
                    <div className="text-4xl font-bold text-red-500 mb-2">{votingStatus?.downvoteCount || 0}</div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      No Votes ({votingStatus?.remainingDownvotes || 0} remaining)
                    </div>
                  </div>
                </div>
                
                {votingStatus?.votescast && votingStatus.votescast.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4 text-foreground">Teams You've Voted For:</h4>
                    <div className="flex flex-wrap gap-3">
                      {votingStatus.votescast.map((vote, index) => {
                        const team = teams.find(t => t.id === vote.toTeamId);
                        return (
                          <span 
                            key={index}
                            className={`px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm ${
                              vote.value === 1 
                                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {team?.name || `Team #${vote.toTeamId}`} ({vote.value === 1 ? 'Yes' : 'No'})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mb-8 p-6 rounded-2xl border backdrop-blur-sm font-medium flex items-center gap-3 ${
              messageType === 'success'
                ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                : messageType === 'error'
                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
            }`}>
              {messageType === 'success' && <CheckCircle2 className="h-6 w-6" />}
              {messageType === 'error' && <AlertCircle className="h-6 w-6" />}
              <span>{message}</span>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pb-8">
            <div className="p-6 bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl">
              <p className="text-muted-foreground mb-2">
                Vote strategically and convert tokens wisely to maximize your team's success in the competition.
              </p>
              <p className="text-xs text-muted-foreground">
                Need help? Contact our organizing team through the main event page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLock>
  );
}