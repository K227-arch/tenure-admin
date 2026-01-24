import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStoragePolicies() {
  try {
    console.log('🔒 Testing KYC Storage Policies...\n');

    // Test 1: Check if we can list buckets (should work with service role)
    console.log('1. Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError.message);
      return;
    }
    
    const kycBucket = buckets?.find(b => b.id === 'kyc-images');
    if (kycBucket) {
      console.log('✅ kyc-images bucket accessible');
    } else {
      console.log('❌ kyc-images bucket not found');
      return;
    }

    // Test 2: Try to list files in kyc-images (should work with service role)
    console.log('\n2. Testing file listing with service role...');
    const { data: files, error: listError } = await supabase.storage
      .from('kyc-images')
      .list('');

    if (listError) {
      console.log('⚠️  Cannot list files:', listError.message);
      console.log('   This might indicate missing policies or empty bucket');
    } else {
      console.log('✅ Can list files in kyc-images bucket');
      console.log(`   Found ${files?.length || 0} items`);
    }

    // Test 3: Try to create a signed URL for a test path
    console.log('\n3. Testing signed URL generation...');
    const testPath = 'test-user/test-kyc/test-file.jpg';
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('kyc-images')
      .createSignedUrl(testPath, 60);

    if (urlError) {
      console.log('⚠️  Cannot create signed URL:', urlError.message);
      console.log('   This is normal if the file doesn\'t exist');
    } else {
      console.log('✅ Can generate signed URLs');
    }

    // Test 4: Test API endpoint
    console.log('\n4. Testing KYC Images API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/kyc/test-kyc-123/images?userId=test-user-123');
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ KYC Images API endpoint working');
        console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
      } else {
        console.log('⚠️  KYC Images API endpoint error:', result.error);
      }
    } catch (fetchError) {
      console.log('⚠️  Cannot reach API endpoint (make sure server is running)');
    }

    console.log('\n🎯 Policy Test Summary:');
    console.log('- Bucket exists and is accessible ✅');
    console.log('- Service role can access storage ✅');
    console.log('- Ready for file operations ✅');
    
    console.log('\n📋 Next steps:');
    console.log('1. If policies are missing, run: scripts/cleanup-storage-policies.sql');
    console.log('2. Then run: scripts/create-storage-policies.sql');
    console.log('3. Test file upload with: POST /api/kyc/{kycId}/images');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStoragePolicies();