const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('Checking for transaction-related tables...\n');
    
    // Check transactions table
    const transactions = await sql`SELECT COUNT(*), SUM(amount) as total FROM transactions`;
    console.log('transactions table:', transactions[0]);
    
    // Check if there's a user_payments table
    try {
      const payments = await sql`SELECT COUNT(*), SUM(amount) as total FROM user_payments`;
      console.log('user_payments table:', payments[0]);
    } catch (e) {
      console.log('user_payments table: does not exist');
    }
    
    // Check subscriptions
    const subs = await sql`SELECT COUNT(*), SUM(amount) as total FROM subscriptions`;
    console.log('subscriptions table:', subs[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();
