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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';

    const offset = (page - 1) * limit;

    // Build query from session table
    let query = supabaseAdmin
      .from('session')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`ip_address.ilike.%${search}%,user_agent.ilike.%${search}%`);
    }

    if (action && action !== 'all') {
      if (action === 'active') {
        query = query.gte('expires_at', new Date().toISOString());
      } else if (action === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }
    }

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch logs', 
        details: error.message,
        hint: error.hint 
      }, { status: 500 });
    }

    // Fetch user details for each session
    const transformedLogs = await Promise.all(
      (sessions || []).map(async (session) => {
        // Fetch user details from users table using user_id
        let userName = 'Unknown User';
        let userEmail = '';
        
        if (session.user_id) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('name, email')
            .eq('id', session.user_id)
            .single();
          
          if (user) {
            userName = user.name || user.email || 'Unknown User';
            userEmail = user.email || '';
          }
        }

        // Determine action based on session state
        let action = 'Session Created';
        let status = 'success';
        
        const now = new Date();
        const expiresAt = new Date(session.expires_at);
        
        if (expiresAt < now) {
          action = 'Session Expired';
          status = 'warning';
        }

        // Build details
        const details = `IP: ${session.ip_address || 'N/A'} | Expires: ${expiresAt.toLocaleString()}`;

        return {
          id: session.id,
          timestamp: session.created_at,
          user: userName,
          user_email: userEmail,
          action: action,
          details: details,
          status: status,
        };
      })
    );

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        pages: Math.ceil((count || 0) / limit),
        total: count || 0,
        limit,
      },
    });
  } catch (error) {
    console.error('Error in audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
