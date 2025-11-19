import { supabaseAdmin } from '../lib/supabase/admin';

async function checkUserContacts() {
  try {
    console.log('Checking user_contacts table...\n');
    
    // Check if table exists
    const { data: contacts, error } = await supabaseAdmin
      .from('user_contacts')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error fetching user_contacts:', error);
      console.log('\nThe user_contacts table may not exist or has permission issues.');
      return;
    }
    
    console.log(`Found ${contacts?.length || 0} contact records (showing first 10):\n`);
    
    if (contacts && contacts.length > 0) {
      console.table(contacts.map(c => ({
        id: c.id?.substring(0, 8) + '...',
        user_id: c.user_id?.substring(0, 8) + '...',
        contact_type: c.contact_type,
        contact_value: c.contact_value,
        is_primary: c.is_primary,
        is_verified: c.is_verified,
      })));
      
      // Count by type
      const phoneContacts = contacts.filter(c => c.contact_type === 'phone');
      const emailContacts = contacts.filter(c => c.contact_type === 'email');
      
      console.log('\n=== Statistics ===');
      console.log(`Total contacts: ${contacts.length}`);
      console.log(`Phone contacts: ${phoneContacts.length}`);
      console.log(`Email contacts: ${emailContacts.length}`);
      console.log(`Primary contacts: ${contacts.filter(c => c.is_primary).length}`);
    } else {
      console.log('❌ No contacts found in user_contacts table');
      console.log('\nTo add sample data, run:');
      console.log(`
INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary) 
SELECT id, 'phone', '+1-555-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), true
FROM users 
LIMIT 5;
      `);
    }
    
    // Also check users table
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

checkUserContacts();
