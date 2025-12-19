import { NextRequest, NextResponse } from 'next/server';
import { sumsubClient } from '@/lib/sumsub/client';
import { sumsubService } from '@/lib/sumsub/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const applicantId = searchParams.get('applicantId');
    const externalUserId = searchParams.get('externalUserId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    switch (action) {
      case 'applicants':
        // Get all applicants with pagination
        const applicants = await sumsubClient.getAllApplicants({
          limit: limit ? parseInt(limit) : 50,
          offset: offset ? parseInt(offset) : 0,
          levelName: process.env.SUMSUB_LEVEL_NAME,
        });
        
        return NextResponse.json({
          success: true,
          data: applicants,
          action: 'applicants'
        });

      case 'applicant':
        if (!applicantId) {
          return NextResponse.json(
            { error: 'Applicant ID is required' },
            { status: 400 }
          );
        }

        // Get specific applicant details
        const applicant = await sumsubClient.getApplicant(applicantId);
        const status = await sumsubClient.getApplicantStatus(applicantId);
        const documents = await sumsubClient.getApplicantDocuments(applicantId);
        const checkResults = await sumsubClient.getCheckResults(applicantId);

        return NextResponse.json({
          success: true,
          data: {
            applicant,
            status,
            documents,
            checkResults,
          },
          action: 'applicant'
        });

      case 'search':
        if (!externalUserId) {
          return NextResponse.json(
            { error: 'External User ID is required for search' },
            { status: 400 }
          );
        }

        // Search by external user ID
        const searchResult = await sumsubClient.getApplicantByExternalUserId(externalUserId);
        
        return NextResponse.json({
          success: true,
          data: searchResult,
          action: 'search'
        });

      case 'statistics':
        const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

        // Get statistics for date range
        const stats = await sumsubClient.getStatistics({
          from,
          to,
          levelName: process.env.SUMSUB_LEVEL_NAME,
        });

        return NextResponse.json({
          success: true,
          data: stats,
          action: 'statistics',
          dateRange: { from, to }
        });

      case 'webhook-logs':
        // Get webhook logs
        const webhookLogs = await sumsubClient.getWebhookLogs({
          limit: limit ? parseInt(limit) : 50,
          offset: offset ? parseInt(offset) : 0,
        });

        return NextResponse.json({
          success: true,
          data: webhookLogs,
          action: 'webhook-logs'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: applicants, applicant, search, statistics, webhook-logs' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sumsub sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync data from Sumsub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'sync_all_applicants':
        // Sync all applicants from Sumsub to local database
        const applicants = await sumsubClient.getAllApplicants({
          limit: 100,
          levelName: process.env.SUMSUB_LEVEL_NAME,
        });

        let syncedCount = 0;
        const errors: string[] = [];

        for (const applicant of applicants.items || []) {
          try {
            // Extract user ID from external user ID (assuming format: user_<uuid>)
            const userId = applicant.externalUserId?.replace('user_', '');
            
            if (userId && applicant.review) {
              await sumsubService.updateKYCStatus({
                applicantId: applicant.id,
                status: applicant.review.reviewStatus,
                reviewResult: applicant.review.reviewResult,
                score: applicant.review.reviewResult?.score,
              });
              syncedCount++;
            }
          } catch (err) {
            errors.push(`Failed to sync applicant ${applicant.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Synced ${syncedCount} applicants`,
          errors: errors.length > 0 ? errors : undefined,
          syncedCount,
          totalApplicants: applicants.totalItems || 0,
        });

      case 'search_and_sync':
        const { email, phone, firstName, lastName } = params;
        
        // Search for applicants by criteria
        const searchResults = await sumsubClient.searchApplicants({
          email,
          phone,
          firstName,
          lastName,
          limit: 50,
        });

        return NextResponse.json({
          success: true,
          data: searchResults,
          action: 'search_and_sync'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: sync_all_applicants, search_and_sync' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sumsub sync POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute sync action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}