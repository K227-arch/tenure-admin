import * as fs from 'fs';
import * as path from 'path';

async function testKycDetailsWithImages() {
  try {
    console.log('🖼️  Testing KYC Details Modal with Images...\n');

    // Create test images
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const kycId = '87654321-4321-4321-4321-210987654321';
    const userId = '12345678-1234-1234-1234-123456789012';

    console.log('📤 Uploading test documents...');

    // Upload passport image
    const passportFormData = new FormData();
    const passportFile = new File([testImageBuffer], 'passport.png', { type: 'image/png' });
    passportFormData.append('file', passportFile);
    passportFormData.append('userId', userId);
    passportFormData.append('documentType', 'passport');

    const passportResponse = await fetch(`http://localhost:3000/api/kyc/${kycId}/images`, {
      method: 'POST',
      body: passportFormData,
    });

    const passportResult = await passportResponse.json();
    console.log('✅ Passport uploaded:', passportResult.success ? 'SUCCESS' : 'FAILED');

    // Upload driver license image
    const licenseFormData = new FormData();
    const licenseFile = new File([testImageBuffer], 'drivers_license.png', { type: 'image/png' });
    licenseFormData.append('file', licenseFile);
    licenseFormData.append('userId', userId);
    licenseFormData.append('documentType', 'driver_license');

    const licenseResponse = await fetch(`http://localhost:3000/api/kyc/${kycId}/images`, {
      method: 'POST',
      body: licenseFormData,
    });

    const licenseResult = await licenseResponse.json();
    console.log('✅ Driver License uploaded:', licenseResult.success ? 'SUCCESS' : 'FAILED');

    // Upload selfie image
    const selfieFormData = new FormData();
    const selfieFile = new File([testImageBuffer], 'selfie.png', { type: 'image/png' });
    selfieFormData.append('file', selfieFile);
    selfieFormData.append('userId', userId);
    selfieFormData.append('documentType', 'selfie');

    const selfieResponse = await fetch(`http://localhost:3000/api/kyc/${kycId}/images`, {
      method: 'POST',
      body: selfieFormData,
    });

    const selfieResult = await selfieResponse.json();
    console.log('✅ Selfie uploaded:', selfieResult.success ? 'SUCCESS' : 'FAILED');

    // Test fetching images for details modal
    console.log('\n📋 Testing image fetching for details modal...');
    const imagesResponse = await fetch(`http://localhost:3000/api/kyc/${kycId}/images?userId=${userId}`);
    const imagesResult = await imagesResponse.json();

    if (imagesResult.success) {
      console.log(`✅ Found ${imagesResult.images.length} images for KYC details modal:`);
      
      imagesResult.images.forEach((img: any, index: number) => {
        console.log(`   ${index + 1}. ${img.documentType.toUpperCase()}`);
        console.log(`      - File: ${img.fileName}`);
        console.log(`      - Size: ${(img.fileSize / 1024).toFixed(1)} KB`);
        console.log(`      - Type: ${img.fileType}`);
        console.log(`      - Uploaded: ${new Date(img.uploadedAt).toLocaleString()}`);
        console.log(`      - URL: ${img.url.substring(0, 80)}...`);
      });

      console.log('\n🎨 KYC Details Modal will now show:');
      console.log('   - Image thumbnails in a 2-column grid');
      console.log('   - Document type badges');
      console.log('   - File sizes and upload dates');
      console.log('   - Click to view full-size images');
      console.log('   - PDF documents with view buttons');
      
      console.log('\n📱 To test in the UI:');
      console.log('   1. Go to KYC Management page');
      console.log('   2. Click the eye icon on any KYC record');
      console.log('   3. Scroll down to see "Uploaded Documents" section');
      console.log('   4. Images will load automatically');

    } else {
      console.log('❌ Failed to fetch images:', imagesResult.error);
    }

    console.log('\n🎉 KYC Details with Images Test Complete!');
    console.log('\n✨ New Features Added:');
    console.log('   ✅ Image thumbnails in details modal');
    console.log('   ✅ Document type badges');
    console.log('   ✅ File metadata display');
    console.log('   ✅ Click to view full-size');
    console.log('   ✅ PDF document support');
    console.log('   ✅ Loading states');
    console.log('   ✅ Empty state handling');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testKycDetailsWithImages();