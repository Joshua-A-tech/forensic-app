const express = require('express');
const { register, login } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);

module.exports = router;
