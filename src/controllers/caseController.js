const pool = require('../config/db');
const { validateCaseInput } = require('../utils/validators');
const { logAuditEvent } = require('../utils/helpers');

const createCase = async (req, res) => {
  try {
    const { case_number, title, description, assigned_to } = req.body;
    
    const errors = validateCaseInput({ case_number, title, assigned_to });
    if (Object.keys(errors).length) {
      return res.status(400).json({ errors });
    }

    const result = await pool.query(
      'INSERT INTO cases (case_number, title, description, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [case_number, title, description, assigned_to, req.user.id]
    );

    await logAuditEvent(pool, req.user.id, 'CASE_CREATED', 'cases', result.rows[0].id, null, req.ip);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create case error:', error.message);
    res.status(500).json({ error: 'Failed to create case' });
  }
};

const getCases = async (req, res) => {
  try {
    const { status, assigned_to, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM cases WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND assigned_to = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get cases error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve cases' });
  }
};

const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const caseResult = await pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const evidenceResult = await pool.query('SELECT id, filename, file_hash, file_size, file_type, created_at FROM evidence WHERE case_id = $1', [id]);

    res.json({
      ...caseResult.rows[0],
      evidence: evidenceResult.rows,
    });
  } catch (error) {
    console.error('Get case error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve case' });
  }
};

const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, title, description } = req.body;

    const result = await pool.query(
      'UPDATE cases SET status = COALESCE($1, status), assigned_to = COALESCE($2, assigned_to), title = COALESCE($3, title), description = COALESCE($4, description), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [status, assigned_to, title, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await logAuditEvent(pool, req.user.id, 'CASE_UPDATED', 'cases', id, JSON.stringify({ status, assigned_to }), req.ip);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update case error:', error.message);
    res.status(500).json({ error: 'Failed to update case' });
  }
};

module.exports = { createCase, getCases, getCaseById, updateCase };
