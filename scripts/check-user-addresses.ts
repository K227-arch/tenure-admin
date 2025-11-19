import { db } from '@/lib/db';
import { userAddresses, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkUserAddresses() {
  try {
    console.log('Checking user_addresses table...\n');

    // Get all addresses
    const addresses = await db.select().from(userAddresses);
    console.log(`Total addresses in database: ${addresses.length}\n`);

    if (addresses.length > 0) {
      console.log('Sample addresses:');
      addresses.slice(0, 5).forEach((addr, idx) => {
        console.log(`\n${idx + 1}. User ID: ${addr.userId}`);
        console.log(`   Address: ${addr.addressLine1}`);
        console.log(`   City: ${addr.city}, State: ${addr.state}`);
        console.log(`   Postal Code: ${addr.postalCode}`);
        console.log(`   Country: ${addr.country}`);
        console.log(`   Primary: ${addr.isPrimary}`);
      });
    } else {
      console.log('No addresses found in database.');
      console.log('\nLet me check if users exist...');
      
      const allUsers = await db.select().from(users);
      console.log(`Total users: ${allUsers.length}`);
      
      if (allUsers.length > 0) {
        console.log('\nUsers exist but no addresses. You need to add sample addresses.');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserAddresses();
