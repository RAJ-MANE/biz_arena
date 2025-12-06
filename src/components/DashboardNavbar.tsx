"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Brain, 
  Vote, 
  Trophy, 
  BarChart3, 
  Menu, 
  X
} from "lucide-react";

const NAV_LINKS = [
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/voting", label: "Voting", icon: Vote },
  { href: "/final", label: "Finals", icon: Trophy },
  { href: "/scoreboard", label: "Scoreboard", icon: BarChart3 },
];

export function DashboardNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' ? '/esummit-logo-white.png' : '/esummit-logo.png';

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-card/90 backdrop-blur-xl border-b border-border/50 safe-area-top">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton />
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image src={logoSrc} alt="E-Summit Logo" width={48} height={48} className="object-contain" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BizArena
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="ghost"
                size="icon"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className="border-t border-border/50 bg-card/95 backdrop-blur-xl">
              <div className="px-4 py-2 space-y-1">
                {NAV_LINKS.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 font-medium text-foreground hover:text-primary transition-all duration-200 px-4 py-3 rounded-xl hover:bg-primary/5 group"
                    >
                      <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-padding">
          <div className="grid grid-cols-4 h-16">
            {NAV_LINKS.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-primary/5 group"
                >
                  <IconComponent className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Desktop/Tablet Navigation
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-card/90 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-6 lg:px-10 py-4 lg:py-5">
        <div className="flex items-center gap-4">
          <BackButton />
          
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              <Image src={logoSrc} alt="E-Summit Logo" width={56} height={56} className="object-contain" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                BIZ ARENA
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Virtual Startup Challenge</p>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex gap-2 ml-8">
            {NAV_LINKS.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative flex items-center gap-2 font-medium text-muted-foreground hover:text-primary transition-all duration-200 px-4 py-2 rounded-xl hover:bg-primary/5"
                >
                  <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="whitespace-nowrap">{link.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                </Link>
              );
            })}
          </div>

          {/* Tablet Navigation (Icons Only) */}
          <div className="md:hidden flex gap-2 ml-4 overflow-x-auto">
            {NAV_LINKS.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative flex items-center justify-center font-medium text-muted-foreground hover:text-primary transition-all duration-200 p-3 rounded-xl hover:bg-primary/5 flex-shrink-0"
                >
                  <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                </Link>
              );
            })}
          </div>
        </div>
        
        <ThemeToggle />
      </div>
    </nav>
  );
}