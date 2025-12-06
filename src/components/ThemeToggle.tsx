"use client"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  return (
    <AnimatedThemeToggler 
      className={className}
      size={size}
    />
  );
}