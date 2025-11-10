import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminRoles() {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from('admin')
      .select('email, role, status, name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n=== Admin Accounts ===\n');
    console.log('Total admins:', admins?.length || 0);
    console.log('\nRole breakdown:');
    
    const roleCounts: Record<string, number> = {};
    admins?.forEach(admin => {
      const role = admin.role || 'null';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log('\n=== Individual Accounts ===\n');
    admins?.forEach(admin => {
      console.log(`Email: ${admin.email}`);
      console.log(`  Name: ${admin.name || 'N/A'}`);
      console.log(`  Role: ${admin.role || 'NULL'}`);
      console.log(`  Status: ${admin.status || 'NULL'}`);
      console.log(`  Created: ${new Date(admin.created_at).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('Failed to check admin roles:', error);
  }
}

checkAdminRoles();
