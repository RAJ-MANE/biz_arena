require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL is not defined in .env.local');
        process.exit(1);
    }

    console.log('Testing connection to:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password

    const sql = postgres(connectionString, {
        ssl: 'require', // Assume production-like for now, or make flexible
        connect_timeout: 10,
    });

    try {
        const result = await sql`SELECT NOW()`;
        console.log('✅ Connection Successful!', result[0].now);

        // Check if tables exist
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

        console.log('\nExisting Tables:');
        const tableNames = tables.map(t => t.table_name);
        tableNames.forEach(t => console.log(` - ${t}`));

        if (!tableNames.includes('teams') || !tableNames.includes('user')) {
            console.warn('\n⚠️ WARNING: Core tables (teams, user) seems to be missing!');
            console.warn('   Run "npm run db:migrate" or "npx drizzle-kit migrate" to push schema.');
        } else {
            console.log('\n✅ Core schema tables found.');
        }

    } catch (error) {
        console.error('\n❌ Connection Failed:', error.message);
        if (error.message.includes('SSL')) {
            console.log('   Hint: Try disabling SSL or ensuring ?sslmode=require is in the URL if needed.');
        }
    } finally {
        await sql.end();
    }
}

testConnection();
