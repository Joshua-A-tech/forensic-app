const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { getFileMetadata, logAuditEvent } = require('../utils/helpers');

const uploadEvidence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { case_id } = req.body;
    const { filename, path: filePath, size, mimetype } = req.file;

    if (!case_id) {
      fs.unlinkSync(filePath); // Clean up
      return res.status(400).json({ error: 'Case ID is required' });
    }

    // Verify case exists
    const caseResult = await pool.query('SELECT id FROM cases WHERE id = $1', [case_id]);
    if (caseResult.rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get file metadata
    const metadata = await getFileMetadata(filePath);

    // Store in database
    const result = await pool.query(
      'INSERT INTO evidence (case_id, filename, file_path, file_hash, file_size, file_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [case_id, filename, filePath, metadata.hash, size, metadata.type, req.user.id]
    );

    await logAuditEvent(pool, req.user.id, 'EVIDENCE_UPLOADED', 'evidence', result.rows[0].id, filename, req.ip);

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence: {
        id: result.rows[0].id,
        filename: result.rows[0].filename,
        file_hash: result.rows[0].file_hash,
        file_size: result.rows[0].file_size,
        uploaded_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload evidence error:', error.message);
    res.status(500).json({ error: 'Failed to upload evidence' });
  }
};

const getEvidenceByCase = async (req, res) => {
  try {
    const { case_id } = req.params;

    const result = await pool.query(
      'SELECT id, case_id, filename, file_hash, file_size, file_type, uploaded_by, created_at FROM evidence WHERE case_id = $1 ORDER BY created_at DESC',
      [case_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get evidence error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve evidence' });
  }
};

const downloadEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT file_path, filename FROM evidence WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    const { file_path, filename } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    await logAuditEvent(pool, req.user.id, 'EVIDENCE_DOWNLOADED', 'evidence', id, filename, req.ip);

    res.download(file_path, filename);
  } catch (error) {
    console.error('Download evidence error:', error.message);
    res.status(500).json({ error: 'Failed to download evidence' });
  }
};

module.exports = { uploadEvidence, getEvidenceByCase, downloadEvidence };
