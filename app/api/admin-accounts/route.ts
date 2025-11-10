import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch all admin accounts
export async function GET() {
  try {
    // Get all columns from admin table
    const { data: admins, error } = await supabaseAdmin
      .from('admin')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Remove sensitive fields (password, hash, salt) from all admin objects
    const adminsWithoutSensitiveData = admins?.map(admin => {
      const { password, hash, salt, reset_password_token, ...adminData } = admin;
      return adminData;
    });

    return NextResponse.json({ admins: adminsWithoutSensitiveData });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admin accounts' }, { status: 500 });
  }
}

// POST - Create new admin account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, status = 'active' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Generate salt and hash using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Build insert object matching the actual table structure
    // Only include fields that exist in the admin table
    const insertData: any = {
      email,
      hash,
      salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Note: role and status columns may not exist in the table
    // Only add them if your table has these columns

    const { data, error } = await supabaseAdmin
      .from('admin')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
      throw error;
    }

    // Remove sensitive fields from response
    const { hash: _, salt: __, ...adminWithoutPassword } = data;

    return NextResponse.json({ admin: adminWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 });
  }
}
