import { NextRequest, NextResponse } from 'next/server';
import { kycVerificationQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || undefined;
    const riskLevel = searchParams.get('riskLevel') || undefined;
    const userId = searchParams.get('userId') || undefined;

    // Get KYC records from database
    const records = await kycVerificationQueries.getAll(
      limit,
      offset,
      { status, riskLevel, userId }
    );

    // Get stats
    const stats = await kycVerificationQueries.getStats();

    return NextResponse.json({
      success: true,
      records,
      stats,
      pagination: {
        limit,
        offset,
        total: records.length,
      },
    });

  } catch (error: any) {
    console.error('Error fetching KYC records:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch KYC records' 
      },
      { status: 500 }
    );
  }
}