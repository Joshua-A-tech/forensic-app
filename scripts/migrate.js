const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const migrationsDir = path.join(__dirname, '..', 'migrations');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');

    // Create tables if they don't exist
    const files = fs.readdirSync(migrationsDir).sort();
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Executing ${file}...`);
        await client.query(sql);
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
