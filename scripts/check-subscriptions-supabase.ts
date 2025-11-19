import { supabaseAdmin } from '../lib/supabase/admin';

async function checkSubscriptions() {
  try {
    console.log('Checking subscriptions via Supabase...\n');
    
    // Get all subscriptions
    const { data: subs, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error fetching subscriptions:', error);
      return;
    }
    
    console.log(`Found ${subs?.length || 0} subscriptions (showing first 10):\n`);
    
    if (subs && subs.length > 0) {
      subs.forEach((sub, idx) => {
        console.log(`Subscription ${idx + 1}:`);
        console.log(`  - User ID: ${sub.user_id}`);
        console.log(`  - Status: ${sub.status}`);
        console.log(`  - Interval: ${sub.interval}`);
        console.log(`  - Amount: ${sub.amount}`);
        console.log(`  - Plan: ${sub.plan_name}`);
        console.log(`  - Current Period Start: ${sub.current_period_start}`);
        console.log(`  - Current Period End: ${sub.current_period_end}`);
        console.log('');
      });
      
      // Stats
      const monthly = subs.filter(s => s.interval === 'month');
      const yearly = subs.filter(s => s.interval === 'year');
      const active = subs.filter(s => s.status === 'active');
      
      console.log('\n=== Statistics ===');
      console.log(`Monthly: ${monthly.length}`);
      console.log(`Yearly: ${yearly.length}`);
      console.log(`Active: ${active.length}`);
      console.log(`Other intervals: ${subs.filter(s => s.interval !== 'month' && s.interval !== 'year').map(s => s.interval).join(', ')}`);
    } else {
      console.log('❌ No subscriptions found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkSubscriptions();
