"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: (_: string) => {},
});
let _lsDebounce: number | undefined;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // Only run on client side after hydration
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Apply theme with minimal DOM writes
    try {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(theme);
    } catch (e) {
      // ignore in non-browser environments
    }

    // Debounce localStorage writes to avoid jank on mobile
    try {
      if (typeof window !== 'undefined') {
        window.clearTimeout(_lsDebounce as any);
      }
    } catch {}
    if (typeof window !== 'undefined') {
      _lsDebounce = window.setTimeout(() => {
        try { localStorage.setItem("theme", theme); } catch {}
      }, 100) as any;
    }
  }, [theme, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "dark", setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
