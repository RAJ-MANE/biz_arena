"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { CircleLoader } from "@/components/CircleLoader";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useVotingTimer } from '@/hooks/useVotingTimer';
import { useRatingTimer } from '@/hooks/useRatingTimer';
import { 
  Trophy, 
  Users, 
  Calendar, 
  RefreshCw, 
  Crown, 
  Target, 
  Brain, 
  Mic, 
  Award, 
  CheckCircle, 
  Clock, 
  Play, 
  Settings,
  BarChart3,
  BookOpen,
  Shield,
  User,
  Building2,
  Hash,
  Sparkles
} from "lucide-react";

interface User {
  id: string;
  name: string;
  username: string;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

interface Team {
  id: number;
  name: string;
  college: string;
  leader: {
    userId: string;
    name: string;
    username: string;
  } | null;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [votingCompleted, setVotingCompleted] = useState(false);
  const [finalCompleted, setFinalCompleted] = useState(false);
  const [roundStatuses, setRoundStatuses] = useState<{
    quiz: { status: string; isActive: boolean };
    voting: { status: string; isActive: boolean };
    final: { status: string; isActive: boolean };
  }>({
    quiz: { status: 'PENDING', isActive: false },
    voting: { status: 'PENDING', isActive: false },
    final: { status: 'PENDING', isActive: false }
  });
  const router = useRouter();

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

  const isLeader = useMemo(() => {
    return user?.team?.role === 'LEADER';
  }, [user]);

  const checkRoundStatuses = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/rounds");
      if (res.ok) {
        const rounds = await res.json();
        const quiz = rounds.find((r: any) => r.name === 'QUIZ');
        const voting = rounds.find((r: any) => r.name === 'VOTING');
        const final = rounds.find((r: any) => r.name === 'FINAL');
        
        setQuizCompleted(quiz?.status === 'COMPLETED' || quiz?.isCompleted || false);
        setVotingCompleted(voting?.status === 'COMPLETED' || voting?.isCompleted || false);
        setFinalCompleted(final?.status === 'COMPLETED' || final?.isCompleted || false);
        
        setRoundStatuses({
          quiz: { 
            status: quiz?.status || 'PENDING', 
            isActive: quiz?.status === 'ACTIVE' || quiz?.isActive || false 
          },
          voting: { 
            status: voting?.status || 'PENDING', 
            isActive: voting?.status === 'ACTIVE' || voting?.isActive || false 
          },
          final: { 
            status: final?.status || 'PENDING', 
            isActive: final?.status === 'ACTIVE' || final?.isActive || false 
          }
        });
      }
    } catch (e) {
      console.error("Failed to check round statuses:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadTeam = async () => {
    try {
      if (user?.team) {
        setTeam({
          id: user.team.id,
          name: user.team.name,
          college: user.team.college,
          leader: {
            userId: user.id,
            name: user.name,
            username: user.username
          }
        });
        return;
      }

      const res = await fetch("/api/teams");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data) && user) {
        const myTeam = data.find((t: Team) => 
          t.leader?.userId === user.id || t.leader?.username === user.username
        );
        setTeam(myTeam || null);
      }
    } catch (e: any) {
      console.error("Failed to load team:", e);
      setError(e?.message || "Failed to load team");
    }
  };

  useEffect(() => {
    if (user) {
      loadTeam();
      checkRoundStatuses();
      
      const interval = setInterval(checkRoundStatuses, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Poll hooks to keep timer state fresh when user triggers manual refresh
  const { poll: pollVotingStatus } = useVotingTimer();
  const { poll: pollRatingStatus } = useRatingTimer();

  const refreshStatuses = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        pollVotingStatus(),
        pollRatingStatus()
      ]);
      await checkRoundStatuses();
    } catch (e) {
      console.error("Failed to refresh statuses:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const getRoundStatusIcon = (status: string, isActive: boolean) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'ACTIVE' || isActive) return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getRoundStatusColor = (status: string, isActive: boolean) => {
    if (status === 'COMPLETED') return 'border-green-500/30 bg-green-500/10';
    if (status === 'ACTIVE' || isActive) return 'border-blue-500/30 bg-blue-500/10 animate-pulse';
    return 'border-gray-400/30 bg-gray-400/10';
  };

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
              Loading Dashboard
            </h2>
            <p className="text-muted-foreground">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center p-8 bg-card/50 backdrop-blur-sm border border-red-500/20 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Access Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access your dashboard.</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/sign-in"
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-6 py-3 bg-card/50 backdrop-blur-sm border border-border font-semibold rounded-xl hover:bg-accent/10 transition-all duration-300 hover:-translate-y-1"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <DashboardNavbar />
      
      <div className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Welcome Hero Section */}
          <div className="mb-12">
            <div className="relative overflow-hidden p-8 lg:p-12 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl shadow-primary/10">
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                      BIZ ARENA
                    </h1>
                    <p className="text-muted-foreground">Real World Problem Solving • Entrepreneurial Thinking</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome back, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{user.name || user.username}</span>
                  </h2>
                  
                  {(user.team || team) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-3 p-4 bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Team</p>
                          <p className="font-semibold">{user.team?.name || team?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl">
                        <Building2 className="w-5 h-5 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">College</p>
                          <p className="font-semibold">{user.team?.college || team?.college}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLeader && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 rounded-full">
                      <Crown className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Team Leader • The Startup Strategy League</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <Button 
                      onClick={() => setError(null)}
                      variant="link"
                      size="sm"
                      className="mt-1 text-sm underline hover:no-underline text-red-500 h-auto p-0"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {msg && (
              <div className="mt-4 p-4 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl shadow-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-600 dark:text-green-400">{msg}</p>
                    <Button 
                      onClick={() => setMsg(null)}
                      variant="link"
                      size="sm"
                      className="mt-1 text-sm underline hover:no-underline text-green-500 h-auto p-0"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Competition Portals */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Competition Portals
              </h2>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Round 1: Quiz */}
              <Link 
                href="/quiz" 
                className="group relative overflow-hidden p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
              >
                <div className="absolute top-4 right-4">
                  {getRoundStatusIcon(roundStatuses.quiz.status, roundStatuses.quiz.isActive)}
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary">Round 1</h3>
                    <p className="text-sm text-muted-foreground">Quiz for Tokens</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  DAY 1: Earn strategic tokens through 15 questions in 30 minutes. Max 60 points with trade-offs (Marketing, Capital, Team, Strategy).
                </p>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoundStatusColor(roundStatuses.quiz.status, roundStatuses.quiz.isActive)}`}>
                  {roundStatuses.quiz.status === 'COMPLETED' ? 'Completed' : 
                   roundStatuses.quiz.status === 'ACTIVE' ? 'Active Now' : 
                   'Pending'}
                </div>
              </Link>

              {/* Round 2: Voting */}
              <Link 
                href="/voting" 
                className="group relative overflow-hidden p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10 hover:border-accent/30"
              >
                <div className="absolute top-4 right-4">
                  {getRoundStatusIcon(roundStatuses.voting.status, roundStatuses.voting.isActive)}
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-accent">Round 2</h3>
                    <p className="text-sm text-muted-foreground">90 Sec Pitch & Voting</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  DAY 1: Customer Acquiring phase - Deliver 90-second pitch, vote for teams, convert tokens strategically. Max 3 downvotes per team.
                </p>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoundStatusColor(roundStatuses.voting.status, roundStatuses.voting.isActive)}`}>
                  {roundStatuses.voting.status === 'COMPLETED' ? 'Completed' : 
                   roundStatuses.voting.status === 'ACTIVE' ? 'Active Now' : 
                   'Pending'}
                </div>
              </Link>

              {/* Round 3: Final */}
              <Link 
                href="/final" 
                className="group relative overflow-hidden p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
              >
                <div className="absolute top-4 right-4">
                  {getRoundStatusIcon(roundStatuses.final.status, roundStatuses.final.isActive)}
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary">Round 3</h3>
                    <p className="text-sm text-muted-foreground">5 Min Pitch & Evaluation</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  DAY 2: Comprehensive pitch with Q&A, peer ratings (3-10 scale), judge scoring, and final evaluation.
                </p>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoundStatusColor(roundStatuses.final.status, roundStatuses.final.isActive)}`}>
                  {roundStatuses.final.status === 'COMPLETED' ? 'Completed' : 
                   roundStatuses.final.status === 'ACTIVE' ? 'Active Now' : 
                   'Pending'}
                </div>
              </Link>
            </div>
          </div>

          {/* Team Information */}
          {(user.team || team) && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Team Details
              </h2>
              <div className="p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl">
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team Name</p>
                      <p className="font-bold text-lg">{user.team?.name || team?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">College</p>
                      <p className="font-bold text-lg">{user.team?.college || team?.college}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Leader</p>
                      <p className="font-bold text-lg">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center">
                      <Hash className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team ID</p>
                      <p className="font-bold text-lg">{user.team?.id || team?.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Schedule & Status */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Event Schedule
              </h2>
              <Button 
                onClick={refreshStatuses}
                disabled={refreshing}
                variant="outline"
                className="group inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                <span className="font-medium">{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
              </Button>
            </div>

            {/* Event Days */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-sm border border-primary/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-xl text-primary">DAY 1 - SEPTEMBER 25</h3>
                </div>
                <p className="text-muted-foreground">Quiz for Tokens + 90 Sec Pitch & Voting</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-accent/10 to-primary/5 backdrop-blur-sm border border-accent/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                  <h3 className="font-bold text-xl text-accent">DAY 2 - SEPTEMBER 27</h3>
                </div>
                <p className="text-muted-foreground">5 Min Pitch + Q&A + Final Evaluation</p>
              </div>
            </div>

            {/* Round Status Cards */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <div className={`p-6 bg-card/50 backdrop-blur-sm border rounded-2xl transition-all duration-300 ${getRoundStatusColor(roundStatuses.quiz.status, roundStatuses.quiz.isActive)}`}>
                <div className="flex items-center gap-4 mb-3">
                  {getRoundStatusIcon(roundStatuses.quiz.status, roundStatuses.quiz.isActive)}
                  <div>
                    <h4 className="font-semibold text-primary">Round 1: Quiz for Tokens</h4>
                    <p className="text-sm text-muted-foreground">
                      {roundStatuses.quiz.status === 'COMPLETED' ? 'Completed' : 
                       roundStatuses.quiz.status === 'ACTIVE' ? 'Active Now' : 
                       'Pending'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {roundStatuses.quiz.status === 'COMPLETED' ? 'All teams have completed the quiz' : 
                   roundStatuses.quiz.status === 'ACTIVE' ? 'Quiz is currently open for submissions' : 
                   'Waiting for admin to activate'}
                </div>
              </div>

              <div className={`p-6 bg-card/50 backdrop-blur-sm border rounded-2xl transition-all duration-300 ${getRoundStatusColor(roundStatuses.voting.status, roundStatuses.voting.isActive)}`}>
                <div className="flex items-center gap-4 mb-3">
                  {getRoundStatusIcon(roundStatuses.voting.status, roundStatuses.voting.isActive)}
                  <div>
                    <h4 className="font-semibold text-accent">Round 2: Pitch & Voting</h4>
                    <p className="text-sm text-muted-foreground">
                      {roundStatuses.voting.status === 'COMPLETED' ? 'Completed' : 
                       roundStatuses.voting.status === 'ACTIVE' ? 'Active Now' : 
                       'Pending'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {roundStatuses.voting.status === 'COMPLETED' ? 'All voting has been completed' : 
                   roundStatuses.voting.status === 'ACTIVE' ? 'Voting is currently open' : 
                   'Waiting for quiz completion'}
                </div>
              </div>

              <div className={`p-6 bg-card/50 backdrop-blur-sm border rounded-2xl transition-all duration-300 ${getRoundStatusColor(roundStatuses.final.status, roundStatuses.final.isActive)}`}>
                <div className="flex items-center gap-4 mb-3">
                  {getRoundStatusIcon(roundStatuses.final.status, roundStatuses.final.isActive)}
                  <div>
                    <h4 className="font-semibold text-primary">Round 3: Final Evaluation</h4>
                    <p className="text-sm text-muted-foreground">
                      {roundStatuses.final.status === 'COMPLETED' ? 'Completed' : 
                       roundStatuses.final.status === 'ACTIVE' ? 'Active Now' : 
                       'Pending'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {roundStatuses.final.status === 'COMPLETED' ? 'Final evaluation completed' : 
                   roundStatuses.final.status === 'ACTIVE' ? 'Final presentations in progress' : 
                   'Waiting for voting completion'}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Status updates automatically every 10 seconds
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Quick Actions
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Link 
                href="/scoreboard" 
                className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-primary">Scoreboard</h4>
                </div>
                <p className="text-sm text-muted-foreground">View live rankings and team scores</p>
              </Link>

              <Link 
                href="/rules" 
                className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-accent/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-accent">Rules</h4>
                </div>
                <p className="text-sm text-muted-foreground">Competition rules and guidelines</p>
              </Link>

              <Link 
                href="/" 
                className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-primary">Home</h4>
                </div>
                <p className="text-sm text-muted-foreground">Return to main event page</p>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="p-6 bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl">
              <p className="text-muted-foreground mb-2">
                Ready to compete? Access your competition portals above and start your entrepreneurial journey.
              </p>
              <p className="text-xs text-muted-foreground">
                Need help? Contact our organizing team through the main event page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}