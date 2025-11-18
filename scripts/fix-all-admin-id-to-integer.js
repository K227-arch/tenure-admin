const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function fixAllTables() {
  try {
    console.log('Fixing all admin_id columns to INTEGER...\n');
    
    // Fix admin_sessions
    console.log('1. Fixing admin_sessions...');
    await sql`ALTER TABLE admin_sessions DROP COLUMN IF EXISTS admin_id CASCADE`;
    await sql`ALTER TABLE admin_sessions ADD COLUMN admin_id INTEGER NOT NULL REFERENCES admin(id) ON DELETE CASCADE`;
    console.log('   ✅ admin_sessions.admin_id is now INTEGER\n');
    
    // Fix admin_2fa_codes
    console.log('2. Fixing admin_2fa_codes...');
    await sql`ALTER TABLE admin_2fa_codes DROP COLUMN IF EXISTS admin_id CASCADE`;
    await sql`ALTER TABLE admin_2fa_codes ADD COLUMN admin_id INTEGER NOT NULL REFERENCES admin(id) ON DELETE CASCADE`;
    console.log('   ✅ admin_2fa_codes.admin_id is now INTEGER\n');
    
    // Fix audit_logs
    console.log('3. Fixing audit_logs...');
    await sql`ALTER TABLE audit_logs DROP COLUMN IF EXISTS admin_id CASCADE`;
    await sql`ALTER TABLE audit_logs ADD COLUMN admin_id INTEGER REFERENCES admin(id) ON DELETE SET NULL`;
    console.log('   ✅ audit_logs.admin_id is now INTEGER\n');
    
    console.log('All tables fixed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixAllTables();
