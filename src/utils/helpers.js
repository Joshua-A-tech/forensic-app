const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

const getFileMetadata = async (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const hash = await calculateFileHash(filePath);
    const ext = path.extname(filePath).substring(1);
    return {
      size: stats.size,
      hash,
      type: ext || 'unknown',
      created_at: stats.birthtime,
      modified_at: stats.mtime,
    };
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error.message}`);
  }
};

const logAuditEvent = async (pool, userId, action, resourceType, resourceId, details, ipAddress) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, action, resourceType, resourceId, details, ipAddress]
    );
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = { calculateFileHash, getFileMetadata, logAuditEvent };
