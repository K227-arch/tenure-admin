import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllKYCStorage() {
  console.log('🔍 Checking all KYC storage structure...');
  console.log('');

  try {
    // 1. List all folders in kyc-images bucket
    console.log('1. Listing all folders in kyc-images bucket...');
    const { data: rootFiles, error: rootError } = await supabase
      .storage
      .from('kyc-images')
      .list('', { limit: 100 });

    if (rootError) {
      console.log('❌ Root storage error:', rootError);
      return;
    }

    console.log(`✅ Found ${rootFiles?.length || 0} items in root:`);
    
    for (const item of rootFiles || []) {
      console.log(`   📁 ${item.name} (${item.metadata?.size || 'folder'})`);
      
      // If it's a folder (user ID), list its contents
      if (!item.metadata?.size) {
        const { data: userFiles, error: userError } = await supabase
          .storage
          .from('kyc-images')
          .list(item.name, { limit: 100 });

        if (!userError && userFiles) {
          console.log(`      └── ${userFiles.length} items:`);
          for (const userItem of userFiles) {
            console.log(`          📁 ${userItem.name} (${userItem.metadata?.size || 'folder'})`);
            
            // If it's a KYC folder, list its contents
            if (!userItem.metadata?.size) {
              const { data: kycFiles, error: kycError } = await supabase
                .storage
                .from('kyc-images')
                .list(`${item.name}/${userItem.name}`, { limit: 100 });

              if (!kycError && kycFiles) {
                console.log(`              └── ${kycFiles.length} files:`);
                for (const file of kycFiles) {
                  console.log(`                  📄 ${file.name} (${file.metadata?.size} bytes)`);
                }
              }
            }
          }
        }
      }
    }

    // 2. Check specific user's storage
    const userId = 'c9fb20b0-ca61-43b9-a4d1-59add75f9116';
    console.log(`\n2. Checking specific user storage: ${userId}`);
    
    const { data: userFiles, error: userError } = await supabase
      .storage
      .from('kyc-images')
      .list(userId, { limit: 100 });

    if (userError) {
      console.log('❌ User storage error:', userError);
    } else {
      console.log(`✅ Found ${userFiles?.length || 0} items for user:`);
      userFiles?.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'folder'})`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAllKYCStorage();