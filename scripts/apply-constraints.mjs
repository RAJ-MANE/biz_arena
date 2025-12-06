import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL not set');
}

const sql = postgres(connectionString, { ssl: 'require' });

async function applyConstraints() {
  try {
    console.log('Applying database constraints...');
    
    const sqlFile = readFileSync(join(process.cwd(), 'drizzle', '0001_add_constraints.sql'), 'utf-8');
    const statements = sqlFile.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
        console.log('✓ Applied:', statement.trim().split('\n')[0].substring(0, 80) + '...');
      } catch (err) {
        // Ignore if constraint already exists
        if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
          console.log('⊙ Already exists:', statement.trim().split('\n')[0].substring(0, 60) + '...');
        } else {
          console.error('✗ Failed:', statement.trim().split('\n')[0].substring(0, 60));
          console.error('  Error:', err.message);
        }
      }
    }
    
    console.log('\n✅ Database constraints applied successfully!');
  } catch (error) {
    console.error('❌ Error applying constraints:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyConstraints();
