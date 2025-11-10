import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// PUT - Update admin account
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { email, password, name, role, status } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields that are provided
    if (email) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Only hash and update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      updateData.hash = hash;
      updateData.salt = salt;
    }

    const { data, error } = await supabaseAdmin
      .from('admin')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Remove sensitive fields from response
    const { password: _, hash: __, salt: ___, reset_password_token: ____, ...adminWithoutSensitiveData } = data;

    return NextResponse.json({ admin: adminWithoutSensitiveData });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update admin account' }, { status: 500 });
  }
}

// DELETE - Delete admin account
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('admin')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin account' }, { status: 500 });
  }
}
