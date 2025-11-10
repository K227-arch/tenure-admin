import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch sessions for current admin or all sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabaseAdmin
      .from('admin_sessions')
      .select(`
        *,
        admin:admin_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// DELETE - Invalidate a specific session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('admin_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error invalidating session:', error);
    return NextResponse.json({ error: 'Failed to invalidate session' }, { status: 500 });
  }
}
