/**
 * Email Service - Production Ready with Mobile Fixes
 * Handles all email communications with polished templates optimized for mobile devices
 * @module services/emailService
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check required environment variables
      const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      // Always verify connection in production
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization failed:', {
        message: error.message,
        code: error.code,
        smtp_host: process.env.SMTP_HOST // Log host only, not credentials
      });
      this.transporter = null;
    }
  }

  isConfigured() {
    return this.transporter !== null;
  }

  async sendPasswordReset(email, token) {
    if (!this.transporter) {
      logger.warn('Email service not available');
      return false;
    }

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'SpendWise'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Reset Your SpendWise Password',
        html: this.getPasswordResetTemplate(resetUrl, email),
        text: this.getPasswordResetTextTemplate(resetUrl)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', {
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  async sendVerificationEmail(email, username, token) {
    if (!this.transporter) {
      logger.warn('Email service not available for verification email');
      return false;
    }

    try {
      const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;
      
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'SpendWise'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Verify Your SpendWise Account',
        html: this.getVerificationEmailTemplate(username, verificationLink),
        text: this.getVerificationEmailTextTemplate(username, verificationLink)
      };
      
      await this.transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send verification email:', {
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  async sendWelcomeEmail(email, username) {
    if (!this.transporter) {
      logger.warn('Email service not available for welcome email');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'SpendWise'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to SpendWise!',
        html: this.getWelcomeEmailTemplate(username),
        text: this.getWelcomeEmailTextTemplate(username)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Welcome email sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send welcome email:', {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <meta name="format-detection" content="telephone=no">
        <title>Password Reset - SpendWise</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f0f4ff; 
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15); 
          }
          .header { 
            background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #2563EB 100%); 
            padding: 40px 20px; 
            text-align: center; 
            position: relative; 
          }
          .header::before { 
            content: ''; 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%); 
          }
          .logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%); 
            border-radius: 20px; 
            display: table; 
            margin: 0 auto 20px auto;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
            text-align: center;
          }
          .logo-text { 
            color: white; 
            font-size: 36px; 
            font-weight: 900; 
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            line-height: 80px;
            height: 80px;
            display: table-cell;
            vertical-align: middle;
            text-align: center;
          }
          .title { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); 
            position: relative; 
            z-index: 1; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .message { 
            color: #374151; 
            font-size: 16px; 
            line-height: 1.7; 
            margin-bottom: 20px; 
          }
          .button-container { 
            text-align: center; 
            margin: 40px 0; 
          }
          .button { 
            display: inline-block;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
            color: white !important;
            padding: 18px 50px;
            text-decoration: none !important;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            transition: none;
            min-height: 50px;
            min-width: 200px;
            line-height: 1.4;
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
            -webkit-touch-callout: default;
            -webkit-user-select: none;
            border: none;
            cursor: pointer;
            outline: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            touch-action: manipulation;
            position: relative;
            z-index: 10;
            box-sizing: border-box;
            vertical-align: middle;
          }
          .button:hover, .button:focus, .button:active, .button:visited, .button:link { 
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%);
            color: white !important;
            text-decoration: none !important;
            outline: none;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          .url { 
            color: #3B82F6; 
            word-break: break-all; 
            font-size: 14px; 
            background-color: #F0F4FF;
            padding: 12px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #E5E7EB; 
            padding: 30px; 
            text-align: center; 
            color: #6B7280; 
            font-size: 13px; 
            background-color: #F9FAFB; 
          }
          .warning { 
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); 
            border: 1px solid #F59E0B; 
            color: #92400E; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border-left: 4px solid #F59E0B; 
          }
          .warning-icon {
            font-size: 20px;
            margin-right: 8px;
          }
          .email-highlight { 
            color: #3B82F6; 
            font-weight: 600; 
          }
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin: 8px 0;
          }
          @media screen and (max-width: 600px) {
            .container {
              margin: 20px 10px;
              border-radius: 12px;
            }
            .header {
              padding: 30px 20px;
            }
            .title {
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
            }
            .button {
              padding: 18px 40px;
              font-size: 16px;
              width: auto;
              display: inline-block;
              min-height: 56px;
              min-width: 240px;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              touch-action: manipulation;
            }
            .logo {
              width: 70px;
              height: 70px;
            }
            .logo-text {
              font-size: 32px;
              line-height: 70px;
              height: 70px;
            }
          }
          @media screen and (max-width: 480px) {
            .container {
              margin: 10px 5px;
            }
            .button {
              padding: 20px 32px;
              font-size: 16px;
              min-height: 60px;
              width: 90%;
              max-width: 280px;
              text-align: center;
              box-sizing: border-box;
              display: block;
              margin: 0 auto;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              touch-action: manipulation;
            }
            .content {
              padding: 25px 15px;
            }
          }
          @supports (-webkit-touch-callout: none) {
            .button {
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              -webkit-touch-callout: default;
            }
          }
          @media screen and (-webkit-device-pixel-ratio: 2) {
            .button {
              touch-action: manipulation;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
            }
          }
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
              We received a request to reset your password for your SpendWise account 
              (<span class="email-highlight">${email}</span>).
            </p>
            
            <p class="message">
              Click the button below to reset your password:
            </p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer"
                 style="color: white !important; text-decoration: none !important;">
                Reset Your Password
              </a>
            </div>
            
            <p class="message">
              <strong>If the button doesn't work, copy and paste this link into your browser:</strong>
            </p>
            
            <div class="url">${resetUrl}</div>
            
            <div class="warning">
              <strong><span class="warning-icon">⚠️</span>Important Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>1 hour</strong> for your security</li>
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

  getVerificationEmailTemplate(username, verificationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <meta name="format-detection" content="telephone=no">
        <title>Verify Your SpendWise Account</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f0f4ff; 
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15); 
          }
          .header { 
            background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #2563EB 100%); 
            padding: 40px 20px; 
            text-align: center; 
            position: relative; 
          }
          .header::before { 
            content: ''; 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%); 
          }
          .logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%); 
            border-radius: 20px; 
            display: table; 
            margin: 0 auto 20px auto;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
            text-align: center;
          }
          .logo-text { 
            color: white; 
            font-size: 36px; 
            font-weight: 900; 
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            line-height: 80px;
            height: 80px;
            display: table-cell;
            vertical-align: middle;
            text-align: center;
          }
          .title { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); 
            position: relative; 
            z-index: 1; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .message { 
            color: #374151; 
            font-size: 16px; 
            line-height: 1.7; 
            margin-bottom: 20px; 
          }
          .button-container { 
            text-align: center; 
            margin: 40px 0; 
          }
          .button { 
            display: inline-block;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
            color: white !important;
            padding: 18px 50px;
            text-decoration: none !important;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            transition: none;
            min-height: 50px;
            min-width: 200px;
            line-height: 1.4;
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
            -webkit-touch-callout: default;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            border: 2px solid #1D4ED8;
            cursor: pointer;
            outline: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            touch-action: manipulation;
            position: relative;
            z-index: 10;
            box-sizing: border-box;
            vertical-align: middle;
            /* iPhone specific improvements */
            -webkit-text-size-adjust: 100% !important;
            -ms-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
          }
          .button:hover, 
          .button:focus, 
          .button:active, 
          .button:visited,
          .button:link { 
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%);
            color: white !important;
            text-decoration: none !important;
            outline: none;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          .url { 
            color: #3B82F6; 
            word-break: break-all; 
            font-size: 14px; 
            background-color: #F0F4FF;
            padding: 12px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #E5E7EB; 
            padding: 30px; 
            text-align: center; 
            color: #6B7280; 
            font-size: 13px; 
            background-color: #F9FAFB; 
          }
          .warning { 
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); 
            border: 1px solid #F59E0B; 
            color: #92400E; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border-left: 4px solid #F59E0B; 
          }
          .warning-icon {
            font-size: 20px;
            margin-right: 8px;
          }
          .features { 
            background: linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%); 
            padding: 25px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border: 1px solid #BFDBFE; 
          }
          .features ul { 
            margin: 0; 
            padding-left: 20px; 
          }
          .features li { 
            margin-bottom: 12px; 
            color: #1E40AF; 
            font-weight: 500; 
          }
          .username-highlight { 
            color: #3B82F6; 
            font-weight: 700; 
          }
          @media screen and (max-width: 600px) {
            .container {
              margin: 20px 10px;
              border-radius: 12px;
            }
            .header {
              padding: 30px 20px;
            }
            .title {
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
            }
            .button {
              padding: 18px 40px;
              font-size: 16px;
              width: auto;
              display: inline-block;
              min-height: 56px;
              min-width: 240px;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              touch-action: manipulation;
            }
            .logo {
              width: 70px;
              height: 70px;
            }
            .logo-text {
              font-size: 32px;
              line-height: 70px;
              height: 70px;
            }
          }
          @media screen and (max-width: 480px) {
            .container {
              margin: 10px 5px;
            }
            .button {
              padding: 20px 32px;
              font-size: 16px;
              min-height: 60px;
              width: 90%;
              max-width: 280px;
              text-align: center;
              box-sizing: border-box;
              display: block;
              margin: 0 auto;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              touch-action: manipulation;
            }
            .content {
              padding: 25px 15px;
            }
          }
          @supports (-webkit-touch-callout: none) {
            .button {
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              -webkit-touch-callout: default;
            }
          }
          @media screen and (-webkit-device-pixel-ratio: 2) {
            .button {
              touch-action: manipulation;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
            }
          }
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
              Thank you for registering with SpendWise! To complete your registration and start managing 
              your finances, please verify your email address.
            </p>
            
            <div class="button-container">
              <!-- Simple iPhone-friendly button -->
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background-color: #1F7F4C; border-radius: 8px; padding: 0; border: 2px solid #1F7F4C;">
                    <a href="${verificationLink}" 
                       style="background-color: #1F7F4C; 
                              color: #ffffff; 
                              display: block; 
                              font-family: Arial, sans-serif; 
                              font-size: 18px; 
                              font-weight: bold; 
                              line-height: 24px; 
                              padding: 16px 32px; 
                              text-align: center; 
                              text-decoration: none; 
                              border-radius: 8px;
                              border: 2px solid #1F7F4C;
                              min-width: 200px;
                              box-sizing: border-box;">
                      ✅ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback VML for Outlook -->
              <!--[if mso]>
              <table align="center">
                <tr>
                  <td>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" 
                      href="${verificationLink}" style="height:56px;v-text-anchor:middle;width:280px;" 
                      arcsize="15%" strokecolor="#1F7F4C" fillcolor="#1F7F4C">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:18px;font-weight:bold;">
                        ✅ Verify Email Address
                      </center>
                    </v:roundrect>
                  </td>
                </tr>
              </table>
              <![endif]-->
            </div>
            
            <!-- iPhone-specific fallback link -->
            <div class="mobile-fallback" style="margin-top: 15px; display: block; background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #FF8C00;">
              <p class="message" style="font-size: 14px; color: #B8860B; margin: 0;">
                <strong>📱 iPhone/iOS Mail App Users</strong>
              </p>
              <p style="font-size: 13px; color: #B8860B; margin: 8px 0 0 0;">
                <strong>Known Issue:</strong> iPhone Mail app sometimes blocks secure verification links. 
                <br><strong>Simple Fix:</strong>
              </p>
              <ol style="font-size: 13px; color: #B8860B; margin: 8px 0; padding-left: 20px;">
                <li><strong>Copy the link below</strong> (long-press to copy)</li>
                <li><strong>Open Safari</strong> (not Mail app)</li>
                <li><strong>Paste & Go</strong> to verify instantly</li>
              </ol>
              <p style="font-size: 12px; color: #8B7355; margin: 5px 0 0 0; font-style: italic;">
                💡 This shorter link should work better, but copy-paste is 100% reliable
              </p>
            </div>
            
            <p class="message">
              <strong>If the button doesn't work, copy and paste this link into your browser:</strong>
            </p>
            
            <div class="url" style="user-select: all; -webkit-user-select: all; -webkit-touch-callout: default; word-wrap: break-word; overflow-wrap: break-word;">
              <a href="${verificationLink}" style="color: #3B82F6; text-decoration: underline; word-break: break-all; display: block; white-space: pre-wrap;">${verificationLink}</a>
            </div>
            
            <div class="warning">
              <strong><span class="warning-icon">⚠️</span>Important:</strong> 
              This verification link will expire in <strong>24 hours</strong>. 
              If you didn't create a SpendWise account, please ignore this email.
            </div>
            
            <div class="features">
              <p class="message" style="margin-bottom: 15px; color: #1E40AF; font-weight: 600;">
                <strong>🚀 Once verified, you'll be able to:</strong>
              </p>
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

  getWelcomeEmailTemplate(username) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <meta name="format-detection" content="telephone=no">
        <title>Welcome to SpendWise!</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f0f4ff; 
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15); 
          }
          .header { 
            background: linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%); 
            padding: 40px 20px; 
            text-align: center; 
            position: relative; 
          }
          .header::before { 
            content: ''; 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%); 
          }
          .logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%); 
            border-radius: 20px; 
            display: table; 
            margin: 0 auto 20px auto;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
            text-align: center;
          }
          .logo-text { 
            color: white; 
            font-size: 36px; 
            font-weight: 900; 
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            line-height: 80px;
            height: 80px;
            display: table-cell;
            vertical-align: middle;
            text-align: center;
          }
          .title { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); 
            position: relative; 
            z-index: 1; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .message { 
            color: #374151; 
            font-size: 16px; 
            line-height: 1.7; 
            margin-bottom: 20px; 
          }
          .button-container { 
            text-align: center; 
            margin: 40px 0; 
          }
          .button { 
            display: inline-block;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
            color: white !important;
            padding: 18px 50px;
            text-decoration: none !important;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            transition: none;
            min-height: 50px;
            min-width: 200px;
            line-height: 1.4;
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
            -webkit-touch-callout: default;
            -webkit-user-select: none;
            border: none;
            cursor: pointer;
            outline: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            touch-action: manipulation;
            position: relative;
            z-index: 10;
            box-sizing: border-box;
            vertical-align: middle;
          }
          .button:hover, .button:focus, .button:active, .button:visited, .button:link { 
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%);
            color: white !important;
            text-decoration: none !important;
            outline: none;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          .footer { 
            border-top: 1px solid #E5E7EB; 
            padding: 30px; 
            text-align: center; 
            color: #6B7280; 
            font-size: 13px; 
            background-color: #F9FAFB; 
          }
          .success { 
            background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); 
            border: 1px solid #10B981; 
            color: #065F46; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border-left: 4px solid #10B981;
            text-align: center;
            font-weight: 600;
          }
          .tips { 
            background: linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%); 
            padding: 25px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border: 1px solid #BFDBFE; 
          }
          .tips ul { 
            margin: 0; 
            padding-left: 20px; 
          }
          .tips li { 
            margin-bottom: 12px; 
            color: #1E40AF; 
            font-weight: 500; 
          }
          .username-highlight { 
            color: #3B82F6; 
            font-weight: 700; 
          }
          @media screen and (max-width: 600px) {
            .container {
              margin: 20px 10px;
              border-radius: 12px;
            }
            .header {
              padding: 30px 20px;
            }
            .title {
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
            }
            .button {
              padding: 18px 40px;
              font-size: 16px;
              width: auto;
              display: inline-block;
              min-height: 56px;
              min-width: 240px;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              touch-action: manipulation;
            }
            .logo {
              width: 70px;
              height: 70px;
            }
            .logo-text {
              font-size: 32px;
              line-height: 70px;
              height: 70px;
            }
          }
          @media screen and (max-width: 480px) {
            .container {
              margin: 10px 5px;
            }
            .button {
              padding: 20px 32px;
              font-size: 16px;
              min-height: 60px;
              width: 90%;
              max-width: 280px;
              text-align: center;
              box-sizing: border-box;
              display: block;
              margin: 0 auto;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              touch-action: manipulation;
            }
            .content {
              padding: 25px 15px;
            }
          }
          @supports (-webkit-touch-callout: none) {
            .button {
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
              -webkit-touch-callout: default;
            }
          }
          @media screen and (-webkit-device-pixel-ratio: 2) {
            .button {
              touch-action: manipulation;
              -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
            }
          }
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
              ✅ Your email has been verified! You now have full access to all SpendWise features.
            </div>
            
            <div class="tips">
              <p class="message" style="margin-bottom: 15px; color: #1E40AF; font-weight: 600;">
                <strong>🚀 Here are some tips to get you started:</strong>
              </p>
              <ul>
                <li><strong>💰 Add your first transaction:</strong> Start tracking your spending right away</li>
                <li><strong>🏷️ Set up categories:</strong> Organize your expenses for better insights</li>
                <li><strong>🔄 Create recurring transactions:</strong> Automate regular income and expenses</li>
                <li><strong>📊 Check your dashboard:</strong> View your financial overview at a glance</li>
                <li><strong>👤 Upload a profile picture:</strong> Personalize your account</li>
              </ul>
            </div>
            
            <div class="button-container">
              <a href="${process.env.CLIENT_URL}/dashboard" class="button" target="_blank" rel="noopener noreferrer"
                 style="color: white !important; text-decoration: none !important;">
                Go to Dashboard
              </a>
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
This is an automated message, please do not reply to this email.
    `;
  }
}

module.exports = new EmailService();