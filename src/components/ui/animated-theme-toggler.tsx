"use client";

import { Moon02, Sun } from "@untitled-ui/icons-react";
import { useRef, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface AnimatedThemeTogglerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedThemeToggler = ({ className, size = 'md' }: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with theme provider
  useEffect(() => {
    if (mounted) {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme, mounted]);

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

  const changeTheme = async () => {
    if (!buttonRef.current || !mounted) return;

    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Simple fallback first - ensure theme always changes
    const fallbackChange = () => {
      setTheme(newTheme);
    };

    // Respect reduced-motion preference and avoid heavy animations on mobile/touch devices
    if (typeof window === 'undefined') {
      fallbackChange();
      return;
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;

    // If user prefers reduced motion or on touch/mobile, do a minimal change without view transitions
    if (prefersReduced || isTouchDevice || !('startViewTransition' in document)) {
      // Quick UI feedback: use a tiny transform to hint change (GPU-accelerated)
      try {
        buttonRef.current.style.willChange = 'transform, opacity';
        buttonRef.current.style.transform = 'scale(0.98)';
        setTimeout(() => {
          buttonRef.current && (buttonRef.current.style.transform = '');
        }, 120);
      } catch {}
      fallbackChange();
      return;
    }

    try {
      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      });

      await transition.ready;

      // compute a lightweight circular reveal centered on the button
      const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
      const y = top + height / 2;
      const x = left + width / 2;

      const right = window.innerWidth - left;
      const bottom = window.innerHeight - top;
      const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

      // Use a shorter duration and simpler easing for snappier feel
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${Math.ceil(maxRad)}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    } catch (error) {
      // Fallback if view transition fails
      fallbackChange();
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
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
    <button
      ref={buttonRef}
      onClick={changeTheme}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background focus:outline-none",
  // limit transitions to color changes by default; allow transform only when motion is allowed
  "transition-colors duration-150 motion-safe:transition-transform motion-safe:duration-150",
  "motion-safe:active:scale-95",
        "focus:ring-2 focus:ring-primary focus:ring-offset-2",
        sizeClasses[size],
        className
      )}
      aria-pressed={isDarkMode}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Currently ${theme} mode. Click to switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <Sun
          width={iconSizes[size]}
          height={iconSizes[size]}
          className="text-orange-500 dark:text-orange-400 transition-colors duration-150"
        />
      ) : (
        <Moon02
          width={iconSizes[size]}
          height={iconSizes[size]}
          className="text-slate-600 dark:text-slate-300 transition-colors duration-150"
        />
      )}
    </button>
  );
};
