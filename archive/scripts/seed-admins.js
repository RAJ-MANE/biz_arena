const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Admin accounts with secure passwords
const adminAccounts = [
  {
    id: 'admin_001',
    username: 'admin1',
    password: 'TechSummit2025!Admin1',
  },
  {
    id: 'admin_002', 
    username: 'admin2',
    password: 'TechSummit2025!Admin2',
  },
  {
    id: 'admin_003',
    username: 'admin3', 
    password: 'TechSummit2025!Admin3',
  },
  {
    id: 'admin_004',
    username: 'admin4',
    password: 'TechSummit2025!Admin4',
  },
  {
    id: 'admin_005',
    username: 'admin5',
    password: 'TechSummit2025!Admin5',
  }
];

async function createAdminAccount(sql, account) {
  try {
    const existing = await sql`
      SELECT username FROM "admins" WHERE username = ${account.username}
    `;
    if (existing.length > 0) return;
    const hashedPassword = await bcrypt.hash(account.password, 12);
    await sql`
      INSERT INTO "admins" (id, username, password, created_at, updated_at) 
      VALUES (
        ${account.id},
        ${account.username},
        ${hashedPassword},
        NOW(),
        NOW()
      )
    `;
  } catch (error) {
    console.error(`Failed to create admin account ${account.username}:`, error.message);
  }
}

async function seedAdminAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  console.log('Connecting to database...');
  // Use permissive SSL to avoid certificate verification issues when connecting to
  // hosted Postgres services from local dev environments.
  const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

  try {
    try {
      await sql`SELECT 1 FROM "admins" LIMIT 1`;
    } catch (error) {
      await sql`
        CREATE TABLE IF NOT EXISTS "admins" (
          id VARCHAR(36) PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
    }

    for (const admin of adminAccounts) {
      console.log(`Seeding admin ${admin.username}`);
      await createAdminAccount(sql, admin);
    }
    console.log('Finished seeding admins');
  } catch (error) {
    console.error('Failed to seed admin accounts:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedAdminAccounts();

/* archived: seed-admins.js */
