const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function checkStats() {
  try {
    console.log('Checking transaction stats...\n');
    
    // Get all transactions
    const allTransactions = await sql`
      SELECT id, amount, status, created_at
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    console.log('Recent transactions:');
    allTransactions.forEach(t => {
      console.log(`  ID: ${t.id}, Amount: ${t.amount}, Status: ${t.status}`);
    });
    
    // Get completed transaction stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_amount
      FROM transactions
      WHERE status = 'completed'
    `;
    
    console.log('\nCompleted transaction stats:');
    console.log(`  Total: ${stats[0].total}`);
    console.log(`  Total Amount: ${stats[0].total_amount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkStats();
