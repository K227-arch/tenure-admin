import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkMembershipQueue() {
  try {
    console.log('Checking membership_queue table structure...\n');
    
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'membership_queue'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in membership_queue table:');
    console.table(result);
    
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'membership_queue'
      )
    `);
    
    console.log('\nTable exists:', tableExists);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkMembershipQueue();
