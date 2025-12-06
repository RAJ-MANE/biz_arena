import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: 'require' });

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing all data from database...\n');
    
    // Delete in order to respect foreign key constraints
    console.log('Deleting token conversions...');
    const tokenConversions = await sql`DELETE FROM token_conversions`;
    console.log(`✓ Deleted ${tokenConversions.count} token conversion records`);
    
    console.log('Deleting votes...');
    const votes = await sql`DELETE FROM votes`;
    console.log(`✓ Deleted ${votes.count} vote records`);
    
    console.log('Deleting round3 judge ratings...');
    const round3JudgeRatings = await sql`DELETE FROM round3_judge_ratings`;
    console.log(`✓ Deleted ${round3JudgeRatings.count} round3 judge rating records`);
    
    console.log('Deleting round3 peer ratings...');
    const round3PeerRatings = await sql`DELETE FROM round3_peer_ratings`;
    console.log(`✓ Deleted ${round3PeerRatings.count} round3 peer rating records`);
    
    console.log('Deleting judge scores...');
    const judgeScores = await sql`DELETE FROM judge_scores`;
    console.log(`✓ Deleted ${judgeScores.count} judge score records`);
    
    console.log('Deleting peer ratings...');
    const peerRatings = await sql`DELETE FROM peer_ratings`;
    console.log(`✓ Deleted ${peerRatings.count} peer rating records`);
    
    console.log('Deleting final pitches...');
    const finalPitches = await sql`DELETE FROM final_pitches`;
    console.log(`✓ Deleted ${finalPitches.count} final pitch records`);
    
    console.log('Deleting pitches...');
    const pitches = await sql`DELETE FROM pitches`;
    console.log(`✓ Deleted ${pitches.count} pitch records`);
    
    console.log('Deleting quiz submissions...');
    const quizSubmissions = await sql`DELETE FROM quiz_submissions`;
    console.log(`✓ Deleted ${quizSubmissions.count} quiz submission records`);
    
    console.log('Deleting options...');
    const options = await sql`DELETE FROM options`;
    console.log(`✓ Deleted ${options.count} option records`);
    
    console.log('Deleting questions...');
    const questions = await sql`DELETE FROM questions`;
    console.log(`✓ Deleted ${questions.count} question records`);
    
    console.log('Deleting voting state...');
    const votingState = await sql`DELETE FROM voting_state`;
    console.log(`✓ Deleted ${votingState.count} voting state records`);
    
    console.log('Deleting rating state...');
    const ratingState = await sql`DELETE FROM rating_state`;
    console.log(`✓ Deleted ${ratingState.count} rating state records`);
    
    console.log('Deleting rounds...');
    const rounds = await sql`DELETE FROM rounds`;
    console.log(`✓ Deleted ${rounds.count} round records`);
    
    console.log('Deleting accounts...');
    const accounts = await sql`DELETE FROM account`;
    console.log(`✓ Deleted ${accounts.count} account records`);
    
    console.log('Deleting sessions...');
    const sessions = await sql`DELETE FROM session`;
    console.log(`✓ Deleted ${sessions.count} session records`);
    
    console.log('Deleting verification records...');
    const verifications = await sql`DELETE FROM verification`;
    console.log(`✓ Deleted ${verifications.count} verification records`);
    
    console.log('Deleting users...');
    const users = await sql`DELETE FROM "user"`;
    console.log(`✓ Deleted ${users.count} user records`);
    
    console.log('Deleting teams...');
    const teams = await sql`DELETE FROM teams`;
    console.log(`✓ Deleted ${teams.count} team records`);
    
    console.log('Deleting judges...');
    const judges = await sql`DELETE FROM judges`;
    console.log(`✓ Deleted ${judges.count} judge records`);
    
    console.log('Deleting admins...');
    const admins = await sql`DELETE FROM admins`;
    console.log(`✓ Deleted ${admins.count} admin records`);
    
    console.log('Deleting system settings...');
    const settings = await sql`DELETE FROM system_settings`;
    console.log(`✓ Deleted ${settings.count} system setting records`);
    
    console.log('\n✅ Database cleared successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - All user data removed`);
    console.log(`   - All team data removed`);
    console.log(`   - All quiz/voting/rating data removed`);
    console.log(`   - All admin/judge accounts removed`);
    console.log(`   - Database schema and constraints preserved`);
    
  } catch (error) {
    console.error('\n❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

clearDatabase();
