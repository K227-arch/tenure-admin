const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function addTransactions() {
  try {
    console.log('Adding sample transactions totaling $3,200...\n');
    
    // Get a user ID to associate transactions with
    const users = await sql`SELECT id FROM users LIMIT 1`;
    
    if (users.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    const userId = users[0].id;
    console.log(`Using user ID: ${userId}\n`);
    
    // Add 4 transactions totaling $3,200
    const transactions = [
      { amount: 1000, description: 'Monthly subscription payment' },
      { amount: 800, description: 'Annual membership fee' },
      { amount: 700, description: 'Service upgrade' },
      { amount: 700, description: 'Additional services' }
    ];
    
    for (const tx of transactions) {
      await sql`
        INSERT INTO transactions (user_id, amount, currency, status, description, created_at, updated_at)
        VALUES (${userId}, ${tx.amount}, 'usd', 'completed', ${tx.description}, NOW(), NOW())
      `;
      console.log(`✅ Added transaction: $${tx.amount} - ${tx.description}`);
    }
    
    console.log('\n✅ All transactions added!');
    console.log('Total: $3,200');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

addTransactions();
