import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSpecificKYCImages() {
  const kycId = '0a04bee9-b24e-4f0f-89b8-f605a0ea9724';
  
  console.log('🔍 Debugging KYC Images for:', kycId);
  console.log('');

  try {
    // 1. Check if KYC record exists
    console.log('1. Checking KYC record...');
    const { data: kycRecord, error: kycError } = await supabase
      .from('kyc_verification')
      .select('*')
      .eq('id', kycId)
      .single();

    if (kycError) {
      console.log('❌ KYC record error:', kycError);
      return;
    }

    if (!kycRecord) {
      console.log('❌ KYC record not found');
      return;
    }

    console.log('✅ KYC record found:');
    console.log('   User ID:', kycRecord.user_id);
    console.log('   Status ID:', kycRecord.kyc_status_id);
    console.log('   Submitted:', kycRecord.submitted_at);
    console.log('   Documents (JSONB):', JSON.stringify(kycRecord.documents, null, 2));
    console.log('   Verification Data (JSONB):', JSON.stringify(kycRecord.verification_data, null, 2));
    console.log('');

    // 2. Check what's in the verification_data field
    console.log('2. Analyzing verification_data field...');
    const verificationData = kycRecord.verification_data || {};
    const documents = verificationData.documents || [];
    
    console.log(`   Found ${documents.length} documents in verification_data:`);
    documents.forEach((doc: any, index: number) => {
      console.log(`     Document ${index + 1}:`);
      console.log('       ID:', doc.id);
      console.log('       Type:', doc.documentType);
      console.log('       File:', doc.fileName);
      console.log('       Path:', doc.filePath);
      console.log('       Size:', doc.fileSize);
      console.log('       Bucket:', doc.bucketName);
      console.log('       Uploaded:', doc.uploadedAt);
      console.log('');
    });

    // 3. Test the API endpoint directly
    console.log('3. Testing API endpoint...');
    const apiUrl = `http://localhost:3000/api/kyc/${kycId}/images?userId=${kycRecord.user_id}`;
    console.log('   API URL:', apiUrl);
    
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      console.log('   API Response Status:', response.status);
      console.log('   API Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.images) {
        console.log(`   ✅ API returned ${result.images.length} images`);
        result.images.forEach((img: any, index: number) => {
          console.log(`     Image ${index + 1}:`);
          console.log('       Type:', img.documentType);
          console.log('       File:', img.fileName);
          console.log('       URL valid:', img.url ? 'Yes' : 'No');
          console.log('       URL preview:', img.url?.substring(0, 100) + '...');
        });
      } else {
        console.log('   ❌ API did not return images successfully');
      }
    } catch (apiError) {
      console.log('   ❌ API call failed:', apiError);
    }

    // 4. Check Supabase storage directly
    console.log('4. Checking Supabase storage...');
    const storagePath = `${kycRecord.user_id}/${kycId}`;
    console.log('   Storage path:', storagePath);
    
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('kyc-images')
      .list(storagePath);

    if (storageError) {
      console.log('   ❌ Storage error:', storageError);
    } else {
      console.log(`   ✅ Found ${storageFiles?.length || 0} files in storage:`);
      storageFiles?.forEach((file, index) => {
        console.log(`     File ${index + 1}:`);
        console.log('       Name:', file.name);
        console.log('       Size:', file.metadata?.size);
        console.log('       Updated:', file.updated_at);
      });
    }

    // 5. Test signed URL generation for storage files
    if (storageFiles && storageFiles.length > 0) {
      console.log('5. Testing signed URL generation...');
      const firstFile = storageFiles[0];
      const fullPath = `${storagePath}/${firstFile.name}`;
      console.log('   Full path:', fullPath);
      
      const { data: signedUrl, error: urlError } = await supabase
        .storage
        .from('kyc-images')
        .createSignedUrl(fullPath, 3600);

      if (urlError) {
        console.log('   ❌ Signed URL error:', urlError);
      } else {
        console.log('   ✅ Signed URL generated successfully');
        console.log('   URL:', signedUrl.signedUrl?.substring(0, 100) + '...');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSpecificKYCImages();