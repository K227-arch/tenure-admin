/**
 * Check Users Table Structure
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkUsersTable() {
  console.log('🔍 Checking users table structure...\n');

  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    const columns = result as unknown as Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>;

    console.log('📋 Users table columns:');
    columns.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkUsersTable();
