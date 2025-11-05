import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: members, error } = await supabaseAdmin
      .from('membership_queue')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          image
        )
      `)
      .order('queue_position', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      members: members || []
    });
  } catch (error) {
    console.error('Error fetching membership queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership queue' },
      { status: 500 }
    );
  }
}