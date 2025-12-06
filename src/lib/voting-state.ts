import { votingEmitter } from '@/lib/voting-emitter';

type VotingTeam = { id: string | number; name: string } | null;

export const PITCH_SEC = 90;
export const PREP_SEC = 5;
export const VOTE_SEC = 30;

export let votingState: {
  team: VotingTeam;
  votingActive: boolean;
  allPitchesCompleted: boolean;
  pitchCycleActive: boolean;
  currentPhase: 'idle' | 'pitching' | 'preparing' | 'voting';
  phaseTimeLeft: number;
  cycleStartTime: number | null;
  phaseStartTime: number | null;
  // meta
  updatedAt: number;
  version: number;
} = {
  team: null,
  votingActive: false,
  allPitchesCompleted: false,
  pitchCycleActive: false,
  currentPhase: 'idle',
  phaseTimeLeft: 0,
  cycleStartTime: null,
  phaseStartTime: null,
  updatedAt: Date.now(),
  version: 1,
};

let votingTimeout: NodeJS.Timeout | null = null;
let tickInterval: NodeJS.Timeout | null = null;

function markStateChanged() {
  try {
    votingState.updatedAt = Date.now();
    votingState.version = (votingState.version || 0) + 1;
    votingEmitter.broadcast({ type: 'votingStateChanged', data: votingState });
  } catch (err) {
    console.error('Error broadcasting votingStateChanged:', err);
  }
}

export function setTeam(team: VotingTeam) {
  votingState.team = team;
  // clearing any running cycles when team changes is the current behavior
  votingState.votingActive = false;
  votingState.pitchCycleActive = false;
  votingState.currentPhase = 'idle';
  votingState.phaseStartTime = null;
  votingState.phaseTimeLeft = 0;
  votingState.cycleStartTime = null;
  if (votingTimeout) {
    clearTimeout(votingTimeout);
    votingTimeout = null;
  }
  markStateChanged();
}

export function startPitchCycle() {
  votingState.pitchCycleActive = true;
  votingState.currentPhase = 'pitching';
  votingState.cycleStartTime = Date.now();
  votingState.phaseStartTime = Date.now();
  votingState.phaseTimeLeft = PITCH_SEC;
  votingState.votingActive = false;
  if (votingTimeout) {
    clearTimeout(votingTimeout);
    votingTimeout = null;
  }
  markStateChanged();
}

export function startPrep() {
  if (!votingState.pitchCycleActive) return;
  votingState.currentPhase = 'preparing';
  votingState.phaseStartTime = Date.now();
  votingState.phaseTimeLeft = PREP_SEC;
  votingState.votingActive = false;
  if (votingTimeout) {
    clearTimeout(votingTimeout);
    votingTimeout = null;
  }
  markStateChanged();
}

export function startVotingPhase() {
  if (!votingState.pitchCycleActive) return;
  votingState.currentPhase = 'voting';
  votingState.phaseStartTime = Date.now();
  votingState.phaseTimeLeft = VOTE_SEC;
  votingState.votingActive = true;
  // ensure auto-disable after VOTE_SEC in case something goes wrong
  if (votingTimeout) {
    clearTimeout(votingTimeout);
  }
  votingTimeout = setTimeout(() => {
    if (votingState.votingActive && votingState.pitchCycleActive === false) {
      votingState.votingActive = false;
      markStateChanged();
    }
    votingTimeout = null;
  }, VOTE_SEC * 1000);
  markStateChanged();
}

export function stopPitchCycle() {
  votingState.pitchCycleActive = false;
  votingState.currentPhase = 'idle';
  votingState.phaseStartTime = null;
  votingState.phaseTimeLeft = 0;
  votingState.votingActive = false;
  votingState.cycleStartTime = null;
  if (votingTimeout) {
    clearTimeout(votingTimeout);
    votingTimeout = null;
  }
  markStateChanged();
}

// Manual voting control removed - votingActive is managed only via pitch cycle lifecycle

export function setAllPitchesCompleted(flag: boolean) {
  votingState.allPitchesCompleted = !!flag;
  markStateChanged();
}

function tick() {
  const now = Date.now();

  // Update pitch cycle timing if active
  if (votingState.pitchCycleActive && votingState.phaseStartTime) {
    const elapsed = Math.floor((now - votingState.phaseStartTime) / 1000);

    if (votingState.currentPhase === 'pitching') {
      if (elapsed < PITCH_SEC) {
        votingState.phaseTimeLeft = Math.max(0, PITCH_SEC - elapsed);
      } else {
        // transition to preparing
        votingState.currentPhase = 'preparing';
        votingState.phaseStartTime = now;
        votingState.phaseTimeLeft = PREP_SEC;
        markStateChanged();
      }
    } else if (votingState.currentPhase === 'preparing') {
      if (elapsed < PREP_SEC) {
        votingState.phaseTimeLeft = Math.max(0, PREP_SEC - elapsed);
      } else {
        // transition to voting
        votingState.currentPhase = 'voting';
        votingState.phaseStartTime = now;
        votingState.phaseTimeLeft = VOTE_SEC;
        votingState.votingActive = true;
        // set auto-disable for voting phase
        if (votingTimeout) clearTimeout(votingTimeout);
        votingTimeout = setTimeout(() => {
          // When voting phase times out, end cycle
          votingState.pitchCycleActive = false;
          votingState.currentPhase = 'idle';
          votingState.phaseStartTime = null;
          votingState.phaseTimeLeft = 0;
          votingState.votingActive = false;
          votingState.cycleStartTime = null;
          votingTimeout = null;
          markStateChanged();
        }, VOTE_SEC * 1000);
        markStateChanged();
      }
    } else if (votingState.currentPhase === 'voting') {
      if (elapsed < VOTE_SEC) {
        votingState.phaseTimeLeft = Math.max(0, VOTE_SEC - elapsed);
      } else {
        // should be handled by the timeout above, but guard anyway
        votingState.pitchCycleActive = false;
        votingState.currentPhase = 'idle';
        votingState.phaseStartTime = null;
        votingState.phaseTimeLeft = 0;
        votingState.votingActive = false;
        votingState.cycleStartTime = null;
        markStateChanged();
      }
    }
  }

  // Manual voting control removed - no separate manual countdown outside of pitch cycle
}

function startTicker() {
  if (tickInterval) return;
  tickInterval = setInterval(tick, 1000);
  console.log('Voting state ticker started');
}

// Start ticker on import so the server keeps authoritative time (single-process assumption)
startTicker();

export function getVotingState() {
  return votingState;
}
