const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use /tmp for submissions on Vercel (ephemeral filesystem), or current dir locally
const submissionsFile = process.env.VERCEL 
  ? path.join('/tmp', 'submissions.json') 
  : path.join(__dirname, 'submissions.json');

// Admin token for basic protection of the admin API. Set via environment:
// PowerShell: $env:ADMIN_TOKEN = 'your-secret'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'devtoken';

function saveSubmission(data) {
  let arr = [];
  try {
    if (fs.existsSync(submissionsFile)) {
      const raw = fs.readFileSync(submissionsFile, 'utf8');
      arr = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    console.error('Error reading submissions file', err);
  }
  arr.push(data);
  try {
    fs.writeFileSync(submissionsFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing submissions file', err);
  }
}

app.post('/api/contact', (req, res) => {
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

  const submission = {
    name: String(name).trim(),
    email: String(email).trim(),
    age: Number(age),
    // DO NOT store raw passwords in production; redacting here
    password: '[REDACTED]',
    role,
    recommend,
    comments: comments || '',
    lang: lang || [],
    receivedAt: new Date().toISOString()
  };

  saveSubmission(submission);

  res.json({ message: 'Submission received', submissionId: Date.now() });
});

// Protected endpoint to list submissions. Provide the admin token in the
// `x-admin-token` header. This is intentionally simple for demo purposes.
app.get('/api/submissions', (req, res) => {
  const token = req.header('x-admin-token');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (!fs.existsSync(submissionsFile)) return res.json([]);
    const raw = fs.readFileSync(submissionsFile, 'utf8') || '[]';
    const arr = JSON.parse(raw);
    return res.json(arr);
  } catch (err) {
    console.error('Error reading submissions file', err);
    return res.status(500).json({ error: 'Unable to read submissions' });
  }
});

// Serve static files (so you can open http://localhost:3000/form.html)
app.use(express.static(path.join(__dirname)));

// Export for Vercel serverless
module.exports = app;

// Only listen locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}
