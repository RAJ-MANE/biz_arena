
import { useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  name: string;
  isAdmin?: boolean;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

export interface SessionData {
  user: User;
}

export function useSession() {
  const [data, setData] = useState<SessionData | null>(null);
  const [isPending, setIsPending] = useState(true);

  const loadSession = () => {
    try {
      if (typeof window === 'undefined') {
        setData(null);
        setIsPending(false);
        return;
      }

      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setData({ user });
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('Session load error:', error);
      setData(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    loadSession();

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        loadSession();
      }
    };

    // Listen for custom events (login/logout in same tab)
    const handleAuthChange = () => {
      loadSession();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Clear client-side storage
    localStorage.removeItem("user");
    localStorage.removeItem("auth-token");
    
    setData(null);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new Event("authChange"));
  };

  const updateUser = (updatedUser: User) => {
    const newData = { user: updatedUser };
    setData(newData);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("authChange"));
  };

  return { 
    data, 
    isPending,
    logout,
    updateUser,
    isAuthenticated: !!data?.user,
    user: data?.user || null,
  };
}
