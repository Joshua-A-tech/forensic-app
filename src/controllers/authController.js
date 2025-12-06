const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { validateUserInput } = require('../utils/validators');
const { logAuditEvent } = require('../utils/helpers');

const register = async (req, res) => {
  try {
    const { username, email, password, role = 'investigator' } = req.body;
    
    // Validate input
    const errors = validateUserInput({ username, email, password });
    if (Object.keys(errors).length) {
      return res.status(400).json({ errors });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, passwordHash, role]
    );

    await logAuditEvent(pool, result.rows[0].id, 'USER_REGISTERED', 'users', result.rows[0].id, null, req.ip);

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query('SELECT id, username, email, password_hash, role FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      await logAuditEvent(pool, user.id, 'LOGIN_FAILED', 'users', user.id, 'Invalid password', req.ip);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    await logAuditEvent(pool, user.id, 'LOGIN_SUCCESS', 'users', user.id, null, req.ip);

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { register, login };
