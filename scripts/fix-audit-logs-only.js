const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function fixAuditLogs() {
  try {
    console.log('Checking audit_logs.admin_id type...\n');
    
    const check = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'admin_id'
    `;
    
    console.log('Current type:');
    check.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    if (check[0]?.data_type === 'uuid') {
      console.log('\nFixing to INTEGER...');
      
      await sql`ALTER TABLE audit_logs DROP COLUMN admin_id CASCADE`;
      await sql`ALTER TABLE audit_logs ADD COLUMN admin_id INTEGER REFERENCES admin(id) ON DELETE SET NULL`;
      
      console.log('✅ Fixed!\n');
      
      const verify = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'admin_id'
      `;
      
      console.log('New type:');
      verify.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('\n✅ Already INTEGER');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixAuditLogs();
