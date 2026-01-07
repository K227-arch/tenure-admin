import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkKycStatuses() {
  try {
    console.log('Checking KYC statuses in database...');
    
    // Get all statuses from kyc_statuses table
    const statuses = await db.execute(sql`
      SELECT * FROM kyc_statuses ORDER BY id
    `);

    console.log('Available KYC statuses:');
    statuses.forEach((status: any) => {
      console.log(`- ID: ${status.id}, Name: "${status.name}", Description: "${status.description}"`);
    });

    // Get actual KYC records with their status counts
    const statsQuery = await db.execute(sql`
      SELECT 
        ks.name as status_name,
        COUNT(kv.id) as count
      FROM kyc_verification kv
      RIGHT JOIN kyc_statuses ks ON kv.kyc_status_id = ks.id
      GROUP BY ks.id, ks.name
      ORDER BY ks.id
    `);

    console.log('\nKYC records by status:');
    statsQuery.forEach((stat: any) => {
      console.log(`- ${stat.status_name}: ${stat.count} records`);
    });

    // Get total count
    const totalQuery = await db.execute(sql`
      SELECT COUNT(*) as total FROM kyc_verification
    `);

    console.log(`\nTotal KYC records: ${totalQuery[0].total}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkKycStatuses();