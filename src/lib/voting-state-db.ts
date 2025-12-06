import { db } from '@/db';
import { votingState as votingStateTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { votingEmitter } from './voting-emitter';

export const PITCH_SEC = 90;
export const PREP_SEC = 5;
export const VOTE_SEC = 30;

type VotingStateRow = {
  id: number;
  currentTeamId: number | null;
  currentTeamName: string | null;
  pitchCycleActive: boolean;
  votingActive: boolean;
  allPitchesCompleted: boolean;
  currentPhase: string;
  cycleStartTs: Date | null;
  phaseStartTs: Date | null;
  updatedAt: Date;
};

// Ensure a single canonical row exists. If not, create one.
async function ensureRow(): Promise<void> {
  const rows = await db.select().from(votingStateTable).limit(1);
  if (rows.length === 0) {
    await db.insert(votingStateTable).values({});
  }
}

// Helper: broadcast the current computed voting state via SSE emitter
async function broadcastCurrentState() {
  try {
    const state = await getVotingStateFromDb();
    votingEmitter.broadcast({ type: 'votingState', data: state });
  } catch (err) {
    // Non-fatal: log and continue
    console.error('Error broadcasting voting state:', err);
  }
}

export async function getVotingStateFromDb() {
  await ensureRow();
  const rows = await db.select().from(votingStateTable).limit(1);
  const row: any = rows[0];

  const now = Date.now();

  // Compute derived values
  let phaseTimeLeft = 0;
  if (row.pitchCycleActive && row.phaseStartTs) {
    const elapsed = Math.floor((now - new Date(row.phaseStartTs).getTime()) / 1000);
    if (row.currentPhase === 'pitching') {
      phaseTimeLeft = Math.max(0, PITCH_SEC - elapsed);
    } else if (row.currentPhase === 'preparing') {
      phaseTimeLeft = Math.max(0, PREP_SEC - elapsed);
    } else if (row.currentPhase === 'voting') {
      phaseTimeLeft = Math.max(0, VOTE_SEC - elapsed);
    }
  }

  return {
    team: row.currentTeamId ? { id: row.currentTeamId, name: row.currentTeamName } : null,
    votingActive: !!row.votingActive,
    allPitchesCompleted: !!row.allPitchesCompleted,
    pitchCycleActive: !!row.pitchCycleActive,
    currentPhase: row.currentPhase || 'idle',
    phaseTimeLeft,
    cycleStartTime: row.cycleStartTs ? new Date(row.cycleStartTs).getTime() : null,
    phaseStartTime: row.phaseStartTs ? new Date(row.phaseStartTs).getTime() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).getTime() : Date.now(),
  };
}

export async function setTeamInDb(team: { id: number | string; name: string } | null) {
  await ensureRow();
  const values: any = {};
  if (team) {
    values.currentTeamId = typeof team.id === 'string' ? parseInt(team.id, 10) : team.id;
    values.currentTeamName = team.name;
    // Reset cycle when team changes
    values.pitchCycleActive = false;
    values.votingActive = false;
    values.currentPhase = 'idle';
    values.cycleStartTs = null;
    values.phaseStartTs = null;
  } else {
    values.currentTeamId = null;
    values.currentTeamName = null;
    values.pitchCycleActive = false;
    values.votingActive = false;
    values.currentPhase = 'idle';
    values.cycleStartTs = null;
    values.phaseStartTs = null;
  }
  values.updatedAt = new Date();
  await db.update(votingStateTable).set(values).where(eq(votingStateTable.id, 1));
  // Notify SSE clients of the change
  await broadcastCurrentState();
}

export async function setAllPitchesCompletedInDb(flag: boolean) {
  await ensureRow();
  await db.update(votingStateTable).set({ allPitchesCompleted: flag, updatedAt: new Date() }).where(eq(votingStateTable.id, 1));
  await broadcastCurrentState();
}

export async function startPitchCycleInDb(teamId?: number, teamName?: string) {
  await ensureRow();
  const now = new Date();
  const values: any = {
    pitchCycleActive: true,
    currentPhase: 'pitching',
    cycleStartTs: now,
    phaseStartTs: now,
    votingActive: false,
    updatedAt: now
  };
  if (teamId) values.currentTeamId = teamId;
  if (teamName) values.currentTeamName = teamName;
  await db.update(votingStateTable).set(values).where(eq(votingStateTable.id, 1));
  await broadcastCurrentState();
}

export async function stopPitchCycleInDb() {
  await ensureRow();
  await db.update(votingStateTable).set({ pitchCycleActive: false, currentPhase: 'idle', phaseStartTs: null, cycleStartTs: null, votingActive: false, updatedAt: new Date() }).where(eq(votingStateTable.id, 1));
  await broadcastCurrentState();
}

// Advance phase to preparing (internal helper)
export async function startPrepInDb() {
  await ensureRow();
  const now = new Date();
  await db.update(votingStateTable).set({ currentPhase: 'preparing', phaseStartTs: now, updatedAt: now }).where(eq(votingStateTable.id, 1));
  await broadcastCurrentState();
}

export async function startVotingPhaseInDb() {
  await ensureRow();
  const now = new Date();
  await db.update(votingStateTable).set({ currentPhase: 'voting', phaseStartTs: now, votingActive: true, updatedAt: now }).where(eq(votingStateTable.id, 1));
  await broadcastCurrentState();
}

export async function maybeAdvancePhaseOnRead() {
  // When reading state, compute elapsed and if phase should have transitioned, update DB.
  await ensureRow();
  const rows = await db.select().from(votingStateTable).limit(1);
  const row: any = rows[0];
  if (!row || !row.pitchCycleActive || !row.phaseStartTs) return;

  const now = Date.now();
  const phase = row.currentPhase;
  const elapsed = Math.floor((now - new Date(row.phaseStartTs).getTime()) / 1000);

  if (phase === 'pitching' && elapsed >= PITCH_SEC) {
    // move to preparing
    await startPrepInDb();
  } else if (phase === 'preparing' && elapsed >= PREP_SEC) {
    await startVotingPhaseInDb();
  } else if (phase === 'voting' && elapsed >= VOTE_SEC) {
    // end cycle
    await stopPitchCycleInDb();
  }
}
