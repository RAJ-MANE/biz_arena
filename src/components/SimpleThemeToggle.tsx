"use client";

import { Moon02, Sun } from "@untitled-ui/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SimpleThemeToggle = ({ className, size = 'md' }: SimpleThemeToggleProps) => {
  const [theme, setTheme] = useState<string>('dark');
  const [mounted, setMounted] = useState(false);

  // Only run on client side after hydration
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || 'dark';
    setTheme(savedTheme);

    // Apply the theme immediately with minimal DOM writes
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Apply theme to document with minimal writes
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(newTheme);
    }

    // Debounce localStorage write for quicker interactions on mobile
    try {
      window.clearTimeout((toggleTheme as any)._debounceId);
    } catch {}
    (toggleTheme as any)._debounceId = window.setTimeout(() => {
      try { localStorage.setItem("theme", newTheme); } catch {}
    }, 120);
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background",
        sizeClasses[size],
        className
      )}>
        <div style={{ width: iconSizes[size], height: iconSizes[size] }} />
      </div>
    );
  }

  return (
    <Button 
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Currently ${theme} mode. Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun 
          width={iconSizes[size]} 
          height={iconSizes[size]}
          className="text-orange-500 transition-colors duration-200" 
        />
      ) : (
        <Moon02 
          width={iconSizes[size]} 
          height={iconSizes[size]}
          className="text-slate-600 transition-colors duration-200" 
        />
      )}
    </Button>
  );
};