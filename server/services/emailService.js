const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if all required environment variables are present
      const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      logger.info('📧 Initializing email service with Gmail SMTP...');
      logger.info('📧 SMTP Configuration:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.FROM_EMAIL
      });

      // ✅ FIX: Changed createTransporter to createTransport
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // false for 587, true for 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Add these options for Gmail
        tls: {
          rejectUnauthorized: false
        }
      });

      // Test connection in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('📧 Testing SMTP connection...');
        await this.transporter.verify();
        logger.info('📧 ✅ Email service initialized successfully - Gmail SMTP connection verified!');
      } else {
        logger.info('📧 ✅ Email service initialized (production mode - connection not tested)');
      }
    } catch (error) {
      logger.error('📧 ❌ Email service initialization failed:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      
      // Don't break the app if email fails - set transporter to null for fallback
      this.transporter = null;
      
      // Log specific Gmail troubleshooting info
      if (error.code === 'EAUTH') {
        logger.error('📧 ❌ Gmail Authentication Failed - Check your app password!');
        logger.error('📧 💡 Make sure you:');
        logger.error('📧    1. Have 2FA enabled on your Gmail account');
        logger.error('📧    2. Generated an App Password (not your regular password)');
        logger.error('📧    3. Are using the correct Gmail address');
      } else if (error.code === 'ENOTFOUND') {
        logger.error('📧 ❌ DNS/Network Error - Check your internet connection');
      } else if (error.code === 'ECONNECTION') {
        logger.error('📧 ❌ Connection Error - Gmail SMTP might be blocked');
      }
    }
  }

  async sendPasswordReset(email, token) {
    if (!this.transporter) {
      logger.warn('📧 ⚠️ Email service not available, falling back to development mode');
      return false;
    }

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: `"SpendWise" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Password Reset - SpendWise',
        html: this.getPasswordResetTemplate(resetUrl, email),
        text: this.getPasswordResetTextTemplate(resetUrl)
      };

      logger.info('📧 Attempting to send password reset email...', { email });
      await this.transporter.sendMail(mailOptions);
      logger.info('📧 ✅ Password reset email sent successfully:', { email });
      return true;
    } catch (error) {
      logger.error('📧 ❌ Failed to send password reset email:', {
        email,
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  getPasswordResetTemplate(resetUrl, email) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - SpendWise</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
          .logo span { color: white; font-size: 24px; font-weight: bold; }
          .title { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 20px; }
          .message { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .url { color: #667eea; word-break: break-all; font-size: 14px; }
          .footer { border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; color: #718096; font-size: 12px; }
          .warning { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span>S</span>
            </div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p class="message">Hello,</p>
            
            <p class="message">
              We received a request to reset your password for your SpendWise account (<strong>${email}</strong>).
            </p>
            
            <p class="message">
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            
            <p class="message">
              Or copy and paste this link in your browser:<br>
              <a href="${resetUrl}" class="url">${resetUrl}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour for your security</li>
                <li>Only use this link if you requested a password reset</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 SpendWise. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTextTemplate(resetUrl) {
    return `
Password Reset Request - SpendWise

We received a request to reset your password for your SpendWise account.

Click this link to reset your password: ${resetUrl}

IMPORTANT:
- This link will expire in 1 hour
- Only use this link if you requested a password reset
- If you didn't request this, please ignore this email
- Never share this link with anyone

If the link doesn't work, copy and paste it into your browser.

© 2024 SpendWise. All rights reserved.
This is an automated message, please do not reply to this email.
    `;
  }

  // Test email function for development
  async sendTestEmail(email) {
    if (!this.transporter) {
      throw new Error('Email service not available - check Gmail SMTP configuration');
    }

    try {
      const mailOptions = {
        from: `"SpendWise" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: '✅ Test Email - SpendWise Email Service Working!',
        html: `
          <h1 style="color: #667eea;">🎉 Email Service is Working!</h1>
          <p>This is a test email from SpendWise.</p>
          <p><strong>Gmail SMTP is configured correctly!</strong></p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Configuration: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}<br>
            From: ${process.env.FROM_EMAIL}
          </p>
        `
      };

      logger.info('📧 Sending test email...', { email });
      await this.transporter.sendMail(mailOptions);
      logger.info('📧 ✅ Test email sent successfully:', { email });
    } catch (error) {
      logger.error('📧 ❌ Test email failed:', { email, error: error.message });
      throw error;
    }
  }
}

module.exports = new EmailService();
