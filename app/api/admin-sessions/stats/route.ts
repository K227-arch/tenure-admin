import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const cookieHeader = request.headers.get('cookie');
    const tokenMatch = cookieHeader?.match(/admin_token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    // Get session statistics using the database function
    const { data: stats, error } = await supabaseAdmin
      .rpc('get_admin_session_stats', {
        p_admin_id: adminId ? parseInt(adminId) : null
      });

    if (error) {
      console.error('Error fetching session stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Get active sessions
    const { data: activeSessions, error: activeError } = await supabaseAdmin
      .from('admin_sessions')
      .select(`
        *,
        admin:admin_id (
          id,
          email,
          name
        )
      `)
      .eq('is_active', true)
      .is('logout_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false });

    if (activeError) {
      console.error('Error fetching active sessions:', activeError);
    }

    // Get recent activity (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: recentActivity, error: activityError } = await supabaseAdmin
      .from('admin_activity_logs')
      .select('action, created_at')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    // Calculate activity summary
    const activitySummary = recentActivity?.reduce((acc: any, log: any) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      stats: stats || [],
      activeSessions: activeSessions || [],
      recentActivity: {
        last24Hours: recentActivity?.length || 0,
        summary: activitySummary
      }
    });
  } catch (error) {
    console.error('Error in session stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
