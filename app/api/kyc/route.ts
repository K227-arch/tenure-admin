import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const statsOnly = searchParams.get('stats_only') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('Fetching KYC data with:', { status, statsOnly, page, limit, offset });

    // Get available statuses from kyc_statuses table
    const availableStatuses = await db.execute(sql`
      SELECT * FROM kyc_statuses ORDER BY id
    `);

    // Get statistics using kyc_status_id and kyc_statuses lookup table
    const statsQuery = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        ks.name as status_name,
        COUNT(kv.id) as count
      FROM kyc_verification kv
      RIGHT JOIN kyc_statuses ks ON kv.kyc_status_id = ks.id
      GROUP BY ks.id, ks.name
      
      UNION ALL
      
      SELECT COUNT(*) as total, 'total' as status_name, COUNT(*) as count
      FROM kyc_verification
    `);

    // Process statistics
    const stats: any = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      underReview: 0,
    };

    statsQuery.forEach((stat: any) => {
      const statusName = stat.status_name?.toLowerCase();
      const count = Number(stat.count || 0);

      if (statusName === 'total') {
        stats.total = count;
      } else if (statusName === 'pending') {
        stats.pending = count;
      } else if (statusName === 'verified') {  // Changed from 'approved' to 'verified'
        stats.approved = count;
      } else if (statusName === 'rejected') {
        stats.rejected = count;
      } else if (statusName === 'in review') {  // Changed from 'under_review' to 'in review'
        stats.underReview = count;
      }
    });

    // If only stats are requested, return early
    if (statsOnly) {
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Build the base query for KYC data with pagination
    let kycQuery = sql`
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
    `;

    // Add status filter if provided
    if (status && status !== 'all') {
      // Try to find the status ID from the lookup table
      const statusRecord = availableStatuses.find((s: any) =>
        s.name.toLowerCase() === status.toLowerCase()
      );

      if (statusRecord) {
        kycQuery = sql`
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
          WHERE kv.kyc_status_id = ${statusRecord.id}
        `;
      }
    }

    // Add pagination
    kycQuery = sql`${kycQuery} ORDER BY kv.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const kycData = await db.execute(kycQuery);

    // Get total count for pagination (filtered)
    let countQuery = sql`SELECT COUNT(*) as total FROM kyc_verification kv`;

    if (status && status !== 'all') {
      const statusRecord = availableStatuses.find((s: any) =>
        s.name.toLowerCase() === status.toLowerCase()
      );
      if (statusRecord) {
        countQuery = sql`
          SELECT COUNT(*) as total 
          FROM kyc_verification kv 
          WHERE kv.kyc_status_id = ${statusRecord.id}
        `;
      }
    }

    const totalCountResult = await db.execute(countQuery);
    const totalRecords = Number(totalCountResult[0]?.total || 0);
    const totalPages = Math.ceil(totalRecords / limit);

    // Transform data for frontend
    const transformedData = kycData.map((item: any) => {
      return {
        id: item.id,
        userId: item.user_id || item.userId,
        userName: item.user_name || item.userName || 'Unknown User',
        email: item.user_email || item.userEmail || 'No email',
        status: item.status_name || item.status || 'pending',
        statusDescription: item.status_description,
        submittedAt: item.submitted_at || item.submittedAt || item.created_at || item.createdAt,
        reviewedAt: item.reviewed_at || item.reviewedAt,
        documents: item.documents ? (Array.isArray(item.documents) ? item.documents : []) : [],
        riskLevel: item.risk_level || item.riskLevel || 'low',
        notes: item.notes || '',
        rejectionReason: item.rejection_reason || item.rejectionReason,
        reviewer: item.reviewer_name ? {
          name: item.reviewer_name,
          email: item.reviewer_email,
        } : null,
        // Sum & Substance specific data
        sumsub: {
          applicantId: item.sumsub_applicant_id,
          inspectionId: item.sumsub_inspection_id,
          externalUserId: item.sumsub_external_user_id,
          score: item.sumsub_score ? parseFloat(item.sumsub_score) : null,
          reviewResult: item.sumsub_review_result,
          webhookData: item.sumsub_webhook_data,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      stats,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });

  } catch (error) {
    console.error('KYC API Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch KYC data',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      stats: { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 }
    });
  }
}

export async function POST(request: Request) {
  try {
    const { action, kycId, status, notes, rejectionReason, reviewerId } = await request.json();

    if (action === 'update_status') {
      // Validate required fields
      if (!kycId || !status) {
        return NextResponse.json(
          { error: 'KYC ID and status are required' },
          { status: 400 }
        );
      }

      console.log('Updating KYC status:', { kycId, status, notes, rejectionReason, reviewerId });

      // First, get the status ID from kyc_statuses lookup table
      const statusLookup = await db.execute(sql`
        SELECT id FROM kyc_statuses WHERE name = ${status}
      `);

      if (statusLookup.length === 0) {
        return NextResponse.json(
          { error: `Invalid status: ${status}. Status not found in kyc_statuses table.` },
          { status: 400 }
        );
      }

      const statusId = statusLookup[0].id;

      // Update the KYC record using kyc_status_id
      const updateQuery = sql`
        UPDATE kyc_verification 
        SET 
          kyc_status_id = ${statusId},
          reviewed_at = NOW(),
          reviewer_id = ${reviewerId || null},
          notes = ${notes || null},
          rejection_reason = ${rejectionReason || null},
          updated_at = NOW()
        WHERE id = ${kycId}
        RETURNING *
      `;

      const result = await db.execute(updateQuery);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'KYC record not found' },
          { status: 404 }
        );
      }

      console.log('Updated KYC record:', result[0]);

      return NextResponse.json({
        success: true,
        message: `KYC status updated to ${status}`,
        data: result[0]
      });
    }

    if (action === 'create') {
      // Create new KYC verification
      const { userId, documents, riskLevel } = await request.json();

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Get the 'pending' status ID from kyc_statuses
      const pendingStatus = await db.execute(sql`
        SELECT id FROM kyc_statuses WHERE name = 'pending'
      `);

      if (pendingStatus.length === 0) {
        return NextResponse.json(
          { error: 'Pending status not found in kyc_statuses table' },
          { status: 500 }
        );
      }

      const insertQuery = sql`
        INSERT INTO kyc_verification (
          user_id, 
          kyc_status_id, 
          risk_level, 
          documents, 
          submitted_at,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${pendingStatus[0].id},
          ${riskLevel || 'low'},
          ${JSON.stringify(documents || [])},
          NOW(),
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      const result = await db.execute(insertQuery);

      return NextResponse.json({
        success: true,
        message: 'KYC verification created successfully',
        data: result[0]
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: update_status, create' },
      { status: 400 }
    );

  } catch (error) {
    console.error('KYC Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update KYC record', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}