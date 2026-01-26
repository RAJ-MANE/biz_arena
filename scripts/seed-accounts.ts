import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/db';
import { admins, judges } from '../src/db/schema';
import { hashSync } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedAccounts() {
  console.log('🌱 Seeding admin and judge accounts...');

  // Admin accounts
  const adminAccounts = [
    { username: 'admin1', password: 'Admin@2026#1' },
    { username: 'admin2', password: 'Admin@2026#2' },
    { username: 'admin3', password: 'Admin@2026#3' },
    { username: 'admin4', password: 'Admin@2026#4' },
    { username: 'admin5', password: 'Admin@2026#5' },
  ];

  // Judge accounts
  const judgeAccounts = [
    { username: 'judge1', name: 'Judge One', password: 'Judge@2026#1' },
    { username: 'judge2', name: 'Judge Two', password: 'Judge@2026#2' },
    { username: 'judge3', name: 'Judge Three', password: 'Judge@2026#3' },
    { username: 'judge4', name: 'Judge Four', password: 'Judge@2026#4' },
    { username: 'judge5', name: 'Judge Five', password: 'Judge@2026#5' },
  ];

  try {
    // Insert admins
    console.log('Creating admin accounts...');
    for (const admin of adminAccounts) {
      const hashedPassword = hashSync(admin.password, 12);
      const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if admin already exists
      const existing = await db.select().from(admins).where(eq(admins.username, admin.username));
      if (existing.length > 0) {
        console.log(`⚠ Admin ${admin.username} already exists, skipping...`);
        continue;
      }

      await db.insert(admins).values({
        id: adminId,
        username: admin.username,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✓ Created admin: ${admin.username} with password: ${admin.password}`);
      // Add small delay to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Insert judges
    console.log('\nCreating judge accounts...');
    for (const judge of judgeAccounts) {
      const hashedPassword = hashSync(judge.password, 12);
      const judgeId = `judge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if judge already exists
      const existing = await db.select().from(judges).where(eq(judges.username, judge.username));
      if (existing.length > 0) {
        console.log(`⚠ Judge ${judge.username} already exists, skipping...`);
        continue;
      }

      await db.insert(judges).values({
        id: judgeId,
        username: judge.username,
        name: judge.name,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✓ Created judge: ${judge.username} (${judge.name}) with password: ${judge.password}`);
      // Add small delay to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('\n✅ All accounts seeded successfully!');
    console.log('\n📝 Credentials saved to README.md');

  } catch (error) {
    console.error('❌ Error seeding accounts:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedAccounts();
