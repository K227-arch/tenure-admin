-- Add Sum & Substance specific fields to kyc_verification table
ALTER TABLE kyc_verification 
ADD COLUMN IF NOT EXISTS sumsub_applicant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sumsub_inspection_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sumsub_external_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sumsub_access_token TEXT,
ADD COLUMN IF NOT EXISTS sumsub_webhook_data JSONB,
ADD COLUMN IF NOT EXISTS sumsub_review_result JSONB,
ADD COLUMN IF NOT EXISTS sumsub_score DECIMAL(5,2);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_verification_sumsub_applicant_id ON kyc_verification(sumsub_applicant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verification_sumsub_external_user_id ON kyc_verification(sumsub_external_user_id);

-- Add comments for documentation
COMMENT ON COLUMN kyc_verification.sumsub_applicant_id IS 'Sum & Substance applicant ID';
COMMENT ON COLUMN kyc_verification.sumsub_inspection_id IS 'Sum & Substance inspection ID';
COMMENT ON COLUMN kyc_verification.sumsub_external_user_id IS 'External user ID used in Sum & Substance';
COMMENT ON COLUMN kyc_verification.sumsub_access_token IS 'WebSDK access token for Sum & Substance';
COMMENT ON COLUMN kyc_verification.sumsub_webhook_data IS 'Raw webhook data from Sum & Substance';
COMMENT ON COLUMN kyc_verification.sumsub_review_result IS 'Review result data from Sum & Substance';
COMMENT ON COLUMN kyc_verification.sumsub_score IS 'Risk score from Sum & Substance (0-100)';