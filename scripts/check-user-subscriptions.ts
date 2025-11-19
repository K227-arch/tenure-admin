import { db } from '../lib/db';
import { subscriptions, users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkUserSubscriptions() {
  try {
    console.log('Checking user subscriptions...\n');
    
    // Get all users
    const allUsers = await db.select().from(users).limit(5);
    console.log(`Found ${allUsers.length} users (showing first 5)\n`);
    
    for (const user of allUsers) {
      console.log(`\n--- User: ${user.name || 'No name'} (${user.email}) ---`);
      console.log(`User ID: ${user.id}`);
      
      // Get subscriptions for this user
      const userSubs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id));
      
      if (userSubs.length === 0) {
        console.log('❌ No subscriptions found for this user');
      } else {
        console.log(`✅ Found ${userSubs.length} subscription(s):`);
        userSubs.forEach((sub, idx) => {
          console.log(`\n  Subscription ${idx + 1}:`);
          console.log(`    - ID: ${sub.id}`);
          console.log(`    - Status: ${sub.status}`);
          console.log(`    - Interval: ${sub.interval}`);
          console.log(`    - Amount: ${sub.amount}`);
          console.log(`    - Plan: ${sub.planName}`);
          console.log(`    - Current Period Start: ${sub.currentPeriodStart}`);
          console.log(`    - Current Period End: ${sub.currentPeriodEnd}`);
          console.log(`    - Created: ${sub.createdAt}`);
        });
      }
    }
    
    // Get total subscription stats
    console.log('\n\n=== Overall Statistics ===');
    const allSubs = await db.select().from(subscriptions);
    console.log(`Total subscriptions in database: ${allSubs.length}`);
    
    const monthly = allSubs.filter(s => s.interval === 'month');
    const yearly = allSubs.filter(s => s.interval === 'year');
    const active = allSubs.filter(s => s.status === 'active');
    
    console.log(`Monthly subscriptions: ${monthly.length}`);
    console.log(`Yearly subscriptions: ${yearly.length}`);
    console.log(`Active subscriptions: ${active.length}`);
    console.log(`Other intervals: ${allSubs.filter(s => s.interval !== 'month' && s.interval !== 'year').length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkUserSubscriptions();
