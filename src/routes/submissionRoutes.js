const express = require('express');
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Get all submissions (admin only)
router.get('/', authorizeRole('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(
      'SELECT * FROM submissions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get submissions error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
});

// Create submission (public endpoint, no auth required for backward compatibility)
router.post('/', async (req, res) => {
  try {
    const { name, email, age, role, recommend, comments, languages, case_id } = req.body;
    const errors = {};

    if (!name || !String(name).trim()) errors.name = 'Please enter your name';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email';
    if (age === undefined || age === null || Number(age) < 0 || Number(age) > 120) errors.age = 'Enter a valid age';
    if (!role) errors.role = 'Please select a role';
    if (!recommend) errors.recommend = 'Please choose an option';

    if (Object.keys(errors).length) {
      return res.status(400).json({ errors });
    }

    const result = await pool.query(
      'INSERT INTO submissions (name, email, age, role, recommend, comments, languages, case_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at',
      [name.trim(), email.trim(), age, role, recommend, comments || '', JSON.stringify(languages || []), case_id || null]
    );

    res.status(201).json({ message: 'Submission received', submissionId: result.rows[0].id });
  } catch (error) {
    console.error('Create submission error:', error.message);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

module.exports = router;
