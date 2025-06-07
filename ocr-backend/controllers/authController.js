const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const mailService = require('../services/mailService');
const mailConfig = require('../config/mail');

// In-memory store for verification codes with TTL (simulating Redis)
// In a production environment, use actual Redis!
const verificationCodes = {};

// Helper to generate a random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to set expiry and cleanup for verification codes
const setVerificationCodeWithExpiry = (email, code) => {
  // Store code with timestamp
  verificationCodes[email] = {
    code,
    expiresAt: Date.now() + (mailConfig.verification.expiryTime * 1000)
  };
  
  // Set timeout to delete the code after expiry time
  setTimeout(() => {
    if (verificationCodes[email] && verificationCodes[email].code === code) {
      delete verificationCodes[email];
      logger.info(`Verification code for ${email} expired and removed from storage`);
    }
  }, mailConfig.verification.expiryTime * 1000);
  
  return code;
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Password will be hashed by the pre-save hook
      isVerified: false
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Generate and send verification code
    await sendVerificationCode(user.email);

    // Return user info and token
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      token,
    });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Please provide username/email and password' });
    }

    // Check if input is email (contains @ and a domain)
    const isEmail = usernameOrEmail.includes('@') && usernameOrEmail.includes('.');
    
    // Find user by username or email based on input format
    let user;
    if (isEmail) {
      user = await User.findOne({ email: usernameOrEmail });
    } else {
      user = await User.findOne({ username: usernameOrEmail });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user info and token
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      token,
    });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error(`Error getting user profile: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Send verification code to user's email
const sendVerificationCode = async (email) => {
  try {
    // Generate a new verification code
    const verificationCode = generateVerificationCode();
    
    // Store the code with expiry
    setVerificationCodeWithExpiry(email, verificationCode);
    
    // Send the code via email
    await mailService.sendVerificationEmail(email, verificationCode);
    
    logger.info(`Verification code sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending verification code to ${email}: ${error.message}`);
    throw error;
  }
};

// Generate and send verification code
const generateVerificationCode_API = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if email exists in our user database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }
    
    // Check if verification code was recently sent (optional rate limiting)
    const existingCode = verificationCodes[email];
    if (existingCode && existingCode.expiresAt > Date.now()) {
      // Get remaining seconds
      const remainingSeconds = Math.ceil((existingCode.expiresAt - Date.now()) / 1000);
      return res.status(429).json({ 
        message: 'Verification code already sent',
        retryAfter: remainingSeconds
      });
    }
    
    // Generate and send new code
    await sendVerificationCode(email);
    
    res.status(200).json({ message: 'Verification code sent successfully' });
  } catch (error) {
    logger.error(`Error generating verification code: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Verify email with code
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Check if verification code is valid
    const storedVerification = verificationCodes[email];
    if (!storedVerification) {
      return res.status(400).json({ message: 'Verification code has expired or does not exist' });
    }
    
    if (storedVerification.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Check if code is expired
    if (storedVerification.expiresAt < Date.now()) {
      // Clean up expired code
      delete verificationCodes[email];
      return res.status(400).json({ message: 'Verification code has expired' });
    }
    
    // Update user to verified
    user.isVerified = true;
    await user.save();
    
    // Clean up used verification code
    delete verificationCodes[email];
    
    // Return success
    res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    logger.error(`Error verifying email: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  generateVerificationCode_API,
  verifyEmail
}; 