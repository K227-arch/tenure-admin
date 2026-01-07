import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKycTableStructure() {
  try {
    console.log('Checking kyc_verification table structure...');
    
    // Get table structure using SQL query
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'kyc_verification' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (columnsError) {
      console.error('Error fetching columns with RPC:', columnsError);
      
      // Try alternative approach - just query the table directly
      console.log('Trying direct table query...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('kyc_verification')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('Error fetching sample data:', sampleError);
      } else {
        console.log('Sample record structure:');
        if (sampleData && sampleData.length > 0) {
          console.log('Columns in actual data:', Object.keys(sampleData[0]));
          console.log('Sample record:', sampleData[0]);
        } else {
          console.log('No records found in kyc_verification table');
        }
      }
      return;
    }

    console.log('kyc_verification table columns:');
    columns?.forEach((col: any) => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkKycTableStructure();