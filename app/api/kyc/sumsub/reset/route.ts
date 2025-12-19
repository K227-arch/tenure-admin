import { NextRequest, NextResponse } from 'next/server';
import { sumsubService } from '@/lib/sumsub/service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await sumsubService.resetKYC(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'KYC reset successfully',
    });
  } catch (error) {
    console.error('KYC reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset KYC' },
      { status: 500 }
    );
  }
}