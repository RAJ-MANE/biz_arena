import { db } from '@/db';
import { ratingState as ratingStateTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ratingEmitter } from './rating-emitter';

export const PITCH_SEC = 300; // 5 minutes
export const WARNING_SEC = 5;
export const RATING_SEC = 120; // 2 minutes

// Ensure single canonical row
async function ensureRow(): Promise<void> {
  const rows = await db.select().from(ratingStateTable).limit(1);
  if (rows.length === 0) {
    await db.insert(ratingStateTable).values({});
  }
}

// Return the primary id of the singleton rating_state row; create it if missing
async function getSingletonId(): Promise<number> {
  const rows = await db.select().from(ratingStateTable).limit(1);
  if (rows.length === 0) {
    const res = await db.insert(ratingStateTable).values({}).returning({ id: ratingStateTable.id });
    // res may be an array with one element containing the id
    return (res && res[0] && (res[0] as any).id) || 1;
  }
  return (rows[0] as any).id;
}

async function broadcastCurrentState() {
  try {
    const state = await getRatingStateFromDb();
    ratingEmitter.broadcast({ type: 'ratingStateChanged', data: state });
  } catch (err) {
    console.error('Error broadcasting rating state:', err);
  }
}

export async function getRatingStateFromDb() {
  await ensureRow();
  const rows = await db.select().from(ratingStateTable).limit(1);
  const row: any = rows[0];

  const now = Date.now();
  let phaseTimeLeft = 0;

  if (row.ratingCycleActive && row.phaseStartTs) {
    const elapsed = Math.floor((now - new Date(row.phaseStartTs).getTime()) / 1000);
    if (row.currentPhase === 'pitching') {
      phaseTimeLeft = Math.max(0, PITCH_SEC - elapsed);
    } else if (row.currentPhase === 'rating-warning') {
      phaseTimeLeft = Math.max(0, WARNING_SEC - elapsed);
    } else if (row.currentPhase === 'rating-active') {
      phaseTimeLeft = Math.max(0, RATING_SEC - elapsed);
    }
  }

  return {
    team: row.currentTeamId ? { id: row.currentTeamId, name: row.currentTeamName } : null,
    ratingActive: !!row.ratingActive,
    allPitchesCompleted: !!row.allPitchesCompleted,
    ratingCycleActive: !!row.ratingCycleActive,
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
    values.ratingCycleActive = false;
    values.ratingActive = false;
    values.currentPhase = 'idle';
    values.cycleStartTs = null;
    values.phaseStartTs = null;
  } else {
    values.currentTeamId = null;
    values.currentTeamName = null;
    values.ratingCycleActive = false;
    values.ratingActive = false;
    values.currentPhase = 'idle';
    values.cycleStartTs = null;
    values.phaseStartTs = null;
  }
  values.updated_at = new Date();
  values.updatedAt = new Date();
  const id = await getSingletonId();
  await db.update(ratingStateTable).set(values).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function setAllPitchesCompletedInDb(flag: boolean) {
  await ensureRow();
  const id = await getSingletonId();
  await db.update(ratingStateTable).set({ allPitchesCompleted: flag, updatedAt: new Date() }).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function startRatingCycleInDb(teamId?: number, teamName?: string) {
  await ensureRow();
  const now = new Date();
  const values: any = {
    ratingCycleActive: true,
    currentPhase: 'pitching',
    cycleStartTs: now,
    phaseStartTs: now,
    ratingActive: false,
    updatedAt: now,
  };
  if (teamId) values.currentTeamId = teamId;
  if (teamName) values.currentTeamName = teamName;
  const id = await getSingletonId();
  await db.update(ratingStateTable).set(values).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function stopRatingCycleInDb() {
  await ensureRow();
  const id = await getSingletonId();
  await db.update(ratingStateTable).set({ ratingCycleActive: false, currentPhase: 'idle', phaseStartTs: null, cycleStartTs: null, ratingActive: false, updatedAt: new Date() }).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function startQnaPauseInDb() {
  await ensureRow();
  const now = new Date();
  const id = await getSingletonId();
  await db.update(ratingStateTable).set({ currentPhase: 'qna-pause', phaseStartTs: now, ratingActive: false, updatedAt: now }).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function startRatingWarningInDb() {
  await ensureRow();
  const now = new Date();
  const id = await getSingletonId();
  await db.update(ratingStateTable).set({ currentPhase: 'rating-warning', phaseStartTs: now, ratingActive: false, updatedAt: now }).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function startRatingPhaseInDb() {
  await ensureRow();
  const now = new Date();
  const id = await getSingletonId();
  await db.update(ratingStateTable).set({ currentPhase: 'rating-active', phaseStartTs: now, ratingActive: true, updatedAt: now }).where(eq(ratingStateTable.id, id));
  await broadcastCurrentState();
}

export async function maybeAdvancePhaseOnRead() {
  await ensureRow();
  const rows = await db.select().from(ratingStateTable).limit(1);
  const row: any = rows[0];
  if (!row || !row.ratingCycleActive || !row.phaseStartTs) return;

  const now = Date.now();
  const phase = row.currentPhase;
  const elapsed = Math.floor((now - new Date(row.phaseStartTs).getTime()) / 1000);

  if (phase === 'pitching' && elapsed >= PITCH_SEC) {
    // move to qna-pause
    await startQnaPauseInDb();
  } else if (phase === 'rating-warning' && elapsed >= WARNING_SEC) {
    await startRatingPhaseInDb();
  } else if (phase === 'rating-active' && elapsed >= RATING_SEC) {
    await stopRatingCycleInDb();
  }
}
