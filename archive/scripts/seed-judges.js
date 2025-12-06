const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const judgeAccounts = [
  { id: 'judge_001', username: 'judge1', name: 'Judge User 1', password: 'TechSummit2025!Judge1' },
  { id: 'judge_002', username: 'judge2', name: 'Judge User 2', password: 'TechSummit2025!Judge2' },
  { id: 'judge_003', username: 'judge3', name: 'Judge User 3', password: 'TechSummit2025!Judge3' },
  { id: 'judge_004', username: 'judge4', name: 'Judge User 4', password: 'TechSummit2025!Judge4' },
  { id: 'judge_005', username: 'judge5', name: 'Judge User 5', password: 'TechSummit2025!Judge5' }
];

async function createJudgeAccount(sql, account) {
  try {
    const existing = await sql`SELECT username FROM "judges" WHERE username = ${account.username}`;
    if (existing.length > 0) return;
    const hashedPassword = await bcrypt.hash(account.password, 12);
    await sql`
      INSERT INTO "judges" (id, username, name, password, created_at, updated_at)
      VALUES (${account.id}, ${account.username}, ${account.name}, ${hashedPassword}, NOW(), NOW())
    `;
  } catch (error) {
    console.error(`Failed to create judge account ${account.username}:`, error.message);
  }
}

async function seedJudgeAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  console.log('Connecting to database...');
  // Some hosted Postgres providers (Supabase, etc.) require SSL. Use permissive SSL
  // so this script can run from local dev environments without failing on cert checks.
  const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
  try {
    try { await sql`SELECT 1 FROM "judges" LIMIT 1`; } catch (error) {
      await sql`CREATE TABLE IF NOT EXISTS "judges" (id VARCHAR(36) PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW())`;
    }
    for (const judge of judgeAccounts) {
      console.log(`Seeding judge ${judge.username}`);
      await createJudgeAccount(sql, judge);
    }
    console.log('Finished seeding judges');
  } catch (error) {
    console.error('Failed to seed judge accounts:', error.message);
    process.exit(1);
  } finally { await sql.end(); }
}

seedJudgeAccounts();

/* archived: seed-judges.js */
