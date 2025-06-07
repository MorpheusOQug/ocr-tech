/**
 * Mail Service
 * 
 * This service handles sending emails, particularly for user verification.
 * It uses nodemailer with Gmail as the default email provider.
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const mailConfig = require('../config/mail');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: mailConfig.service,
    auth: {
      user: mailConfig.senderEmail,
      pass: mailConfig.senderPassword
    }
  });
};

/**
 * Send verification email with a code
 * 
 * @param {string} toEmail - The recipient's email address
 * @param {string} verificationCode - The verification code to send
 * @returns {Promise} - A promise that resolves when the email is sent
 */
const sendVerificationEmail = async (toEmail, verificationCode) => {
  try {
    const transporter = createTransporter();
    const expiryMinutes = mailConfig.verification.expiryTime / 60;

    const mailOptions = {
      from: `"${mailConfig.senderName}" <${mailConfig.senderEmail}>`,
      to: toEmail,
      subject: mailConfig.verification.subject,
      text: `Your verification code is: ${verificationCode}\n\nThis code will expire in ${expiryMinutes} minute${expiryMinutes !== 1 ? 's' : ''}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2a6dc5; text-align: center;">${mailConfig.senderName} Email Verification</h2>
          <p style="font-size: 16px; color: #333;">Thank you for registering with ${mailConfig.senderName}. Please use the verification code below to complete your registration:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2a6dc5;">${verificationCode}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in <strong>${expiryMinutes} minute${expiryMinutes !== 1 ? 's' : ''}</strong>.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this code, you can safely ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} ${mailConfig.senderName}. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // If HTML is disabled in config, don't send HTML content
    if (!mailConfig.verification.useHtml) {
      delete mailOptions.html;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${toEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending verification email to ${toEmail}: ${error.message}`);
    throw error;
  }
};

/**
 * Send a generic email
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body (optional)
 * @returns {Promise} - A promise that resolves when the email is sent
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${mailConfig.senderName}" <${mailConfig.senderEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text
    };

    // Only add HTML if provided and HTML emails are enabled
    if (options.html && mailConfig.verification.useHtml) {
      mailOptions.html = options.html;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${options.to}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendEmail
}; 