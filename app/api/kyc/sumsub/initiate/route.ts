import { NextRequest, NextResponse } from 'next/server';
import { sumsubService } from '@/lib/sumsub/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, userInfo } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await sumsubService.initiateKYC(userId, userInfo);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      applicantId: result.applicantId,
    });
  } catch (error) {
    console.error('KYC initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate KYC process' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const status = await sumsubService.getKYCStatus(userId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('KYC status error:', error);
    return NextResponse.json(
      { error: 'Failed to get KYC status' },
      { status: 500 }
    );
  }
}