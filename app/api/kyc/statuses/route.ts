import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all statuses from kyc_statuses lookup table
    const statuses = await db.execute(sql`
      SELECT id, name, description 
      FROM kyc_statuses 
      ORDER BY id
    `);

    console.log('KYC Statuses from lookup table:', statuses);

    return NextResponse.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('KYC Statuses API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch KYC statuses', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}