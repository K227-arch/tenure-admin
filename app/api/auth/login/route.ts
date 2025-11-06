import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

// Default admin credentials
const ADMIN_EMAIL = 'dantetrevordrex@gmail.com';
const ADMIN_PASSWORD = 'The$1000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate JWT token
      const token = sign(
        { 
          email: ADMIN_EMAIL,
          role: 'admin',
          name: 'Admin User',
          iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        token,
        user: {
          email: ADMIN_EMAIL,
          name: 'Admin User',
          role: 'admin'
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}