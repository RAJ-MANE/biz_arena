"use client"

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRatingSSE } from './useRatingSSE';

interface RatingTimerState {
  currentPitchTeam: any | null;
  ratingActive: boolean;
  allPitchesCompleted: boolean;
  ratingCycleActive: boolean;
  currentPhase: string;
  phaseTimeLeft: number;
  cycleStartTime: number | null;
}

export function useRatingTimer(pollInterval = 2000) {
  const { isConnected, lastEvent } = useRatingSSE();
  const [state, setState] = useState<RatingTimerState>({
    currentPitchTeam: null,
    ratingActive: false,
    allPitchesCompleted: false,
    ratingCycleActive: false,
    currentPhase: 'idle',
    phaseTimeLeft: 0,
    cycleStartTime: null,
  });

  const lastUpdateRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/rating/current');
      if (!res.ok) return;
      const data = await res.json();

      // throttle client-side updates to avoid visual glitches on rapid reconnects
      const now = Date.now();
      if (now - lastUpdateRef.current < 400) return;
      lastUpdateRef.current = now;

      setState(prev => {
        // Only update when values changed to reduce re-renders
        if (
          prev.currentPitchTeam?.id === data.team?.id &&
          prev.ratingActive === !!data.ratingActive &&
          prev.ratingCycleActive === !!data.ratingCycleActive &&
          prev.currentPhase === (data.currentPhase ?? prev.currentPhase) &&
          prev.phaseTimeLeft === (data.phaseTimeLeft ?? prev.phaseTimeLeft)
        ) {
          return prev;
        }

        return {
          currentPitchTeam: data.team ?? null,
          ratingActive: !!data.ratingActive,
          allPitchesCompleted: !!data.allPitchesCompleted,
          ratingCycleActive: !!data.ratingCycleActive,
          currentPhase: data.currentPhase ?? 'idle',
          phaseTimeLeft: typeof data.phaseTimeLeft === 'number' ? data.phaseTimeLeft : 0,
          cycleStartTime: typeof data.cycleStartTime === 'number' ? data.cycleStartTime : null,
        };
      });
    } catch (err) {
      // swallow - will retry on next interval or SSE
      console.warn('useRatingTimer poll error', err);
    }
  }, []);

  // React to SSE events for faster updates
  useEffect(() => {
    if (!lastEvent) return;
    try {
      if (lastEvent.type === 'connected') {
        poll();
        return;
      }

      if (lastEvent.type === 'ratingStateChanged' || lastEvent.type === 'teamChanged') {
        const data = lastEvent.data || {};
        setState(prev => ({
          currentPitchTeam: data.team ?? prev.currentPitchTeam,
          ratingActive: typeof data.ratingActive === 'boolean' ? data.ratingActive : prev.ratingActive,
          allPitchesCompleted: typeof data.allPitchesCompleted === 'boolean' ? data.allPitchesCompleted : prev.allPitchesCompleted,
          ratingCycleActive: typeof data.ratingCycleActive === 'boolean' ? data.ratingCycleActive : prev.ratingCycleActive,
          currentPhase: data.currentPhase ?? prev.currentPhase,
          phaseTimeLeft: typeof data.phaseTimeLeft === 'number' ? data.phaseTimeLeft : prev.phaseTimeLeft,
          cycleStartTime: typeof data.cycleStartTime === 'number' ? data.cycleStartTime : prev.cycleStartTime,
        }));
      }
    } catch (e) {
      console.warn('useRatingTimer SSE handling error', e);
    }
  }, [lastEvent]);

  // adaptive polling fallback: increase interval on mobile and when page is hidden
  useEffect(() => {
    if (typeof window === 'undefined') {
      poll();
      return;
    }

    const mobile = window.matchMedia('(max-width: 767px)').matches;
    let interval = pollInterval;
    if (mobile) interval = Math.max(4000, pollInterval * 2);

    let id: any = null;
    const start = () => {
      poll();
      id = setInterval(poll, interval);
    };

    const stop = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      stop();
      if (document.hidden) {
        // when hidden, slow polling to reduce CPU/network
        id = setInterval(poll, Math.max(10000, interval * 5));
      } else {
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility, { passive: true });

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility as any);
    };
  }, [poll, pollInterval]);

  // Client-side 1s tick for smooth countdown between server updates.
  // This improves perceived responsiveness for admin/judge/final consoles.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startTick = () => {
      if (tickRef.current) return;
      tickRef.current = window.setInterval(() => {
        setState(prev => {
          // Only tick when a rating cycle is active and there is remaining time.
          if (!prev.ratingCycleActive || typeof prev.phaseTimeLeft !== 'number' || prev.phaseTimeLeft <= 0) return prev;
          const next = Math.max(0, Math.floor(prev.phaseTimeLeft) - 1);
          return { ...prev, phaseTimeLeft: next };
        });
      }, 1000) as unknown as number;
    };

    const stopTick = () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stopTick();
      } else {
        // resume tick if cycle active
        setTimeout(() => {
          setState(prev => prev); // trigger re-read of state in effect
          if (state.ratingCycleActive && state.phaseTimeLeft > 0) startTick();
        }, 50);
      }
    };

    // Start tick when a cycle is active and there's time remaining and page is visible
    if (state.ratingCycleActive && state.phaseTimeLeft > 0 && !document.hidden) {
      startTick();
    }

    document.addEventListener('visibilitychange', onVisibility, { passive: true });

    return () => {
      stopTick();
      document.removeEventListener('visibilitychange', onVisibility as any);
    };
  }, [state.ratingCycleActive, state.phaseTimeLeft]);

  return {
    ...state,
    sseConnected: isConnected,
    poll,
  };
}
