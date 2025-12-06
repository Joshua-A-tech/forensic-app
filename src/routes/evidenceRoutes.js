const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadEvidence, getEvidenceByCase, downloadEvidence } = require('../controllers/evidenceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB default
  cb(null, true); // Accept all files; size check is in multer limits
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 },
});

router.use(authenticateToken);

router.post('/upload', uploadLimiter, authorizeRole('admin', 'investigator'), upload.single('file'), uploadEvidence);
router.get('/case/:case_id', getEvidenceByCase);
router.get('/download/:id', downloadEvidence);

module.exports = router;
