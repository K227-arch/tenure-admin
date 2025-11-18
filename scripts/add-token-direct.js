const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function addColumn() {
  try {
    console.log('Adding token column to admin_sessions...\n');
    
    await sql`
      ALTER TABLE admin_sessions 
      ADD COLUMN IF NOT EXISTS token TEXT UNIQUE
    `;
    
    console.log('✅ Token column added successfully\n');
    
    // Verify
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'admin_sessions'
      ORDER BY ordinal_position
    `;
    
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

addColumn();
