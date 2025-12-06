const express = require('express');
const { createCase, getCases, getCaseById, updateCase } = require('../controllers/caseController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRole('admin', 'investigator'), createCase);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.put('/:id', authorizeRole('admin', 'investigator'), updateCase);

module.exports = router;
