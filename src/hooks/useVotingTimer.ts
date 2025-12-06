"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVotingSSE } from './useVotingSSE';

interface VotingTimerState {
  team: any | null;
  votingActive: boolean;
  allPitchesCompleted: boolean;
  pitchCycleActive: boolean;
  currentPhase: 'idle' | 'pitching' | 'preparing' | 'voting';
  phaseTimeLeft: number;
  cycleStartTime: number | null;
}

export function useVotingTimer(pollInterval = 2000) {
  const { isConnected, lastEvent } = useVotingSSE();
  const [state, setState] = useState<VotingTimerState>({
    team: null,
    votingActive: false,
    allPitchesCompleted: false,
    pitchCycleActive: false,
    currentPhase: 'idle',
    phaseTimeLeft: 0,
    cycleStartTime: null,
  });

  const lastUpdateRef = useRef(0);

  const poll = useCallback(async () => {
    try {
      let res = await fetch('/api/voting/current');
      let data: any = null;
      if (res.ok) {
        data = await res.json();
      }

      // fallback to rating endpoint if voting current has no team (supports final round compatibility)
      if (!data?.team) {
        try {
          const ratingRes = await fetch('/api/rating/current');
          if (ratingRes.ok) {
            const ratingData = await ratingRes.json();
            if (ratingData?.team) {
              // Map rating fields to voting style fields
              data = {
                team: ratingData.team,
                votingActive: ratingData.ratingActive,
                allPitchesCompleted: ratingData.allPitchesCompleted,
                pitchCycleActive: ratingData.ratingCycleActive,
                currentPhase: ratingData.currentPhase === 'pitching' ? 'pitching' :
                              ratingData.currentPhase === 'rating-active' ? 'voting' :
                              ratingData.currentPhase === 'preparing' ? 'preparing' :
                              'idle',
                phaseTimeLeft: ratingData.phaseTimeLeft,
                cycleStartTime: ratingData.cycleStartTime,
              };
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (!data) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 400) return;
      lastUpdateRef.current = now;

      setState(prev => {
        if (
          prev.team?.id === data.team?.id &&
          prev.votingActive === !!data.votingActive &&
          prev.pitchCycleActive === !!data.pitchCycleActive &&
          prev.currentPhase === (data.currentPhase ?? prev.currentPhase) &&
          prev.phaseTimeLeft === (data.phaseTimeLeft ?? prev.phaseTimeLeft)
        ) {
          return prev;
        }

        return {
          team: data.team ?? null,
          votingActive: !!data.votingActive,
          allPitchesCompleted: !!data.allPitchesCompleted,
          pitchCycleActive: !!data.pitchCycleActive,
          currentPhase: data.currentPhase ?? 'idle',
          phaseTimeLeft: typeof data.phaseTimeLeft === 'number' ? data.phaseTimeLeft : 0,
          cycleStartTime: typeof data.cycleStartTime === 'number' ? data.cycleStartTime : null,
        };
      });
    } catch (err) {
      console.warn('useVotingTimer poll error', err);
    }
  }, []);

  // React to SSE events for faster updates
  useEffect(() => {
    if (!lastEvent) return;
    try {
      if (lastEvent.type === 'connected') {
        // SSE reconnected — fetch authoritative snapshot immediately
        poll();
        return;
      }

      if (lastEvent.type === 'votingStateChanged' || lastEvent.type === 'teamChanged') {
        const data = lastEvent.data || {};
        setState(prev => ({
          team: data.team ?? prev.team,
          votingActive: typeof data.votingActive === 'boolean' ? data.votingActive : prev.votingActive,
          allPitchesCompleted: typeof data.allPitchesCompleted === 'boolean' ? data.allPitchesCompleted : prev.allPitchesCompleted,
          pitchCycleActive: typeof data.pitchCycleActive === 'boolean' ? data.pitchCycleActive : prev.pitchCycleActive,
          currentPhase: data.currentPhase ?? prev.currentPhase,
          phaseTimeLeft: typeof data.phaseTimeLeft === 'number' ? data.phaseTimeLeft : prev.phaseTimeLeft,
          cycleStartTime: typeof data.cycleStartTime === 'number' ? data.cycleStartTime : prev.cycleStartTime,
        }));
      }
    } catch (e) {
      console.warn('useVotingTimer SSE handling error', e);
    }
  }, [lastEvent]);

  useEffect(() => {
    // Adaptive polling: increase interval on mobile and when page is hidden
    if (typeof window === 'undefined') {
      poll();
      return;
    }

    const mobile = window.matchMedia('(max-width: 767px)').matches;
    let interval = pollInterval;
    if (mobile) interval = Math.max(4000, pollInterval * 2);

    let currentInterval = interval;
    let id: any = null;

    const startTimer = () => {
      // run an immediate poll then schedule
      poll();
      id = setInterval(poll, currentInterval);
    };

    const stopTimer = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        // when hidden, slow down polling substantially
        stopTimer();
        currentInterval = Math.max(10000, interval * 5);
        id = setInterval(poll, currentInterval);
      } else {
        stopTimer();
        currentInterval = mobile ? Math.max(4000, pollInterval * 2) : pollInterval;
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibility as any);
    };
  }, [poll, pollInterval]);

  return {
    currentPitchTeam: state.team,
    votingActive: state.votingActive,
    allPitchesCompleted: state.allPitchesCompleted,
    pitchCycleActive: state.pitchCycleActive,
    currentPhase: state.currentPhase,
    phaseTimeLeft: state.phaseTimeLeft,
    cycleStartTime: state.cycleStartTime,
    sseConnected: isConnected,
    poll
  };
}
