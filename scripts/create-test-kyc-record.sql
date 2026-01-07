-- Create a test KYC record for testing the direct S3 connection
-- Updated to match the actual kyc_verification table structure

-- First, ensure we have a test user (using proper UUID)
INSERT INTO users (id, email, name, created_at, updated_at)
VALUES (
    '12345678-1234-1234-1234-123456789012'::uuid,
    'test-direct@example.com',
    'Direct Test User',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- Create a test KYC verification record using the actual table structure
INSERT INTO kyc_verification (
    id,
    user_id,
    kyc_status_id,
    verification_provider,
    provider_verification_id,
    verification_data,
    document_front_url,
    document_back_url,
    selfie_url,
    created_at,
    updated_at
)
VALUES (
    '87654321-4321-4321-4321-210987654321'::uuid,
    '12345678-1234-1234-1234-123456789012'::uuid,
    1, -- Pending status
    'supabase_storage',
    'test-verification-' || extract(epoch from now())::text,
    '{"documents": []}'::jsonb, -- This will store our S3 file references
    null, -- Will be populated with S3 URLs
    null, -- Will be populated with S3 URLs  
    null, -- Will be populated with S3 URLs
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    verification_data = '{"documents": []}'::jsonb,
    updated_at = NOW();

-- Verify the record was created
SELECT 
    id,
    user_id,
    kyc_status_id,
    verification_provider,
    verification_data,
    created_at
FROM kyc_verification 
WHERE id = '87654321-4321-4321-4321-210987654321'::uuid;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Test KYC record created successfully!';
    RAISE NOTICE 'KYC ID: 87654321-4321-4321-4321-210987654321';
    RAISE NOTICE 'User ID: 12345678-1234-1234-1234-123456789012';
    RAISE NOTICE 'S3 file metadata will be stored in verification_data JSONB field';
    RAISE NOTICE 'Ready for S3 file upload testing';
END $$;