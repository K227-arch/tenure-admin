import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function checkTable() {
  try {
    console.log('Checking admin_2fa_codes table...\n');
    
    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_2fa_codes'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0]?.exists);
    
    if (tableCheck.rows[0]?.exists) {
      // Get table structure
      const structure = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'admin_2fa_codes'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      structure.rows.forEach((col: any) => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default || ''}`);
      });
      
      // Get row count
      const count = await db.execute(sql`SELECT COUNT(*) FROM admin_2fa_codes;`);
      console.log('\nTotal codes:', count.rows[0]?.count);
      
      // Get recent codes
      const recent = await db.execute(sql`
        SELECT id, admin_id, used, attempts, expires_at, created_at 
        FROM admin_2fa_codes 
        ORDER BY created_at DESC 
        LIMIT 5;
      `);
      
      console.log('\nRecent codes:');
      recent.rows.forEach((row: any) => {
        console.log(`  ID: ${row.id}, Admin: ${row.admin_id}, Used: ${row.used}, Attempts: ${row.attempts}, Expires: ${row.expires_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkTable();
