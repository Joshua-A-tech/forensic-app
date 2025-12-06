const express = require('express');
const { createCase, getCases, getCaseById, updateCase } = require('../controllers/caseController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

const checkDatabase = (req, res, next) => {
  const pool = require('../config/db');
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured', message: 'Set DATABASE_URL environment variable' });
  }
  next();
};

router.use(checkDatabase);
router.use(authenticateToken);

router.post('/', authorizeRole('admin', 'investigator'), createCase);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.put('/:id', authorizeRole('admin', 'investigator'), updateCase);

module.exports = router;
