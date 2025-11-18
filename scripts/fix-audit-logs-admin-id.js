const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function fixColumn() {
  try {
    console.log('Changing admin_id column type in audit_logs to UUID...\n');
    
    // First, drop the column if it has data that can't be converted
    await sql`
      ALTER TABLE audit_logs 
      DROP COLUMN IF EXISTS admin_id
    `;
    
    console.log('✅ Dropped admin_id column');
    
    // Add it back as UUID
    await sql`
      ALTER TABLE audit_logs 
      ADD COLUMN admin_id UUID REFERENCES admin(id) ON DELETE SET NULL
    `;
    
    console.log('✅ Added admin_id as UUID\n');
    
    // Verify
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'admin_id'
    `;
    
    console.log('Column info:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixColumn();
