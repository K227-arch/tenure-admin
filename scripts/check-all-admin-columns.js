const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function checkColumns() {
  try {
    console.log('Checking admin table structure...\n');
    
    const adminCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'admin'
      ORDER BY ordinal_position
    `;
    
    console.log('Admin table columns:');
    adminCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n---\n');
    
    // Check admin_sessions
    const sessionCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'admin_sessions' AND column_name = 'admin_id'
    `;
    
    console.log('admin_sessions.admin_id:');
    sessionCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check admin_2fa_codes
    const tfaCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'admin_2fa_codes' AND column_name = 'admin_id'
    `;
    
    console.log('\nadmin_2fa_codes.admin_id:');
    tfaCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check audit_logs
    const auditCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'admin_id'
    `;
    
    console.log('\naudit_logs.admin_id:');
    auditCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkColumns();
