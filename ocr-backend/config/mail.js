/**
 * Mail Configuration
 * 
 * This file contains configuration for email functionality.
 * It loads necessary environment variables and provides defaults.
 */

require('dotenv').config();

// Mail configuration object with defaults
const mailConfig = {
  // Mail provider service (e.g., 'gmail', 'sendgrid', etc.)
  service: process.env.EMAIL_SERVICE || 'gmail',
  
  // Sender email address
  senderEmail: process.env.EMAIL_USER || 'qahp955@gmail.com', //change this to your email

  // Sender app password
  senderPassword: process.env.EMAIL_PASSWORD || 'yodo bsdd ejup chca', // Set this in your environment variables
  
  // Sender name displayed in emails
  senderName: process.env.EMAIL_SENDER_NAME || 'OCR Tech',
  
  // Email verification settings
  verification: {
    // Subject line for verification emails
    subject: process.env.EMAIL_VERIFICATION_SUBJECT || 'Verify Your OCR Tech Account',
    
    // Expiration time for verification codes (in seconds)
    expiryTime: parseInt(process.env.VERIFICATION_CODE_EXPIRY || '60', 10),
    
    // Whether to use HTML emails (true) or plain text (false)
    useHtml: process.env.EMAIL_USE_HTML !== 'false'
  }
};

module.exports = mailConfig; 