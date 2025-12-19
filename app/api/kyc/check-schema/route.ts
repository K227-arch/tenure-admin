import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Check if kyc_verification table exists and get its structure
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'kyc_verification' 
      ORDER BY ordinal_position;
    `);

    // Check if kyc_statuses table exists
    const statusTableInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'kyc_statuses' 
      ORDER BY ordinal_position;
    `);

    // Get sample data if tables exist
    let sampleKycData = [];
    let sampleStatusData = [];

    try {
      const kycSample = await db.execute(sql`SELECT * FROM kyc_verification LIMIT 3;`);
      sampleKycData = kycSample;
    } catch (e) {
      console.log('No sample KYC data or table does not exist');
    }

    try {
      const statusSample = await db.execute(sql`SELECT * FROM kyc_statuses LIMIT 5;`);
      sampleStatusData = statusSample;
    } catch (e) {
      console.log('No sample status data or table does not exist');
    }

    return NextResponse.json({
      success: true,
      tables: {
        kyc_verification: {
          exists: tableInfo.length > 0,
          columns: tableInfo,
          sampleData: sampleKycData
        },
        kyc_statuses: {
          exists: statusTableInfo.length > 0,
          columns: statusTableInfo,
          sampleData: sampleStatusData
        }
      }
    });

  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}