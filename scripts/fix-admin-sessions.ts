import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function fixTable() {
  try {
    console.log('Fixing admin_sessions table...\n');
    
    // Add token column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE admin_sessions 
      ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;
    `);
    
    console.log('✅ Added token column');
    
    // Check the structure now
    const structure = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'admin_sessions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent columns:');
    structure.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

fixTable();
