import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugS3Bucket() {
  try {
    console.log('🔍 Debugging S3 Bucket Issues...\n');

    // Step 1: Check if bucket exists
    console.log('1. Checking if kyc-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const kycBucket = buckets?.find(b => b.id === 'kyc-images');
    if (!kycBucket) {
      console.log('❌ kyc-images bucket NOT FOUND!');
      console.log('Available buckets:', buckets?.map(b => b.id));
      return;
    }

    console.log('✅ kyc-images bucket exists');
    console.log(`   Public: ${kycBucket.public}`);
    console.log(`   File size limit: ${kycBucket.file_size_limit} bytes`);

    // Step 2: List all files in the bucket
    console.log('\n2. Listing all files in kyc-images bucket...');
    const { data: allFiles, error: listError } = await supabase.storage
      .from('kyc-images')
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) {
      console.error('❌ Error listing files:', listError);
      return;
    }

    if (!allFiles || allFiles.length === 0) {
      console.log('📁 Bucket is empty - no files found');
    } else {
      console.log(`✅ Found ${allFiles.length} items in bucket:`);
      allFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
      });
    }

    // Step 3: Check specific test folders
    console.log('\n3. Checking test user folders...');
    const testUserId = '12345678-1234-1234-1234-123456789012';
    const testKycId = '87654321-4321-4321-4321-210987654321';
    
    const { data: userFiles, error: userError } = await supabase.storage
      .from('kyc-images')
      .list(testUserId);

    if (userError) {
      console.log(`⚠️  No folder found for user ${testUserId}`);
    } else if (!userFiles || userFiles.length === 0) {
      console.log(`📁 User folder exists but is empty: ${testUserId}/`);
    } else {
      console.log(`✅ Found ${userFiles.length} items in user folder:`);
      userFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });

      // Check KYC subfolder
      const { data: kycFiles, error: kycError } = await supabase.storage
        .from('kyc-images')
        .list(`${testUserId}/${testKycId}`);

      if (kycError) {
        console.log(`⚠️  No KYC folder found: ${testUserId}/${testKycId}/`);
      } else if (!kycFiles || kycFiles.length === 0) {
        console.log(`📁 KYC folder exists but is empty: ${testUserId}/${testKycId}/`);
      } else {
        console.log(`✅ Found ${kycFiles.length} files in KYC folder:`);
        kycFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
        });
      }
    }

    // Step 4: Check database records
    console.log('\n4. Checking database records...');
    const response = await fetch(`http://localhost:3000/api/kyc/${testKycId}/images?userId=${testUserId}`);
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Database shows ${result.images.length} images:`);
        result.images.forEach((img: any, index: number) => {
          console.log(`   ${index + 1}. ${img.documentType}: ${img.fileName}`);
          console.log(`      Path: ${img.path}`);
          console.log(`      Size: ${img.fileSize} bytes`);
        });
      } else {
        console.log('❌ Database query failed:', result.error);
      }
    } else {
      console.log('❌ API request failed:', response.status);
    }

    // Step 5: Test upload
    console.log('\n5. Testing a simple upload...');
    const testContent = 'Test file content';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-images')
      .upload(`test-debug-${Date.now()}.txt`, testBlob);

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
    } else {
      console.log('✅ Test upload successful:', uploadData.path);
      
      // Clean up test file
      await supabase.storage
        .from('kyc-images')
        .remove([uploadData.path]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n📋 Troubleshooting Summary:');
    console.log('If bucket is empty but database shows images:');
    console.log('  - Check storage policies');
    console.log('  - Verify API upload is working');
    console.log('  - Check for upload errors in logs');
    console.log('\nIf bucket exists but you can\'t see it in Supabase dashboard:');
    console.log('  - Refresh the Storage page');
    console.log('  - Check you\'re in the right project');
    console.log('  - Verify permissions');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugS3Bucket();