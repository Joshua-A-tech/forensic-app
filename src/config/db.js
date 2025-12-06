const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL && !process.env.DB_USER) {
  console.warn('⚠️  DATABASE_URL or DB_* environment variables not set. Database will not be available.');
  module.exports = null;
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  module.exports = pool;
}
