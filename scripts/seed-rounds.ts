import { db } from '../src/db';
import { rounds } from '../src/db/schema';

async function seedRounds() {
  console.log('🌱 Seeding competition rounds...');

  // Event dates: February 2-3, 2026
  const day1 = new Date('2026-02-02T10:00:00'); // Day 1: February 2, 2026
  const day2 = new Date('2026-02-03T10:00:00'); // Day 2: February 3, 2026

  const roundsData = [
    {
      name: 'QUIZ',
      day: 1,
      status: 'PENDING',
      startsAt: new Date(day1.getTime()), // 10:00 AM
      endsAt: new Date(day1.getTime() + 3 * 60 * 60 * 1000), // 1:00 PM (3 hours)
    },
    {
      name: 'VOTING',
      day: 2,
      status: 'PENDING',
      startsAt: new Date(day2.getTime()), // 10:00 AM
      endsAt: new Date(day2.getTime() + 2 * 60 * 60 * 1000), // 12:00 PM (2 hours)
    },
    {
      name: 'FINAL',
      day: 2,
      status: 'PENDING',
      startsAt: new Date(day2.getTime() + 2 * 60 * 60 * 1000), // 12:00 PM
      endsAt: new Date(day2.getTime() + 3 * 60 * 60 * 1000), // 1:00 PM (1 hour)
    },
  ];

  try {
    // Check if rounds already exist
    const existingRounds = await db.select().from(rounds);

    if (existingRounds.length > 0) {
      console.log('⚠ Rounds already exist. Skipping seed...');
      console.log(`Found ${existingRounds.length} existing rounds:`);
      existingRounds.forEach((round: any) => {
        console.log(`  - ${round.name} (Day ${round.day}) - Status: ${round.status}`);
      });
      return;
    }

    // Insert rounds
    for (const round of roundsData) {
      await db.insert(rounds).values({
        name: round.name,
        day: round.day,
        status: round.status,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✓ Created round: ${round.name} (Day ${round.day})`);
      console.log(`  Start: ${round.startsAt.toLocaleString()}`);
      console.log(`  End: ${round.endsAt.toLocaleString()}`);
    }

    console.log('\n✅ All rounds seeded successfully!');
    console.log('\n📅 Competition Schedule:');
    console.log('Day 1 (Feb 2, 2026): QUIZ (10:00 AM - 1:00 PM)');
    console.log('Day 2 (Feb 3, 2026): VOTING (10:00 AM - 12:00 PM), FINAL (12:00 PM - 1:00 PM)');

  } catch (error) {
    console.error('❌ Error seeding rounds:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedRounds();
