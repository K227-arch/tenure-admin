import * as fs from 'fs';
import * as path from 'path';

async function testKycDirectConnection() {
  try {
    console.log('🔗 Testing Direct KYC-S3 Connection (No Extra Tables)...\n');

    // Create a simple test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testFilePath = path.join(__dirname, 'test-direct-connection.png');
    fs.writeFileSync(testFilePath, testImageBuffer);
    console.log('✅ Created test image file');

    // Test 1: Upload file (should store in S3 and update kyc_verification.documents JSONB)
    console.log('\n1. Testing file upload with direct KYC table integration...');
    const formData = new FormData();
    const file = new File([testImageBuffer], 'test-direct-connection.png', { type: 'image/png' });
    formData.append('file', file);
    formData.append('userId', '12345678-1234-1234-1234-123456789012');
    formData.append('documentType', 'passport');

    const uploadResponse = await fetch('http://localhost:3000/api/kyc/87654321-4321-4321-4321-210987654321/images', {
      method: 'POST',
      body: formData,
    });

    const uploadResult = await uploadResponse.json();
    console.log('Upload response:', uploadResult);

    if (uploadResult.success) {
      console.log('✅ File uploaded and stored in kyc_verification.documents!');
      console.log(`   S3 Path: ${uploadResult.path}`);
      console.log(`   Document ID: ${uploadResult.documentId}`);

      // Test 2: List files (should read from kyc_verification.documents JSONB)
      console.log('\n2. Testing file listing from kyc_verification.documents...');
      const listResponse = await fetch('http://localhost:3000/api/kyc/87654321-4321-4321-4321-210987654321/images?userId=12345678-1234-1234-1234-123456789012');
      const listResult = await listResponse.json();
      
      console.log('List response:', JSON.stringify(listResult, null, 2));
      
      if (listResult.success && listResult.images.length > 0) {
        console.log('✅ Direct KYC-S3 connection working!');
        console.log(`   Found ${listResult.images.length} document(s) in kyc_verification.documents`);
        
        listResult.images.forEach((img: any, index: number) => {
          console.log(`   Document ${index + 1}:`);
          console.log(`     - Document ID: ${img.id}`);
          console.log(`     - Document Type: ${img.documentType}`);
          console.log(`     - File Name: ${img.fileName}`);
          console.log(`     - File Size: ${img.fileSize} bytes`);
          console.log(`     - S3 Bucket: ${img.bucketName}`);
          console.log(`     - S3 Path: ${img.path}`);
          console.log(`     - Signed URL: ${img.url.substring(0, 100)}...`);
        });

        // Test 3: Delete using document ID
        console.log('\n3. Testing file deletion from kyc_verification.documents...');
        const documentId = listResult.images[0].id;
        const deleteResponse = await fetch(
          `http://localhost:3000/api/kyc/87654321-4321-4321-4321-210987654321/images?documentId=${documentId}`,
          { method: 'DELETE' }
        );
        
        const deleteResult = await deleteResponse.json();
        console.log('Delete response:', deleteResult);
        
        if (deleteResult.success) {
          console.log('✅ Direct deletion from kyc_verification.documents works!');
          
          // Verify deletion
          console.log('\n4. Verifying deletion...');
          const verifyResponse = await fetch('http://localhost:3000/api/kyc/87654321-4321-4321-4321-210987654321/images?userId=12345678-1234-1234-1234-123456789012');
          const verifyResult = await verifyResponse.json();
          
          console.log(`   Documents after deletion: ${verifyResult.images?.length || 0}`);
          if (verifyResult.images?.length === 0) {
            console.log('✅ File properly removed from both S3 and kyc_verification.documents!');
          }
        } else {
          console.log('⚠️  File deletion failed:', deleteResult.error);
        }
      } else {
        console.log('⚠️  File listing failed or no files found');
      }
    } else {
      console.log('❌ File upload failed:', uploadResult.error);
    }

    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Cleaned up test file');
    }

    console.log('\n🎉 Direct KYC-S3 Connection Test Complete!');
    console.log('\n📊 Connection Architecture:');
    console.log('┌─────────────────────┐    ┌─────────────────────┐');
    console.log('│  kyc_verification   │◄──►│    S3 Storage       │');
    console.log('│                     │    │   (kyc-images)      │');
    console.log('│ - id                │    │                     │');
    console.log('│ - user_id           │    │ - Actual files      │');
    console.log('│ - documents (JSONB) │    │ - Signed URLs       │');
    console.log('│   └─ file metadata  │    │ - Security policies │');
    console.log('│ - status            │    │                     │');
    console.log('└─────────────────────┘    └─────────────────────┘');
    
    console.log('\n✅ Benefits of Direct Connection:');
    console.log('- No extra tables needed');
    console.log('- File metadata stored in kyc_verification.documents JSONB');
    console.log('- Direct relationship between KYC record and files');
    console.log('- Simpler architecture');
    console.log('- All KYC data in one place');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testKycDirectConnection();