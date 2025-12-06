import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: 'require' });

async function fixNegativeTokens() {
  try {
    console.log('Fixing negative token balances...');
    
    // Fix any negative remaining tokens to 0
    await sql`
      UPDATE quiz_submissions 
      SET 
        remaining_marketing = GREATEST(remaining_marketing, 0),
        remaining_capital = GREATEST(remaining_capital, 0),
        remaining_team = GREATEST(remaining_team, 0),
        remaining_strategy = GREATEST(remaining_strategy, 0)
      WHERE 
        remaining_marketing < 0 OR 
        remaining_capital < 0 OR 
        remaining_team < 0 OR 
        remaining_strategy < 0
    `;
    
    console.log('✅ Fixed negative token balances');
    
    // Now apply the constraint
    await sql`
      ALTER TABLE quiz_submissions 
      ADD CONSTRAINT check_remaining_capital_positive 
      CHECK (remaining_capital >= 0)
    `;
    
    console.log('✅ Applied remaining capital constraint');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixNegativeTokens();
