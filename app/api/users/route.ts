import { NextRequest, NextResponse } from 'next/server';
import { userQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Fetch users with filters
    const usersRaw = await userQueries.getAll(limit, offset, {
      status: status || undefined,
      search: search || undefined,
    });

    // Get total count for pagination
    const stats = await userQueries.getStats();
    const total = stats.total;

    // Map to the shape expected by the UI
    const users = usersRaw.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || '',
      role: null,
      status: u.status,
      membership_type: null,
      joined_at: u.createdAt,
      last_active: u.updatedAt,
      avatar: u.image,
      image: u.image,
      phone: null,
      address: null,
      email_verified: u.emailVerified || false,
      two_factor_enabled: u.twoFactorEnabled || false,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, status = 'pending' } = body;

    const newUser = await userQueries.create({
      email,
      name,
      status: status as any,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}