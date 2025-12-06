const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('./src/config/db');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const caseRoutes = require('./src/routes/caseRoutes');
const evidenceRoutes = require('./src/routes/evidenceRoutes');
const submissionRoutes = require('./src/routes/submissionRoutes');
const searchRoutes = require('./src/routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/search', searchRoutes);

// Legacy endpoint for backward compatibility (contact form)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, age, password, role, recommend, comments, lang } = req.body;
    const errors = {};

    if (!name || !String(name).trim()) errors.name = 'Please enter your name';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email';
    if (age === undefined || age === null || String(age).trim() === '') errors.age = 'Please enter your age';
    else if (Number(age) < 0 || Number(age) > 120) errors.age = 'Enter a valid age';
    if (!password || String(password).length < 6) errors.password = 'Password must be at least 6 characters';
    if (!role) errors.role = 'Please select a role';
    if (!recommend) errors.recommend = 'Please choose an option';

    if (Object.keys(errors).length) {
      return res.status(400).json({ errors });
    }

    // Store in database
    const result = await pool.query(
      'INSERT INTO submissions (name, email, age, role, recommend, comments, languages) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [name.trim(), email.trim(), Number(age), role, recommend, comments || '', JSON.stringify(lang || [])]
    );

    res.json({ message: 'Submission received', submissionId: result.rows[0].id });
  } catch (error) {
    console.error('Contact submission error:', error.message);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Legacy endpoint: get submissions with admin token
app.get('/api/submissions-legacy', (req, res) => {
  const token = req.header('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ message: 'Use POST /api/submissions instead for authenticated access' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Export for Vercel serverless
module.exports = app;

// Listen locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Forensic App API listening on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST   /api/auth/register - Register new user');
    console.log('  POST   /api/auth/login - Login');
    console.log('  POST   /api/cases - Create case');
    console.log('  GET    /api/cases - Get all cases');
    console.log('  GET    /api/cases/:id - Get case by ID');
    console.log('  PUT    /api/cases/:id - Update case');
    console.log('  POST   /api/evidence/upload - Upload evidence');
    console.log('  GET    /api/evidence/case/:case_id - Get evidence for case');
    console.log('  GET    /api/evidence/download/:id - Download evidence');
    console.log('  GET    /api/submissions - Get all submissions (admin only)');
    console.log('  POST   /api/submissions - Create submission');
    console.log('  GET    /api/search/search - Search evidence & submissions');
    console.log('  GET    /api/search/export/pdf/:case_id - Export case to PDF');
    console.log('  GET    /api/search/export/csv/:type - Export to CSV');
    console.log('  POST   /api/contact - Legacy contact form endpoint');
  });
}
