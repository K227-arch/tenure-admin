import { NextRequest, NextResponse } from 'next/server';
import { kycVerificationQueries } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes, rejectionReason } = body;

    if (!status) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Status is required' 
        },
        { status: 400 }
      );
    }

    // TODO: Get reviewer ID from session/auth
    const reviewerId = 1; // Replace with actual reviewer ID from auth

    const updatedRecord = await kycVerificationQueries.updateStatus(
      id,
      status,
      reviewerId,
      notes,
      rejectionReason
    );

    return NextResponse.json({
      success: true,
      record: updatedRecord,
    });

  } catch (error: any) {
    console.error('Error updating KYC status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update KYC status' 
      },
      { status: 500 }
    );
  }
}