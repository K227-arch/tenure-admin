import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Checking KYC statuses in database...');
    
    // Get all statuses from kyc_statuses table
    const statuses = await db.execute(sql`
      SELECT * FROM kyc_statuses ORDER BY id
    `);

    // Get actual KYC records with their status counts
    const statsQuery = await db.execute(sql`
      SELECT 
        ks.name as status_name,
        COUNT(kv.id) as count
      FROM kyc_verification kv
      RIGHT JOIN kyc_statuses ks ON kv.kyc_status_id = ks.id
      GROUP BY ks.id, ks.name
      ORDER BY ks.id
    `);

    // Get total count
    const totalQuery = await db.execute(sql`
      SELECT COUNT(*) as total FROM kyc_verification
    `);

    return NextResponse.json({
      success: true,
      availableStatuses: statuses,
      recordCounts: statsQuery,
      totalRecords: totalQuery[0].total
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}