const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function checkAdminId() {
  try {
    console.log('Checking admin table id column type...\n');
    
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'admin' AND column_name = 'id'
    `;
    
    console.log('Admin table id column:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkAdminId();
