const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  generateVerificationCode_API, 
  verifyEmail 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get user profile (protected route)
router.get('/profile', protect, getUserProfile);

// Email verification routes
router.post('/verify/generate-code', generateVerificationCode_API);
router.post('/verify/verify-code', verifyEmail);

module.exports = router; 