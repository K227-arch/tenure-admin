import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserKYCRecords() {
  const userId = 'c9fb20b0-ca61-43b9-a4d1-59add75f9116';
  
  console.log('🔍 Checking all KYC records for user:', userId);
  console.log('');

  try {
    // Get all KYC records for this user
    const { data: kycRecords, error: kycError } = await supabase
      .from('kyc_verification')
      .select('*')
      .eq('user_id', userId);

    if (kycError) {
      console.log('❌ KYC records error:', kycError);
      return;
    }

    console.log(`✅ Found ${kycRecords?.length || 0} KYC records for this user:`);
    
    kycRecords?.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`);
      console.log('     KYC ID:', record.id);
      console.log('     Status ID:', record.kyc_status_id);
      console.log('     Created:', record.created_at);
      console.log('     Submitted:', record.submitted_at);
      
      const verificationData = record.verification_data || {};
      console.log('     Inspection ID:', verificationData.inspectionId);
      console.log('     Sumsub ID:', verificationData.id);
      console.log('     Review Status:', verificationData.review?.reviewStatus);
      console.log('     Review Result:', verificationData.review?.reviewResult?.reviewAnswer);
      
      const documents = verificationData.documents || [];
      console.log('     Documents in verification_data:', documents.length);
      
      // Check if there are files in storage for this inspection ID
      if (verificationData.inspectionId) {
        console.log(`     Checking storage for inspection ID: ${verificationData.inspectionId}`);
        checkStorageForInspection(userId, verificationData.inspectionId);
      }
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

async function checkStorageForInspection(userId: string, inspectionId: string) {
  try {
    const { data: files, error } = await supabase
      .storage
      .from('kyc-images')
      .list(`${userId}/${inspectionId}`);

    if (error) {
      console.log('       ❌ Storage error:', error.message);
    } else {
      console.log(`       ✅ Found ${files?.length || 0} files in storage`);
      files?.forEach((file, index) => {
        console.log(`         ${index + 1}. ${file.name} (${file.metadata?.size} bytes)`);
      });
    }
  } catch (error) {
    console.log('       ❌ Storage check failed:', error);
  }
}

checkUserKYCRecords();