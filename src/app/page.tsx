"use client"

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Marquee } from "@/components/ui/marquee";
import { RetroGrid } from "@/components/ui/retro-grid";
import { useTheme } from "next-themes";
import { Target01, Users01, UserPlus01, LogIn01, Award01, Settings01, Scale01, ArrowRight, Calendar, Trophy01, Lightbulb01, Microphone01 } from "@untitled-ui/icons-react";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const isSignedIn = !!session?.user;
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' ? '/esummit-logo-white.png' : '/esummit-logo.png';
  
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
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden">
              <Image src={logoSrc} alt="E-Summit Logo" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                BIZ ARENA
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Virtual Startup Challenge</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/scoreboard" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors">
              Scoreboard
            </Link>
            {!isSignedIn && (
              <Link href="/sign-in" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors">
                Sign In
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <RetroGrid />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20 hover:border-primary/40 transition-all duration-300 group">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-primary">10:00 A.M - 1:00 P.M • Lab 520, 521</span>
            <div className="w-1 h-1 bg-primary/50 rounded-full group-hover:scale-150 transition-transform"></div>
          </div>
          
          {/* Main Title */}
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none">
              <span className="block bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent hover:scale-105 transition-transform duration-500 cursor-default">
                BIZ ARENA
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Step into the founder's seat. Run a virtual startup in this fast-paced simulation. 
              Make critical decisions on <span className="text-primary font-semibold">product</span>, 
              <span className="text-accent font-semibold"> marketing</span>, and{" "}
              <span className="text-primary font-semibold">funding</span> to outmaneuver competitors and dominate the market.
            </p>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">10:00 A.M - 1:00 P.M</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Lab 520, 521</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/sign-up" 
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                Register Your Team
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              href="/sign-in" 
              className="px-8 py-4 bg-background/50 backdrop-blur-sm border border-border hover:border-primary/50 font-semibold rounded-2xl hover:bg-accent/10 transition-all duration-300 hover:-translate-y-1"
            >
              Sign In
            </Link>
            <Link 
              href="/scoreboard" 
              className="px-8 py-4 bg-background/30 backdrop-blur-sm border border-border/50 font-medium rounded-2xl hover:bg-background/50 hover:border-border transition-all duration-300 hover:-translate-y-1"
            >
              View Rankings
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-card/80 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                <Target01 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Strategic Decisions</h3>
              <p className="text-muted-foreground text-sm">Make critical business choices</p>
            </div>
            <div className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-card/80 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                <Users01 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast-Paced Simulation</h3>
              <p className="text-muted-foreground text-sm">Real-time startup challenges</p>
            </div>
            <div className="group p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-card/80 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                <Trophy01 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Market Domination</h3>
              <p className="text-muted-foreground text-sm">Outmaneuver your competitors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Timeline */}
      <section className="relative py-20 bg-gradient-to-b from-transparent to-card/30">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Event Details
            </h2>
            <p className="text-xl text-muted-foreground">Your journey from founder to market leader</p>
          </div>

          {/* Day 1 */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg text-primary">DAY 1 - JANUARY 23, 2026</span>
              </div>
            </div>
            
            <Marquee pauseOnHover className="[--duration:25s]">
              <div className="mx-4 group">
                <div className="relative p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10 min-w-[400px]">
                  <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Lightbulb01 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2">ROUND 1</h3>
                      <p className="text-lg font-semibold text-accent">QUIZ FOR TOKENS</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Test your knowledge and earn strategic tokens that will be crucial for the next round.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium">15 questions in 30 minutes</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="font-medium">Maximum 60 points available</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-4 group">
                <div className="relative p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-accent/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-accent/10 min-w-[400px]">
                  <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Microphone01 className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-accent mb-2">ROUND 2</h3>
                      <p className="text-lg font-semibold text-primary">90 SEC PITCH</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Customer Acquiring - Present your idea and win the crowd's vote.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="font-medium">90-second pitch presentation</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium">30s team voting period</span>
                    </div>
                  </div>
                </div>
              </div>
            </Marquee>
          </div>

          {/* Day 2 */}
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full border border-accent/20 backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-accent" />
                <span className="font-bold text-lg text-accent">DAY 2 - JANUARY 24, 2026</span>
              </div>
            </div>
            
            <Marquee pauseOnHover reverse className="[--duration:30s]">
              <div className="mx-4 group">
                <div className="relative p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10 min-w-[400px]">
                  <div className="absolute top-4 right-4 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Trophy01 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2">ROUND 3</h3>
                      <p className="text-lg font-semibold text-accent">5 MIN PITCH</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Followed by Q&A and Points Acquisition - Your final chance to impress.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium">5-minute comprehensive pitch</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="font-medium">Q&A session with judges</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-4 group">
                <div className="relative p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-accent/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-accent/10 min-w-[400px]">
                  <div className="absolute top-4 right-4 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award01 className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-accent mb-2">ROUND 4</h3>
                      <p className="text-lg font-semibold text-primary">EVALUATION</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Points Acquisition, Evaluation and Result Declaration
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="font-medium">Final score calculation</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium">Winner announcement</span>
                    </div>
                  </div>
                </div>
              </div>
            </Marquee>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-20 bg-gradient-to-b from-card/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Quick Access
            </h2>
            <p className="text-xl text-muted-foreground">Everything you need, one click away</p>
          </div>

          {/* User Links */}
          {!isSignedIn && (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-3 mb-12">
              <Link href="/sign-up" className="group relative overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus01 className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">Register Team</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Join the ultimate entrepreneurship challenge
                  </p>
                  <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              <Link href="/sign-in" className="group relative overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-accent/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-accent/10 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LogIn01 className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-accent">Sign In</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Access your dashboard and compete
                  </p>
                  <div className="flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
                    Enter Portal <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              <Link href="/scoreboard" className="group relative overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award01 className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">Scoreboard</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    View live rankings and team scores
                  </p>
                  <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                    View Rankings <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Admin Links */}
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
            <Link href="/admin/login" className="group relative overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm border border-border/30 rounded-3xl hover:border-accent/20 transition-all duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent/15 to-primary/15 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings01 className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-accent">Admin Console</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Control rounds, manage questions, oversee event flow
                </p>
                <div className="flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
                  Admin Access <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/judge" className="group relative overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm border border-border/30 rounded-3xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-primary/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-accent/15 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale01 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Judge Console</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Score presentations, evaluate final performances
                </p>
                <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                  Judge Access <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card/20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Have questions? Our organizing team is here to help
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              { name: "Ayush Pardeshi", role: "CEO", phone: "+91 8766536270" },
              { name: "Ahana Kulkarni", role: "CTO", phone: "+91 8928352406" },
              { name: "Bhummi Girnara", role: "COO", phone: "+91 98698 32960" },
              { name: "Hredey Chaand", role: "CMO", phone: "+91 9004724466" }
            ].map((contact, index) => (
              <div key={index} className="group">
                <div className="p-6 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <span className="font-bold text-primary">{contact.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <h4 className="font-bold text-lg text-primary mb-1">{contact.name}</h4>
                  <p className="text-muted-foreground text-sm mb-3">{contact.role}</p>
                  <p className="font-mono text-sm bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                    {contact.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-gradient-to-b from-card/30 to-card/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center lg:items-start gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                <Image src={logoSrc} alt="E-Summit Logo" width={64} height={64} className="object-contain" />
              </div>
              <div className="text-center lg:text-left">
                <p className="text-muted-foreground mb-2">
                  © {new Date().getFullYear()} BizArena
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Virtual Startup Simulation • Lab 520, 521
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-primary/5">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm font-medium hover:text-accent transition-colors px-4 py-2 rounded-lg hover:bg-accent/5">
                Sign Up
              </Link>
              <Link href="/scoreboard" className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-primary/5">
                Scoreboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}