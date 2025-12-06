const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const token = req.headers['x-admin-token'] || req.headers['x-admin-token'.toLowerCase()];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return res.status(500).json({ error: 'Migrations directory not found' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const results = [];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        results.push({ file, status: 'ok' });
      } catch (err) {
        await client.query('ROLLBACK');
        results.push({ file, status: 'error', error: err.message });
        // stop on first failure
        break;
      }
    }

    const failed = results.find(r => r.status === 'error');
    if (failed) {
      return res.status(500).json({ success: false, results });
    }

    return res.json({ success: true, results });
  } catch (err) {
    console.error('Migration endpoint error', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
    try { await pool.end(); } catch (e) { /* ignore */ }
  }
};
