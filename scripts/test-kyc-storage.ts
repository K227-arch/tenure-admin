import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testKycStorage() {
  try {
    console.log('🧪 Testing KYC Storage Setup...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Storage URL: https://exneyqwvvckzxqzlknxv.storage.supabase.co/storage/v1/s3');
    
    // Test 1: List all buckets
    console.log('\n📦 Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:');
    buckets?.forEach(bucket => {
      console.log(`  - ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 2: Check if kyc-images bucket exists
    console.log('\n🔍 Checking kyc-images bucket...');
    const kycBucket = buckets?.find(b => b.id === 'kyc-images');
    
    if (!kycBucket) {
      console.log('❌ kyc-images bucket not found. Creating it...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('kyc-images', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ kyc-images bucket created successfully');
    } else {
      console.log('✅ kyc-images bucket exists');
      console.log(`  - Public: ${kycBucket.public}`);
      console.log(`  - File size limit: ${kycBucket.file_size_limit} bytes`);
      console.log(`  - Allowed MIME types: ${kycBucket.allowed_mime_types?.join(', ') || 'Not set'}`);
    }
    
    // Test 3: Test folder structure
    console.log('\n📁 Testing folder structure...');
    const testUserId = 'test-user-123';
    const testKycId = 'test-kyc-456';
    const testPath = `${testUserId}/${testKycId}/`;
    
    // Try to list files in test folder (should be empty)
    const { data: files, error: listError } = await supabase.storage
      .from('kyc-images')
      .list(testPath);
    
    if (listError) {
      console.log('⚠️  Could not list files (this is normal if folder doesn\'t exist):', listError.message);
    } else {
      console.log(`✅ Folder structure accessible: ${testPath}`);
      console.log(`  - Files found: ${files?.length || 0}`);
    }
    
    // Test 4: Test signed URL generation (without actual file)
    console.log('\n🔗 Testing signed URL generation...');
    const testFilePath = `${testUserId}/${testKycId}/test-document.jpg`;
    
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('kyc-images')
      .createSignedUrl(testFilePath, 3600);
    
    if (urlError) {
      console.log('⚠️  Could not create signed URL (normal if file doesn\'t exist):', urlError.message);
    } else {
      console.log('✅ Signed URL generation works');
      console.log(`  - URL pattern: ${signedUrl.signedUrl?.substring(0, 100)}...`);
    }
    
    // Test 5: Check storage policies (if accessible)
    console.log('\n🔒 Storage policies need to be set up manually in Supabase Dashboard');
    console.log('   Go to: Storage → Policies → Create policies for kyc-images bucket');
    
    console.log('\n🎉 KYC Storage test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up storage policies in Supabase Dashboard (see kyc-storage-policies-manual-setup.md)');
    console.log('2. Test file upload using the API: POST /api/kyc/{kycId}/images');
    console.log('3. Test file listing using the API: GET /api/kyc/{kycId}/images?userId={userId}');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testKycStorage();