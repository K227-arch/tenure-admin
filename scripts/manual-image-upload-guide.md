# Manual Image Upload Guide

## 🖼️ Upload Real Test Image to S3 Bucket

### Step 1: Save the Image
1. Right-click on the image you provided in the chat
2. Save it as `test-selfie.jpg` in the `scripts` folder
3. The file path should be: `scripts/test-selfie.jpg`

### Step 2: Upload via API (Option A - Using Script)
```bash
# Run the upload script
npx tsx scripts/upload-real-test-image.ts
```

### Step 3: Upload via Browser (Option B - Using UI)
1. Start the development server: `npm run dev`
2. Go to: `http://localhost:3000`
3. Navigate to KYC Management page
4. Find the test KYC record (ID: 87654321-4321-4321-4321-210987654321)
5. Click the eye icon to view details
6. The modal will show any uploaded images

### Step 4: Upload via cURL (Option C - Direct API)
```bash
curl -X POST http://localhost:3000/api/kyc/87654321-4321-4321-4321-210987654321/images \
  -F "file=@scripts/test-selfie.jpg" \
  -F "userId=12345678-1234-1234-1234-123456789012" \
  -F "documentType=selfie"
```

### Test KYC Record Details:
- **KYC ID**: `87654321-4321-4321-4321-210987654321`
- **User ID**: `12345678-1234-1234-1234-123456789012`
- **Status**: Pending (ID: 1)

### Expected Result:
- Image uploaded to S3 bucket: `kyc-images`
- File path: `12345678-1234-1234-1234-123456789012/87654321-4321-4321-4321-210987654321/selfie_[timestamp].jpg`
- Metadata stored in: `kyc_verification.verification_data.documents`
- Visible in KYC details modal with thumbnail and metadata

### Verification:
```bash
# Check if image was uploaded successfully
curl "http://localhost:3000/api/kyc/87654321-4321-4321-4321-210987654321/images?userId=12345678-1234-1234-1234-123456789012"
```

This will return JSON with the uploaded images including signed URLs for viewing.