import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query admin table for user
    const { data: admin, error } = await supabaseAdmin
      .from('admin')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if admin is active (if status field exists)
    if (admin.status && admin.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password - check if using hash/salt or password field
    let passwordMatch = false;
    
    if (admin.hash && admin.salt) {
      // Using hash and salt
      const hashedPassword = await bcrypt.hash(password, admin.salt);
      passwordMatch = hashedPassword === admin.hash;
    } else if (admin.password) {
      // Using password field
      passwordMatch = await bcrypt.compare(password, admin.password);
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token with session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const token = sign(
      { 
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
        sessionId,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get client information
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create session record in admin_sessions table
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    try {
      await supabaseAdmin.from('admin_sessions').insert({
        admin_id: admin.id,
        session_token: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      });
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      // Continue even if session creation fails
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}