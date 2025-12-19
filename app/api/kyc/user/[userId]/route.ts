import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching KYC data for user:', userId);

    // Get KYC data for specific user with joins
    const kycData = await db.execute(sql`
      SELECT 
        kv.*,
        u.name as user_name,
        u.email as user_email,
        ks.name as status_name,
        ks.description as status_description,
        a.name as reviewer_name,
        a.email as reviewer_email
      FROM kyc_verification kv
      LEFT JOIN users u ON kv.user_id = u.id
      LEFT JOIN kyc_statuses ks ON kv.kyc_status_id = ks.id
      LEFT JOIN admin a ON kv.reviewer_id = a.id
      WHERE kv.user_id = ${userId}::uuid
      ORDER BY kv.created_at DESC
      LIMIT 1
    `);

    if (kycData.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No KYC data found for this user'
      });
    }

    const item = kycData[0];
    
    // Transform data for frontend
    const transformedData = {
      id: item.id,
      userId: item.user_id,
      userName: item.user_name || 'Unknown User',
      email: item.user_email || 'No email',
      status: item.status_name || 'pending',
      statusDescription: item.status_description,
      submittedAt: item.submitted_at || item.created_at,
      reviewedAt: item.reviewed_at,
      documents: item.documents ? (Array.isArray(item.documents) ? item.documents : JSON.parse(String(item.documents) || '[]')) : [],
      riskLevel: item.risk_level || 'low',
      notes: item.notes || '',
      rejectionReason: item.rejection_reason,
      reviewer: item.reviewer_name ? {
        name: item.reviewer_name,
        email: item.reviewer_email,
      } : null,
    };

    console.log('Transformed KYC data:', transformedData);

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('KYC User API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user KYC data',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}
