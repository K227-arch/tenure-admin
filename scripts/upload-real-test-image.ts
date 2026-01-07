import * as fs from 'fs';
import * as path from 'path';

async function uploadRealTestImage() {
  try {
    console.log('📸 Uploading Real Test Image to S3 Bucket...\n');

    // Note: You'll need to save the image file manually to the scripts folder
    // and update the filename below
    const imagePath = path.join(__dirname, 'test-selfie.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image file not found!');
      console.log('Please save the image as "test-selfie.jpg" in the scripts folder');
      console.log('Expected path:', imagePath);
      return;
    }

    console.log('✅ Found image file:', imagePath);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📊 Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

    const kycId = '87654321-4321-4321-4321-210987654321';
    const userId = '12345678-1234-1234-1234-123456789012';

    console.log('\n📤 Uploading to S3 bucket...');

    // Create FormData and upload
    const formData = new FormData();
    const file = new File([imageBuffer], 'test-selfie.jpg', { type: 'image/jpeg' });
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('documentType', 'selfie');

    const uploadResponse = await fetch(`http://localhost:3000/api/kyc/${kycId}/images`, {
      method: 'POST',
      body: formData,
    });

    const uploadResult = await uploadResponse.json();
    
    if (uploadResult.success) {
      console.log('✅ Real image uploaded successfully!');
      console.log(`   S3 Path: ${uploadResult.path}`);
      console.log(`   Document ID: ${uploadResult.documentId}`);

      // Verify the upload by fetching images
      console.log('\n🔍 Verifying upload...');
      const imagesResponse = await fetch(`http://localhost:3000/api/kyc/${kycId}/images?userId=${userId}`);
      const imagesResult = await imagesResponse.json();

      if (imagesResult.success) {
        const selfieImage = imagesResult.images.find((img: any) => img.documentType === 'selfie');
        if (selfieImage) {
          console.log('✅ Image verified in database!');
          console.log(`   File: ${selfieImage.fileName}`);
          console.log(`   Size: ${(selfieImage.fileSize / 1024).toFixed(1)} KB`);
          console.log(`   Type: ${selfieImage.fileType}`);
          console.log(`   Signed URL: ${selfieImage.url.substring(0, 100)}...`);
          
          console.log('\n🎨 Now you can:');
          console.log('   1. Go to KYC Management page');
          console.log('   2. Click the eye icon on the test KYC record');
          console.log('   3. See the real selfie image in the details modal!');
        }
      }
    } else {
      console.log('❌ Upload failed:', uploadResult.error);
    }

    console.log('\n🎉 Real Image Upload Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions for manual setup
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Save the provided image as "test-selfie.jpg" in the scripts folder');
console.log('2. Run this script: npx tsx scripts/upload-real-test-image.ts');
console.log('3. The image will be uploaded to S3 and linked to the test KYC record');
console.log('');

uploadRealTestImage();