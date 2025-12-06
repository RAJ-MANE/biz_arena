import { useState, useEffect, useCallback } from "react";

interface CurrentRatingData {
  team: { id: number; name: string; college: string } | null;
  ratingActive: boolean;
  allPitchesCompleted: boolean;
  ratingCycleActive?: boolean;
  currentPhase?: 'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active';
  phaseTimeLeft?: number;
  cycleStartTime?: number | null;
}

export const useCentralizedTimer = () => {
  const [currentPitchTeam, setCurrentPitchTeam] = useState<CurrentRatingData['team']>(null);
  const [ratingActive, setRatingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [ratingCycleActive, setRatingCycleActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active'>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const pollRatingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/rating/current");
      if (!res.ok) {
        console.warn(`Failed to fetch rating status: ${res.status} ${res.statusText}`);
        return;
      }
      
      const data: CurrentRatingData = await res.json();
      const now = Date.now();
      
      // Only update if it's been at least 500ms since last update to prevent visual glitches
      if (now - lastUpdateTime < 500) {
        return;
      }
      
      setCurrentPitchTeam(data?.team ?? null);
      
      const newRatingCycleActive = data?.ratingCycleActive ?? false;
      const newCurrentPhase = data?.currentPhase ?? 'idle';
      const newPhaseTimeLeft = data?.phaseTimeLeft ?? 0;
      const newCycleStartTime = data?.cycleStartTime ?? null;
      
      // Only update state if values have actually changed to prevent unnecessary re-renders
      setRatingCycleActive(prev => prev !== newRatingCycleActive ? newRatingCycleActive : prev);
      setCurrentPhase(prev => prev !== newCurrentPhase ? newCurrentPhase : prev);
      setPhaseTimeLeft(prev => prev !== newPhaseTimeLeft ? newPhaseTimeLeft : prev);
      setCycleStartTime(prev => prev !== newCycleStartTime ? newCycleStartTime : prev);
      
      setRatingActive(data?.ratingActive ?? false);
      setAllPitchesCompleted(data?.allPitchesCompleted ?? false);
      
      setLastUpdateTime(now);
    } catch (error) {
      console.warn("Error polling rating status:", error);
    }
  }, [lastUpdateTime]);

  // Poll current rating status for real-time updates
  useEffect(() => {
    pollRatingStatus(); // Initial fetch
    const interval = setInterval(pollRatingStatus, 2000); // Poll every 2 seconds for smoother updates
    return () => clearInterval(interval);
  }, [pollRatingStatus]);

  // Note: Timer logic is now handled server-side in rating-state.ts
  // The client only polls for updates every 1 second to avoid conflicts
  // This prevents race conditions and ensures consistent state across all clients

  return {
    currentPitchTeam,
    ratingActive,
    allPitchesCompleted,
    ratingCycleActive,
    currentPhase,
    phaseTimeLeft,
    cycleStartTime,
    pollRatingStatus,
  };
};
