import { NextRequest, NextResponse } from 'next/server';
import { sumsubClient } from '@/lib/sumsub/client';
import { sumsubService } from '@/lib/sumsub/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-payload-digest') || '';
    const webhookSecret = process.env.SUMSUB_WEBHOOK_SECRET || '';

    // Verify webhook signature
    if (!sumsubClient.verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    console.log('Sumsub webhook received:', webhookData);

    const { type, applicantId, inspectionId, reviewStatus, reviewResult } = webhookData;

    // Handle different webhook types
    switch (type) {
      case 'applicantReviewed':
      case 'applicantPending':
      case 'applicantOnHold':
        await sumsubService.updateKYCStatus({
          applicantId,
          status: reviewStatus,
          reviewResult,
          score: reviewResult?.score,
          webhookData,
        });
        break;

      case 'applicantCreated':
        console.log(`New applicant created: ${applicantId}`);
        break;

      case 'applicantActionPending':
        await sumsubService.updateKYCStatus({
          applicantId,
          status: 'action_required',
          webhookData,
        });
        break;

      case 'applicantActionReviewed':
        await sumsubService.updateKYCStatus({
          applicantId,
          status: reviewStatus,
          reviewResult,
          webhookData,
        });
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}