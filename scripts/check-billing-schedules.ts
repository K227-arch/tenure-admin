import { supabaseAdmin } from '../lib/supabase/admin';

async function checkBillingSchedules() {
  try {
    console.log('Checking user_billing_schedules table...\n');
    
    // Check billing schedules
    const { data: schedules, error } = await supabaseAdmin
      .from('user_billing_schedules')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error fetching billing schedules:', error);
      return;
    }
    
    console.log(`Found ${schedules?.length || 0} billing schedules (showing first 10):\n`);
    
    if (schedules && schedules.length > 0) {
      console.table(schedules.map(s => ({
        user_id: s.user_id?.substring(0, 8) + '...',
        billing_cycle: s.billing_cycle,
        amount: s.amount,
        next_billing_date: s.next_billing_date,
        is_active: s.is_active,
        created_at: s.created_at,
      })));
      
      // Stats
      const monthly = schedules.filter(s => s.billing_cycle === 'monthly');
      const yearly = schedules.filter(s => s.billing_cycle === 'yearly' || s.billing_cycle === 'annual');
      const active = schedules.filter(s => s.is_active);
      
      console.log('\n=== Statistics ===');
      console.log(`Total schedules: ${schedules.length}`);
      console.log(`Monthly: ${monthly.length}`);
      console.log(`Yearly/Annual: ${yearly.length}`);
      console.log(`Active: ${active.length}`);
    } else {
      console.log('❌ No billing schedules found');
      console.log('\nTo add sample data, run the SQL below or use the setup script.');
    }
    
    // Also check users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .limit(5);
    
    console.log(`\n\n=== Sample Users (first 5) ===`);
    if (users && users.length > 0) {
      console.table(users.map(u => ({
        id: u.id?.substring(0, 8) + '...',
        email: u.email,
        name: u.name || 'No name',
      })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkBillingSchedules();
