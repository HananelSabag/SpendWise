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
        },
        // NEW: Add timeout settings for better reliability
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
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

  // NEW: Check if email service is configured
  isConfigured() {
    return this.transporter !== null;
  }

  async sendPasswordReset(email, token) {
    if (!this.transporter) {
      logger.warn('📧 ⚠️ Email service not available, falling back to development mode');
      return false;
    }

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      
      // ✅ ADD: Debug logging to verify URL
      logger.info('📧 Reset URL being sent:', { resetUrl, clientUrl: process.env.CLIENT_URL });
      
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f0f4ff; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15); }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #2563EB 100%); padding: 50px 20px; text-align: center; position: relative; }
          .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%); }
          .logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%); 
            border-radius: 20px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 24px;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
          }
          .logo-text { 
            color: white; 
            font-size: 38px; 
            font-weight: 900; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            letter-spacing: 0;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: table-cell;
            vertical-align: middle;
            text-align: center;
          }
          .title { color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); position: relative; z-index: 1; }
          .content { padding: 45px 30px; }
          .message { color: #374151; font-size: 16px; line-height: 1.7; margin-bottom: 25px; }
          .button-container { text-align: center; margin: 35px 0; }
          .button { 
            display: inline-block !important; 
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%) !important; 
            color: white !important; 
            padding: 18px 36px !important; 
            text-decoration: none !important; 
            border-radius: 12px !important; 
            font-weight: bold !important; 
            font-size: 16px !important;
            border: none !important;
            cursor: pointer !important;
            -webkit-text-size-adjust: none !important;
            mso-hide: all !important;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
            transition: all 0.2s ease !important;
          }
          .button:hover { 
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%) !important; 
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
            transform: translateY(-1px) !important;
          }
          .url { color: #3B82F6; word-break: break-all; font-size: 14px; }
          .footer { border-top: 1px solid #E5E7EB; padding: 25px; text-align: center; color: #6B7280; font-size: 13px; background-color: #F9FAFB; }
          .warning { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B; color: #92400E; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #F59E0B; }
          .email-highlight { color: #3B82F6; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">S</span>
            </div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p class="message">Hello,</p>
            
            <p class="message">
              We received a request to reset your password for your SpendWise account (<span class="email-highlight">${email}</span>).
            </p>
            
            <p class="message">
              Click the button below to reset your password:
            </p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">Reset Your Password</a>
            </div>
            
            <p class="message">
              <strong>If the button doesn't work, copy and paste this link in your browser:</strong><br>
              <a href="${resetUrl}" class="url" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 12px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour for your security</li>
                <li>Only use this link if you requested a password reset</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>© 2024 SpendWise</strong> - Your Smart Finance Companion</p>
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
      // Enhanced logging for test emails
      logger.info('📧 Preparing test email:', { 
        email,
        smtpHost: process.env.SMTP_HOST,
        fromEmail: process.env.FROM_EMAIL
      });

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
            From: ${process.env.FROM_EMAIL}<br>
            Request Count: ${Math.random().toString(36).substring(7)}
          </p>
        `
      };

      logger.info('📧 Sending test email...', { email });
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('📧 ✅ Test email sent successfully:', { 
        email, 
        messageId: info.messageId,
        response: info.response
      });
    } catch (error) {
      logger.error('📧 ❌ Test email failed:', { 
        email, 
        error: error.message, 
        code: error.code,
        responseCode: error.responseCode
      });
      throw error;
    }
  }

  // NEW: Send email verification
  async sendVerificationEmail(email, username, token) {
    if (!this.transporter) {
      logger.warn('📧 ⚠️ Email service not available for verification email');
      return false;
    }

    try {
      // Enhanced logging for debugging
      logger.info('📧 Starting verification email process:', { 
        email, 
        username, 
        tokenPresent: !!token,
        tokenLength: token ? token.length : 0,
        clientUrl: process.env.CLIENT_URL 
      });

      const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;
      
      // Validate inputs before proceeding
      if (!email || !username || !token) {
        logger.error('📧 ❌ Missing required parameters for verification email:', {
          hasEmail: !!email,
          hasUsername: !!username,
          hasToken: !!token
        });
        return false;
      }

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'SpendWise'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Verify Your SpendWise Account',
        html: this.getVerificationEmailTemplate(username, verificationLink),
        text: this.getVerificationEmailTextTemplate(username, verificationLink)
      };

      logger.info('📧 Attempting to send verification email...', { 
        email, 
        from: mailOptions.from,
        verificationLink: verificationLink.substring(0, 50) + '...' // Log partial link for security
      });
      
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('📧 ✅ Verification email sent successfully:', { 
        email, 
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
      return true;
    } catch (error) {
      logger.error('📧 ❌ Failed to send verification email:', {
        email,
        username,
        error: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 200) + '...' // Truncated stack trace
      });
      return false;
    }
  }

  // NEW: Send welcome email after verification
  async sendWelcomeEmail(email, username) {
    if (!this.transporter) {
      logger.warn('📧 ⚠️ Email service not available for welcome email');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'SpendWise'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to SpendWise - Email Verified!',
        html: this.getWelcomeEmailTemplate(username),
        text: this.getWelcomeEmailTextTemplate(username)
      };

      logger.info('📧 Attempting to send welcome email...', { email });
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('📧 ✅ Welcome email sent successfully:', { email, messageId: info.messageId });
      return true;
    } catch (error) {
      logger.error('📧 ❌ Failed to send welcome email:', {
        email,
        error: error.message,
        code: error.code
      });
      // Don't throw error for welcome email - it's not critical
      return false;
    }
  }

  // NEW: Email verification template - UPDATED: Beautiful blue logo with white S
  getVerificationEmailTemplate(username, verificationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your SpendWise Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f0f4ff; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15); }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #2563EB 100%); padding: 50px 20px; text-align: center; position: relative; }
          .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%); }
          .logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%); 
            border-radius: 20px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 24px;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
          }
          .logo-text { 
            color: white; 
            font-size: 38px; 
            font-weight: 900; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            letter-spacing: 0;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: table-cell;
            vertical-align: middle;
            text-align: center;
          }
          .title { color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); position: relative; z-index: 1; }
          .content { padding: 45px 30px; }
          .message { color: #374151; font-size: 16px; line-height: 1.7; margin-bottom: 25px; }
          .button-container { text-align: center; margin: 35px 0; }
          .button { 
            display: inline-block !important; 
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%) !important; 
            color: white !important; 
            padding: 18px 36px !important; 
            text-decoration: none !important; 
            border-radius: 12px !important; 
            font-weight: bold !important; 
            font-size: 16px !important;
            border: none !important;
            cursor: pointer !important;
            -webkit-text-size-adjust: none !important;
            mso-hide: all !important;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
            transition: all 0.2s ease !important;
          }
          .button:hover { 
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%) !important; 
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
            transform: translateY(-1px) !important;
          }
          .url { color: #3B82F6; word-break: break-all; font-size: 14px; }
          .footer { border-top: 1px solid #E5E7EB; padding: 25px; text-align: center; color: #6B7280; font-size: 13px; background-color: #F9FAFB; }
          .warning { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B; color: #92400E; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #F59E0B; }
          .features { background: linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #BFDBFE; }
          .features ul { margin: 0; padding-left: 20px; }
          .features li { margin-bottom: 10px; color: #1E40AF; font-weight: 500; }
          .username-highlight { color: #3B82F6; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">S</span>
            </div>
            <h1 class="title">Welcome to SpendWise!</h1>
          </div>
          
          <div class="content">
            <p class="message">Hi <span class="username-highlight">${username}</span>,</p>
            
            <p class="message">
              Thank you for registering with SpendWise! To complete your registration and start managing your finances, please verify your email address.
            </p>
            
            <div class="button-container">
              <a href="${verificationLink}" class="button" target="_blank" rel="noopener noreferrer">Verify Email Address</a>
            </div>
            
            <p class="message">
              <strong>If the button doesn't work, copy and paste this link in your browser:</strong><br>
              <a href="${verificationLink}" class="url" target="_blank" rel="noopener noreferrer">${verificationLink}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create a SpendWise account, please ignore this email.
            </div>
            
            <div class="features">
              <p class="message" style="margin-bottom: 15px; color: #1E40AF; font-weight: 600;"><strong>🚀 Once verified, you'll be able to:</strong></p>
              <ul>
                <li>💰 Track your income and expenses with ease</li>
                <li>🔄 Set up recurring transactions for automation</li>
                <li>📊 View detailed financial insights and reports</li>
                <li>🏷️ Organize expenses with custom categories</li>
                <li>🎯 Monitor your financial goals and progress</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Best regards,<br>The SpendWise Team</strong> 💙</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p><strong>© 2024 SpendWise</strong> - Your Smart Finance Companion</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // NEW: Welcome email template - UPDATED: Beautiful blue logo with white S
  getWelcomeEmailTemplate(username) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SpendWise - Email Verified!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f0f4ff; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15); }
          .header { background: linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%); padding: 50px 20px; text-align: center; position: relative; }
          .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%); }
          .logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%); 
            border-radius: 20px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 24px;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
          }
          .logo-text { 
            color: white; 
            font-size: 38px; 
            font-weight: 900; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            letter-spacing: 0;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: table-cell;
            vertical-align: middle;
            text-align: center;
          }
          .title { color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); position: relative; z-index: 1; }
          .content { padding: 45px 30px; }
          .message { color: #374151; font-size: 16px; line-height: 1.7; margin-bottom: 25px; }
          .button-container { text-align: center; margin: 35px 0; }
          .button { 
            display: inline-block !important; 
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%) !important; 
            color: white !important; 
            padding: 18px 36px !important; 
            text-decoration: none !important; 
            border-radius: 12px !important; 
            font-weight: bold !important; 
            font-size: 16px !important;
            border: none !important;
            cursor: pointer !important;
            -webkit-text-size-adjust: none !important;
            mso-hide: all !important;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
            transition: all 0.2s ease !important;
          }
          .button:hover { 
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%) !important; 
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
            transform: translateY(-1px) !important;
          }
          .footer { border-top: 1px solid #E5E7EB; padding: 25px; text-align: center; color: #6B7280; font-size: 13px; background-color: #F9FAFB; }
          .success { background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border: 1px solid #10B981; color: #065F46; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #10B981; }
          .tips { background: linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #BFDBFE; }
          .tips ul { margin: 0; padding-left: 20px; }
          .tips li { margin-bottom: 12px; color: #1E40AF; font-weight: 500; }
          .username-highlight { color: #3B82F6; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">S</span>
            </div>
            <h1 class="title">Email Verified Successfully!</h1>
          </div>
          
          <div class="content">
            <p class="message">Congratulations <span class="username-highlight">${username}</span>! 🎉</p>
            
            <div class="success">
              <strong>✓ Your email has been verified!</strong> You now have full access to all SpendWise features.
            </div>
            
            <div class="tips">
              <p class="message" style="margin-bottom: 15px; color: #1E40AF; font-weight: 600;"><strong>🚀 Here are some tips to get you started:</strong></p>
              <ul>
                <li><strong>💰 Add your first transaction:</strong> Start tracking your spending right away</li>
                <li><strong>🏷️ Set up categories:</strong> Organize your expenses for better insights</li>
                <li><strong>🔄 Create recurring transactions:</strong> Automate regular income and expenses</li>
                <li><strong>📊 Check your dashboard:</strong> View your financial overview at a glance</li>
                <li><strong>👤 Upload a profile picture:</strong> Personalize your account</li>
              </ul>
            </div>
            
            <div class="button-container">
              <a href="${process.env.CLIENT_URL}/dashboard" class="button" target="_blank" rel="noopener noreferrer">Go to Dashboard</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Happy budgeting!<br>The SpendWise Team</strong> 💙</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p><strong>© 2024 SpendWise</strong> - Your Smart Finance Companion</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // NEW: Email verification text template - ADDED: Missing text template
  getVerificationEmailTextTemplate(username, verificationLink) {
    return `
Welcome to SpendWise - Email Verification Required

Hi ${username},

Thank you for registering with SpendWise! To complete your registration and start managing your finances, please verify your email address.

Click this link to verify your email: ${verificationLink}

IMPORTANT:
- This verification link will expire in 24 hours
- If you didn't create a SpendWise account, please ignore this email

Once verified, you'll be able to:
- Track your income and expenses with ease
- Set up recurring transactions for automation
- View detailed financial insights and reports
- Organize expenses with custom categories
- Monitor your financial goals and progress

Best regards,
The SpendWise Team

© 2024 SpendWise. All rights reserved.
This is an automated message, please do not reply to this email.
    `;
  }

  // NEW: Welcome email text template - ADDED: Missing text template
  getWelcomeEmailTextTemplate(username) {
    return `
Welcome to SpendWise - Email Verified Successfully!

Congratulations ${username}!

Your email has been verified! You now have full access to all SpendWise features.

Here are some tips to get you started:
- Add your first transaction: Start tracking your spending right away
- Set up categories: Organize your expenses for better insights
- Create recurring transactions: Automate regular income and expenses
- Check your dashboard: View your financial overview at a glance
- Upload a profile picture: Personalize your account

Visit your dashboard: ${process.env.CLIENT_URL}/dashboard

Happy budgeting!
The SpendWise Team

© 2024 SpendWise. All rights reserved.
    `;
  }
}

module.exports = new EmailService();
