const express = require('express');
const { searchEvidenceAndSubmissions, exportToPDF, exportToCSV } = require('../controllers/searchController');
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

// Search endpoint
router.get('/search', authorizeRole('admin', 'investigator'), searchEvidenceAndSubmissions);

// Export endpoints
router.get('/export/pdf/:case_id', authorizeRole('admin', 'investigator'), exportToPDF);
router.get('/export/csv/:type', authorizeRole('admin', 'investigator'), exportToCSV);
router.get('/export/csv/:type/:case_id', authorizeRole('admin', 'investigator'), exportToCSV);

module.exports = router;
