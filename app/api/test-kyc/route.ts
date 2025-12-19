import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing KYC table access...');

    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('kyc_verification', 'kyc_statuses')
    `);

    console.log('Found tables:', tables);

    // Get kyc_verification structure
    let kycColumns = [];
    try {
      kycColumns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'kyc_verification'
        ORDER BY ordinal_position
      `);
    } catch (e) {
      console.log('kyc_verification table not found');
    }

    // Get kyc_statuses structure  
    let statusColumns = [];
    try {
      statusColumns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'kyc_statuses'
        ORDER BY ordinal_position
      `);
    } catch (e) {
      console.log('kyc_statuses table not found');
    }

    // Try to get sample data
    let sampleKycData = [];
    try {
      sampleKycData = await db.execute(sql`
        SELECT * FROM kyc_verification LIMIT 3
      `);
    } catch (e) {
      console.log('Cannot read kyc_verification data:', e);
    }

    let sampleStatusData = [];
    try {
      sampleStatusData = await db.execute(sql`
        SELECT * FROM kyc_statuses LIMIT 5
      `);
    } catch (e) {
      console.log('Cannot read kyc_statuses data:', e);
    }

    return NextResponse.json({
      success: true,
      tables: tables,
      kyc_verification: {
        columns: kycColumns,
        sampleData: sampleKycData
      },
      kyc_statuses: {
        columns: statusColumns,
        sampleData: sampleStatusData
      }
    });

  } catch (error) {
    console.error('Test KYC Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}