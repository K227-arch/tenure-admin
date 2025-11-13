/**
 * Check 2FA status for admins
 * Run with: npx ts-node scripts/check-2fa-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check2FAStatus() {
  console.log('🔍 Checking 2FA status for all admins...\n');

  try {
    // Get all admins
    const { data: admins, error } = await supabase
      .from('admin')
      .select('id, email, name, two_factor_enabled, backup_codes')
      .order('email');

    if (error) {
      console.error('❌ Error fetching admins:', error);
      process.exit(1);
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  No admins found in database');
      return;
    }

    console.log(`Found ${admins.length} admin(s):\n`);

    admins.forEach((admin, index) => {
      const status = admin.two_factor_enabled ? '✅ Enabled' : '❌ Disabled';
      const backupCodesCount = admin.backup_codes ? admin.backup_codes.length : 0;
      
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   2FA Status: ${status}`);
      console.log(`   Backup Codes: ${backupCodesCount}`);
      console.log('');
    });

    // Get recent 2FA codes
    const { data: codes, error: codesError } = await supabase
      .from('admin_2fa_codes')
      .select('admin_id, created_at, expires_at, used, attempts')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!codesError && codes && codes.length > 0) {
      console.log('\n📋 Recent 2FA codes (last 10):');
      codes.forEach((code, index) => {
        const admin = admins.find(a => a.id === code.admin_id);
        const status = code.used ? 'Used' : 
                      new Date(code.expires_at) < new Date() ? 'Expired' : 
                      'Active';
        
        console.log(`${index + 1}. ${admin?.email || 'Unknown'}`);
        console.log(`   Created: ${new Date(code.created_at).toLocaleString()}`);
        console.log(`   Expires: ${new Date(code.expires_at).toLocaleString()}`);
        console.log(`   Status: ${status}`);
        console.log(`   Attempts: ${code.attempts}/3`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

check2FAStatus().catch(console.error);
