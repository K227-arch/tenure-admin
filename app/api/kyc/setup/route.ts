import { NextResponse } from 'next/server';
import { kycVerificationQueries, userQueries } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // First, try to create the KYC tables if they don't exist
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN
          -- Create enums if they don't exist
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
            CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
            CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
          END IF;
        END $$;
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS kyc_statuses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS kyc_verification (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status kyc_status NOT NULL DEFAULT 'pending',
          risk_level risk_level DEFAULT 'low',
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          reviewed_at TIMESTAMP,
          reviewer_id INTEGER REFERENCES admin(id) ON DELETE SET NULL,
          documents JSONB,
          notes TEXT,
          rejection_reason TEXT,
          expires_at TIMESTAMP,
          metadata JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Insert default KYC statuses
      await db.execute(sql`
        INSERT INTO kyc_statuses (name, description) VALUES
        ('pending', 'Awaiting initial review'),
        ('under_review', 'Currently being reviewed by admin'),
        ('approved', 'KYC verification approved'),
        ('rejected', 'KYC verification rejected'),
        ('expired', 'KYC verification has expired')
        ON CONFLICT (name) DO NOTHING;
      `);

    } catch (tableError) {
      console.log('Tables might already exist:', tableError);
    }

    // Check if we have any users first
    const users = await userQueries.getAll(5, 0);
    
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No users found. Please create some users first.',
      });
    }

    // Create sample KYC data
    const sampleKYCData = [
      {
        userId: users[0].id,
        status: 'pending' as const,
        riskLevel: 'low' as const,
        documents: ['passport', 'utility_bill'],
        notes: 'Initial submission, awaiting review',
        submittedAt: new Date(),
      },
      {
        userId: users[1]?.id || users[0].id,
        status: 'approved' as const,
        riskLevel: 'low' as const,
        documents: ['drivers_license', 'bank_statement'],
        notes: 'All documents verified successfully',
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        reviewedAt: new Date(),
        reviewerId: 1,
      },
    ];

    // Insert sample data
    const createdRecords = [];
    for (const data of sampleKYCData) {
      try {
        const record = await kycVerificationQueries.create(data);
        createdRecords.push(record);
      } catch (error) {
        console.log('Record might already exist or table issue:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdRecords.length} sample KYC records`,
      data: createdRecords,
    });

  } catch (error) {
    console.error('KYC Setup Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup KYC data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}