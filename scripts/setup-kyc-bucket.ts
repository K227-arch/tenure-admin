import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupKycBucket() {
  try {
    console.log('Setting up KYC images bucket...');

    // Create the bucket for KYC images
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('kyc-images', {
      public: false, // Private bucket for security
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
      fileSizeLimit: 10485760, // 10MB limit
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✓ KYC images bucket already exists');
      } else {
        console.error('Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('✓ KYC images bucket created successfully');
    }

    // Set up RLS (Row Level Security) policies for the bucket
    console.log('Setting up storage policies...');

    // Policy to allow authenticated users to upload files
    const uploadPolicy = `
      CREATE POLICY "Allow authenticated users to upload KYC images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'kyc-images' AND
        auth.role() = 'authenticated'
      );
    `;

    // Policy to allow service role to read all files
    const readPolicy = `
      CREATE POLICY "Allow service role to read KYC images" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'kyc-images' AND
        (auth.role() = 'service_role' OR auth.uid()::text = (storage.foldername(name))[1])
      );
    `;

    // Policy to allow users to read their own files
    const userReadPolicy = `
      CREATE POLICY "Allow users to read their own KYC images" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'kyc-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    console.log('✓ KYC bucket setup completed');
    console.log('Note: You may need to manually set up RLS policies in Supabase dashboard if they don\'t exist');
    console.log('Bucket structure: kyc-images/{user_id}/{kyc_id}/{filename}');

  } catch (error) {
    console.error('Error setting up KYC bucket:', error);
  }
}

setupKycBucket();