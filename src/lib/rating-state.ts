// Migration note: this module used to keep an in-memory ticker and mutable state.
// We've moved to a DB-backed canonical `rating_state` row for serverless safety.
// To maintain backward compatibility for imports, this file now exposes the
// same public functions but proxies them to the DB-backed helpers.

import {
  getRatingStateFromDb,
  setTeamInDb,
  startRatingCycleInDb,
  startQnaPauseInDb,
  startRatingWarningInDb,
  startRatingPhaseInDb,
  stopRatingCycleInDb,
  setAllPitchesCompletedInDb,
  maybeAdvancePhaseOnRead,
} from './rating-state-db';

export const PITCH_SEC = 300;
export const WARNING_SEC = 5;
export const RATING_SEC = 120;

export async function getRatingState() {
  try {
    await maybeAdvancePhaseOnRead();
  } catch (err) {
    console.error('Error advancing rating phase on read (shim):', err);
  }
  return await getRatingStateFromDb();
}

export async function setTeam(team: { id: number | string; name: string } | null) {
  return await setTeamInDb(team);
}

export async function startRatingCycle() {
  return await startRatingCycleInDb();
}

export async function startQnaPause() {
  return await startQnaPauseInDb();
}

export async function startRatingWarning() {
  return await startRatingWarningInDb();
}

export async function startRatingPhase() {
  return await startRatingPhaseInDb();
}

export async function stopRatingCycle() {
  return await stopRatingCycleInDb();
}

export async function setAllPitchesCompleted(flag: boolean) {
  return await setAllPitchesCompletedInDb(flag);
}

// legacy API: setRatingActiveManually is not directly supported in DB-backed model
// but exposing a compatibility function that updates rating_active flag.
export async function setRatingActiveManually(active: boolean) {
  // best-effort: flip rating_active and updated_at; for timed expiry, callers
  // should prefer startRatingPhase which sets timestamps.
  const { db } = await import('@/db');
  const { ratingState } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const updates: any = { rating_active: !!active, updated_at: new Date() };
  await db.update(ratingState).set(updates).where(eq(ratingState.id, 1));
  const updated = await getRatingStateFromDb();
  // broadcast is handled by rating-state-db helpers where possible; do explicit broadcast here
  const { ratingEmitter } = await import('./rating-emitter');
  ratingEmitter.broadcast({ type: 'ratingStateChanged', data: updated });
  return updated;
}

const ratingStateShim = {
  getRatingState,
  setTeam,
  startRatingCycle,
  startQnaPause,
  startRatingWarning,
  startRatingPhase,
  stopRatingCycle,
  setAllPitchesCompleted,
  setRatingActiveManually,
};

export default ratingStateShim;
