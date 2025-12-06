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
                    <p className="text-sm text-muted-foreground">2-4 members per team</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/20">
                      <Clock className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Multiple Rounds</h3>
                    <p className="text-sm text-muted-foreground">Quiz, Voting & Final rounds</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Competitive</h3>
                    <p className="text-sm text-muted-foreground">Strategic gameplay</p>
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
                  Competition Structure & How to Play
                </CardTitle>
                <CardDescription className="text-base">
                  Overview, roles, tokens, phases and marketplace rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl p-4 bg-background/50 border border-border/50">
                  <h4 className="font-semibold mb-2">How to Play</h4>
                  <p className="text-sm text-muted-foreground mb-2">Form a team of 3–5 participants and assign roles. Teams compete across multiple rounds to earn points and customers. Decisions during rounds earn or deduct tokens; tokens are used strategically in the Token Marketplace to buy customers and improve leaderboard rank.</p>

                  <h5 className="font-medium mt-2">Roles & Team Composition</h5>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>CMO — Marketing campaign wizardry</li>
                    <li>CTO — Tech innovation</li>
                    <li>PR Head — Customer engagement</li>
                    <li>CFO — Financial mastery</li>
                    <li>CEO / Biz Dev — Business development & strategy</li>
                  </ul>

                  <h5 className="font-medium mt-3">Tokens (Resources)</h5>
                  <p className="text-sm text-muted-foreground">Tokens represent critical resources. Each team starts with 12 tokens (3 of each):</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li><strong>Capital (Green)</strong> — Financial assets</li>
                    <li><strong>Marketing (Red)</strong> — Audience reach & engagement</li>
                    <li><strong>Innovation (Blue)</strong> — Creativity & technical depth</li>
                    <li><strong>Team Morale (Yellow)</strong> — Team spirit & resilience</li>
                  </ul>
                </div>

                <div className="rounded-xl p-4 bg-background/50 border border-border/50">
                  <h4 className="font-semibold mb-2">Game Phases</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground">
                    <li><strong>Pre-Event (Phase 1)</strong> — Ideation & Branding (online). Submit a Business Model Canvas with domain, name and tagline. Selected teams proceed to Event Day.</li>
                    <li><strong>Event Day — Strategic Challenges (Phase 2)</strong> — Teams face domain-specific dilemmas and resource-management decisions. Choices affect token balances.</li>
                    <li><strong>Token Marketplace Domination (Phase 3)</strong> — Teams present for 2 minutes to an audience acting as customers. Audience votes Yes/No. Teams can redeem tokens to convert No votes to Yes (see marketplace rules).</li>
                    <li><strong>Final Round (Phase 4)</strong> — Top teams present full pitches and face judge evaluations and peer ratings.</li>
                  </ol>

                  <h5 className="font-medium mt-3">Token Marketplace Rules</h5>
                  <p className="text-sm text-muted-foreground">During Phase 3, a team may convert a single No vote into a Yes by spending <strong>one token of each kind</strong> (1 Capital + 1 Marketing + 1 Innovation + 1 Team Morale = 1 customer). Tokens spent to buy customers are non-refundable and must be decided before the next team begins pitching. A team may buy as many customers as their tokens allow. Customers determine leaderboard position which affects final rankings; all teams advance to the final round.</p>
                </div>

                <div className="rounded-xl p-4 bg-background/50 border border-border/50">
                  <h4 className="font-semibold mb-2">How to Win</h4>
                  <p className="text-sm text-muted-foreground">The team with the highest cumulative score (judges' points + remaining tokens and marketplace customers) wins. Scores reflect strategy, execution and adaptability.</p>
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
                  General Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Please read and follow these rules carefully:</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>All decisions are final once submitted.</li>
                    <li>Be respectful and professional during pitches and discussions.</li>
                    <li>Follow the timeline and deadlines provided by the organizers.</li>
                    <li>Tokens cannot be traded between teams.</li>
                    <li>Use of unauthorized tools or plagiarized content will lead to disqualification.</li>
                    <li>The organizing committee's decision will be final in case of any discrepancy.</li>
                  </ol>
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
                  Scoring System
                </CardTitle>
                <CardDescription className="text-base">
                  Understanding how points are awarded across different rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-primary/5 backdrop-blur-sm rounded-xl border border-primary/20">
                        <div className="text-3xl font-black text-primary mb-2">30%</div>
                        <div className="text-base font-bold mb-1">Quiz Round</div>
                        <div className="text-sm text-muted-foreground">Individual knowledge</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-accent/5 backdrop-blur-sm rounded-xl border border-accent/20">
                        <div className="text-3xl font-black text-accent mb-2">30%</div>
                        <div className="text-base font-bold mb-1">Voting Round</div>
                        <div className="text-sm text-muted-foreground">Strategic decisions</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/15 to-accent/15 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm rounded-xl border border-primary/20">
                        <div className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">40%</div>
                        <div className="text-base font-bold mb-1">Final Round</div>
                        <div className="text-sm text-muted-foreground">Presentation & evaluation</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-50"></div>
                    <div className="relative text-center p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                          <p className="text-sm text-muted-foreground font-medium">
                            Final ranking is determined by total accumulated points across all rounds.
                          </p>
                        </div>
                        <div className="relative mt-3 text-sm text-muted-foreground">
                          Ranking Criteria: Final cumulative score (judge total + peer total + remaining token score) • Original yes votes (audience votes only) as first tiebreaker • Total votes (including converted votes) as final tiebreaker.
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