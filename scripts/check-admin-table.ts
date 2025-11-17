/**
 * Check Admin Table Structure
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkAdminTable() {
  console.log('🔍 Checking admin table structure...\n');

  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'admin'
      ORDER BY ordinal_position
    `);

    const columns = result as unknown as Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>;

    console.log('📋 Admin table columns:');
    columns.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check enum values
    console.log('\n🔍 Checking admin_role enum...');
    const roleEnum = await db.execute(sql`
      SELECT unnest(enum_range(NULL::admin_role))::text as value
    `);
    console.log('Admin role values:', roleEnum);

    console.log('\n🔍 Checking admin_status enum...');
    const statusEnum = await db.execute(sql`
      SELECT unnest(enum_range(NULL::admin_status))::text as value
    `);
    console.log('Admin status values:', statusEnum);

    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkAdminTable();
