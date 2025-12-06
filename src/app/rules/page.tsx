"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, Users, Target, Award, CheckCircle, AlertTriangle, FileText, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../../components/ui/badge";

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

export default function RulesPage() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

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

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading competition rules...</p>
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

      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Competition Rules</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-primary/5 backdrop-blur-sm border border-primary/20 rounded-lg">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Welcome,</span>
                    <span className="font-semibold text-foreground ml-1">{user.name}</span>
                  </div>
                  {user.team && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {user.team.name}
                    </Badge>
                  )}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="relative pt-8 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  BIZ ARENA
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">Virtual Startup Challenge</p>
              </div>
            </div>
            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              The Startup Strategy League
            </h2>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-25"></div>
              <div className="relative text-lg text-muted-foreground max-w-3xl mx-auto p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl">
                <h3 className="text-xl font-bold mb-2">BIZ ARENA</h3>
                <p className="mb-2">
                  BizArena is a virtual startup simulation where you step into the founder's seat. Run a fast-paced startup, make critical decisions on product, marketing, and funding to outmaneuver competitors and dominate the market.
                </p>
                <p className="mb-2">
                  Note: Teams earn or lose tokens based on their decisions. Tokens can be redeemed to buy customers in the Token Marketplace phase — customers determine leaderboard position during the Event Day marketplace.
                </p>
                <p>
                  Each team starts with 12 tokens (3 of each kind): <strong>Capital (Green)</strong>, <strong>Marketing (Red)</strong>, <strong>Innovation (Blue)</strong> and <strong>Team Morale (Yellow)</strong>. Use tokens strategically across rounds.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Overview */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Competition Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Team Based</h3>
                    <p className="text-sm text-muted-foreground">Team leader registration</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/20">
                      <Clock className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">3 Rounds</h3>
                    <p className="text-sm text-muted-foreground">Quiz → Voting → Final</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Weighted Scoring</h3>
                    <p className="text-sm text-muted-foreground">55% Judges + 25% Peers + 15% Approval + 5% Quiz</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competition Structure */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  Competition Structure
                </CardTitle>
                <CardDescription className="text-base">
                  Three rounds with weighted scoring system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl p-4 bg-background/50 border border-border/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    Round 1: Quiz (30 Minutes) - 5% Weight
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                    <li>• <strong>15 questions</strong> testing entrepreneurial mindset</li>
                    <li>• Each answer awards/deducts tokens in 4 categories: <strong>Capital, Marketing, Strategy, Team</strong></li>
                    <li>• Token scores normalized across all teams to create <strong>Quiz Influence Index (Q_index)</strong></li>
                    <li>• Q_index ranges from 0 to 1 (5% contribution to final score)</li>
                    <li>• Marketing tokens boost YES votes in Round 2 (+10% max)</li>
                    <li>• Capital tokens reduce NO vote impact in Round 2 (-10% max)</li>
                    <li>⚠️ <strong>Missed Quiz:</strong> Q_index = 0 (no Round 2 advantages)</li>
                  </ul>
                </div>

                <div className="rounded-xl p-4 bg-background/50 border border-border/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    Round 2: 90-Second Pitch + Voting - 15% Weight
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                    <li>• Each team presents <strong>90-second pitch</strong></li>
                    <li>• Other teams vote <strong>YES or NO</strong> for each pitch</li>
                    <li>• <strong className="text-orange-600 dark:text-orange-400">3-NO LIMIT:</strong> Maximum 3 NO votes total per team</li>
                    <li>• After 3 NO votes exhausted, all further NO attempts <strong>auto-convert to YES</strong></li>
                    <li>• Marketing tokens from Quiz boost YES votes (+10% max)</li>
                    <li>• Capital tokens from Quiz reduce NO vote impact (-10% max)</li>
                    <li>• Final <strong>Approval Rate</strong> calculated: A = YES_effective / (YES_effective + NO_effective)</li>
                    <li>⚠️ <strong>Skipped Vote:</strong> Automatic YES vote (with warning)</li>
                  </ul>
                </div>

                <div className="rounded-xl p-4 bg-background/50 border border-border/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    Round 3: 2-Minute Pitch + Ratings - 80% Weight Combined
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                    <li>• Each team presents <strong>2-minute final pitch</strong></li>
                    <li>• <strong>Judges score:</strong> 30-100 points (55% weight in final score)</li>
                    <li>• <strong>Peer teams rate:</strong> 3-10 points (25% weight in final score)</li>
                    <li>• All scores normalized to [0,1] before applying weights</li>
                    <li>⚠️ <strong>Missed Peer Rating:</strong> Automatic 50 points (neutral, with warning)</li>
                  </ul>
                </div>

                <div className="rounded-xl p-4 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <h4 className="font-semibold mb-3 text-primary">Final Score Formula</h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-mono bg-background/50 p-3 rounded-lg border border-border/50">
                      Final = 0.55×J_norm + 0.25×P_norm + 0.15×A + 0.05×Q_index
                    </p>
                    <p className="text-xs text-muted-foreground">Display Score: Final × 100 (0-100 scale)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="bg-background/50 p-2 rounded border border-border/50">
                      <strong>J_norm:</strong> Judge score normalized
                    </div>
                    <div className="bg-background/50 p-2 rounded border border-border/50">
                      <strong>P_norm:</strong> Peer rating normalized
                    </div>
                    <div className="bg-background/50 p-2 rounded border border-border/50">
                      <strong>A:</strong> Approval rate from Round 2
                    </div>
                    <div className="bg-background/50 p-2 rounded border border-border/50">
                      <strong>Q_index:</strong> Quiz influence from Round 1
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Guidelines */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-orange-500/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-orange-600 dark:text-orange-400">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  Important Rules & Penalties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400">Team Registration Rules</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Only team leader can register</strong> the team</li>
                    <li>One registration per team (no duplicates allowed)</li>
                    <li>All team members use same login credentials</li>
                    <li>Team name must be unique across all teams</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400">Penalties & Auto-Handling</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Missed Quiz:</strong> Q_index = 0 (lose 5% of final score + no Round 2 voting advantages)</li>
                    <li><strong>Skipped Vote (Round 2):</strong> Automatic YES vote sent (with warning notification)</li>
                    <li><strong>Missed Peer Rating (Round 3):</strong> Automatic score of 50 points (neutral, with warning)</li>
                    <li><strong>Exceeded 3 NO votes:</strong> Further NO attempts auto-convert to YES</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400">General Competition Rules</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>All decisions are final once submitted (no edits allowed)</li>
                    <li>Be respectful and professional during pitches</li>
                    <li>Follow all timelines and deadlines</li>
                    <li>Use of unauthorized tools or plagiarized content leads to disqualification</li>
                    <li>Organizing committee's decision is final in case of discrepancies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoring System */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  Winner Determination
                </CardTitle>
                <CardDescription className="text-base">
                  How rankings are calculated and tiebreakers applied
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-primary/5 backdrop-blur-sm rounded-xl border border-primary/20">
                        <div className="text-3xl font-black text-primary mb-2">55%</div>
                        <div className="text-base font-bold mb-1">Judges</div>
                        <div className="text-xs text-muted-foreground">30-100 range</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-accent/5 backdrop-blur-sm rounded-xl border border-accent/20">
                        <div className="text-3xl font-black text-accent mb-2">25%</div>
                        <div className="text-base font-bold mb-1">Peers</div>
                        <div className="text-xs text-muted-foreground">3-10 range</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-yellow-500/5 backdrop-blur-sm rounded-xl border border-yellow-500/20">
                        <div className="text-3xl font-black text-yellow-600 mb-2">15%</div>
                        <div className="text-base font-bold mb-1">Approval</div>
                        <div className="text-xs text-muted-foreground">Round 2 votes</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-green-500/5 backdrop-blur-sm rounded-xl border border-green-500/20">
                        <div className="text-3xl font-black text-green-600 mb-2">5%</div>
                        <div className="text-base font-bold mb-1">Quiz</div>
                        <div className="text-xs text-muted-foreground">Round 1 tokens</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-50"></div>
                    <div className="relative p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                      <p className="text-sm text-muted-foreground font-medium mb-2">
                        <strong>Primary Criteria:</strong> Highest Final Score wins
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Tiebreaker:</strong> If two or more teams have identical final scores, the winner is determined by <strong>alphabetical order of team name</strong> (Team Alpha beats Team Beta)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact, Prizes & Support */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Prizes & Contact</CardTitle>
                <CardDescription className="text-base">
                  Incentives and organizer contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                    <h4 className="font-semibold">Prizes & Incentives</h4>
                    <ul className="list-decimal list-inside text-sm text-muted-foreground mt-2">
                      <li>Prize pool of ₹15,000</li>
                      <li>Certificate of Participation</li>
                      <li>Certificate of Completion</li>
                      <li>Incubation Fast-Track / Pre-Incubation support</li>
                      <li>Mentorship credits (1:1 hours with entrepreneurs & experts)</li>
                      <li>Internship opportunities & access to curated courses</li>
                      <li>Startup kit and corporate introductions</li>
                      <li>Global exposure & nominations for international events</li>
                    </ul>
                  </div>

                  <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                    <h4 className="font-semibold">Contact Organizers</h4>
                    <p className="text-sm text-muted-foreground mt-2">For queries and assistance, reach out to:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                      <li>Ayush Pardeshi (CEO):  +91 87665 36270</li>
                      <li>Ahana Kulkarni (CTO):  +91 89283 52406</li>
                      <li>Bhummi Girnara (COO):  +91 98698 32960</li>
                      <li>Hredey Chaand (CMO):  +91 90047 24466</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}