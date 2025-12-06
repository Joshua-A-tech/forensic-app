const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
try {
  pool = require('./src/config/db');
} catch (err) {
  console.warn('Database connection failed:', err.message);
}

const { apiLimiter } = require('./src/middleware/rateLimiter');

// Routes (conditionally loaded)
let authRoutes, caseRoutes, evidenceRoutes, submissionRoutes, searchRoutes;
if (pool) {
  try {
    authRoutes = require('./src/routes/authRoutes');
    caseRoutes = require('./src/routes/caseRoutes');
    evidenceRoutes = require('./src/routes/evidenceRoutes');
    submissionRoutes = require('./src/routes/submissionRoutes');
    searchRoutes = require('./src/routes/searchRoutes');
  } catch (err) {
    console.warn('Error loading routes:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Ensure uploads directory exists (if local storage)
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create upload directory:', err.message);
  }
}

// Serve static files from `public/` so Vercel serves frontend assets correctly
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  const status = pool ? 'healthy' : 'degraded (no database)';
  res.json({ 
    status, 
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'not configured'
  });
});

// API Routes
if (pool && authRoutes && caseRoutes && evidenceRoutes && submissionRoutes && searchRoutes) {
  app.use('/api/auth', authRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api/evidence', evidenceRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/search', searchRoutes);
}

// If database is not configured, provide a file-backed fallback for submissions
const submissionsFile = pool
  ? null
  : path.join(process.env.VERCEL ? '/tmp' : __dirname, 'submissions.json');

const readSubmissionsFile = () => {
  try {
    if (!fs.existsSync(submissionsFile)) return [];
    const raw = fs.readFileSync(submissionsFile, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read submissions file:', err.message);
    return [];
  }
};

const writeSubmissionsFile = (arr) => {
  try {
    fs.writeFileSync(submissionsFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write submissions file:', err.message);
  }
};

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
    // If DB available, store there; otherwise fallback to file-backed storage
    if (pool) {
      const result = await pool.query(
        'INSERT INTO submissions (name, email, age, role, recommend, comments, languages) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [name.trim(), email.trim(), Number(age), role, recommend, comments || '', JSON.stringify(lang || [])]
      );
      return res.json({ message: 'Submission received', submissionId: result.rows[0].id });
    }

    // Fallback: append to submissions.json
    const submissions = readSubmissionsFile();
    const id = Date.now();
    const item = {
      id,
      name: String(name).trim(),
      email: String(email).trim(),
      age: Number(age),
      role,
      recommend,
      comments: comments || '',
      languages: lang || [],
      receivedAt: new Date().toISOString(),
    };
    submissions.push(item);
    writeSubmissionsFile(submissions);
    return res.json({ message: 'Submission received (file fallback)', submissionId: id });
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
  // If DB is available, point to the normal submissions endpoint (handled by routes)
  if (pool) {
    return res.json({ message: 'Database is configured; use GET /api/submissions with auth' });
  }

  // Fallback: return file-backed submissions
  if (!submissionsFile) return res.json([]);
  const submissions = readSubmissionsFile();
  return res.json(submissions);
});

// When no database is configured, expose a protected GET /api/submissions endpoint
// that returns stored submissions from the file fallback so admins can still view data.
if (!pool) {
  app.get('/api/submissions', (req, res) => {
    const token = req.header('x-admin-token');
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const submissions = readSubmissionsFile();
    return res.json(submissions);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Database connection error
  if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({ 
      error: 'Database connection failed',
      message: 'The database server is not responding. Please check DATABASE_URL configuration.'
    });
  }
  
  // Authentication error
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
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
