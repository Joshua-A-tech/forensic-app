const express = require('express');
const { register, login } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Middleware to check if database is available
const checkDatabase = (req, res, next) => {
  const pool = require('../config/db');
  if (!pool) {
    return res.status(503).json({ 
      error: 'Database not configured',
      message: 'Set DATABASE_URL environment variable to use authentication'
    });
  }
  next();
};

router.post('/register', checkDatabase, register);
router.post('/login', checkDatabase, loginLimiter, login);

module.exports = router;
