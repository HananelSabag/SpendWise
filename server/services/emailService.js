/**
 * Email Service — uses Resend (HTTP API) when RESEND_API_KEY is set,
 * falls back to SMTP/Nodemailer otherwise.
 */

const logger = require('../utils/logger');

// ─── Resend sender ──────────────────────────────────────────────────────────

class ResendSender {
  constructor(apiKey) {
    const { Resend } = require('resend');
    this.client = new Resend(apiKey);
    this.from = process.env.FROM_EMAIL
      ? `${process.env.FROM_NAME || 'SpendWise'} <${process.env.FROM_EMAIL}>`
      : 'SpendWise <onboarding@resend.dev>';
  }

  async send({ to, subject, html, text }) {
    logger.info(`📧 Sending email via Resend → subject="${subject}" to=[REDACTED]`);
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message || JSON.stringify(error));
    logger.info(`✅ Email sent via Resend → id=${data?.id} subject="${subject}"`);
  }
}

// ─── SMTP sender ────────────────────────────────────────────────────────────

class SmtpSender {
  constructor() {
    this.transporter = null;
    this._ready = this._init().catch((err) => {
      logger.error('SMTP init failed:', { message: err.message, code: err.code, smtp_host: process.env.SMTP_HOST });
    });
  }

  async _init() {
    const nodemailer = require('nodemailer');
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
    const missing = required.filter(v => !process.env[v]);
    if (missing.length) throw new Error(`Missing SMTP env vars: ${missing.join(', ')}`);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Verify SMTP certificates by default. Local/private SMTP deployments
      // can opt into a self-signed certificate explicitly instead of silently
      // weakening every production connection.
      tls: { rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== 'true' },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporter.verify();
    this.transporter = transporter;
    logger.info('SMTP email service initialized');
  }

  async send({ to, subject, html, text }) {
    await this._ready;
    if (!this.transporter) throw new Error('SMTP transporter not available');
    const from = `"${process.env.FROM_NAME || 'SpendWise'}" <${process.env.FROM_EMAIL}>`;
    await this.transporter.sendMail({ from, to, subject, html, text });
  }
}

// ─── EmailService ────────────────────────────────────────────────────────────

class EmailService {
  constructor() {
    if (process.env.RESEND_API_KEY) {
      this._sender = new ResendSender(process.env.RESEND_API_KEY);
      logger.info(`✅ Email service: Resend (HTTP) key=${process.env.RESEND_API_KEY.slice(0, 8)}... from="${process.env.FROM_EMAIL || 'onboarding@resend.dev'}"`);
    } else {
      this._sender = new SmtpSender();
      logger.warn('⚠️  Email service: RESEND_API_KEY not set — SMTP fallback (will fail on Render free tier)');
    }
  }

  async _send(opts) {
    try {
      await this._sender.send(opts);
      return true;
    } catch (err) {
      const keyStatus = process.env.RESEND_API_KEY
        ? `key=${process.env.RESEND_API_KEY.slice(0, 8)}...`
        : 'RESEND_API_KEY=NOT SET';
      logger.error(`❌ Email send failed [${this._sender?.constructor?.name}] ${keyStatus} — ${err.message}`);
      return false;
    }
  }

  async sendVerificationEmail(email, username, token) {
    const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
    return this._send({
      to: email,
      subject: 'Verify Your SpendWise Account',
      html: this._verificationHtml(username, link),
      text: `Hi ${username},\n\nVerify your SpendWise account:\n${link}\n\nLink expires in 24 hours.`,
    });
  }

  async sendPasswordReset(email, token) {
    const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
    return this._send({
      to: email,
      subject: 'Reset Your SpendWise Password',
      html: this._passwordResetHtml(url, email),
      text: `Reset your SpendWise password:\n${url}\n\nLink expires in 1 hour. If you didn't request this, ignore this email.`,
    });
  }

  async sendWelcomeEmail(email, username) {
    return this._send({
      to: email,
      subject: 'Welcome to SpendWise!',
      html: this._welcomeHtml(username),
      text: `Welcome to SpendWise, ${username}! Your email has been verified. Start at: ${process.env.CLIENT_URL}/dashboard`,
    });
  }

  async sendShoppingInvite(inviterName, inviteeEmail, token) {
    const acceptUrl = `${process.env.CLIENT_URL}/shopping?invite=${token}`;
    return this._send({
      to: inviteeEmail,
      subject: `${inviterName} הזמין אותך לרשימת קניות משותפת ב-SpendWise`,
      html: this._shoppingInviteHtml(inviterName, acceptUrl),
      text: `${inviterName} הזמין אותך לרשימת קניות משותפת.\n\nלאישור: ${acceptUrl}\n\nההזמנה תפוג תוך 7 ימים.`,
    });
  }

  // ─── HTML templates ──────────────────────────────────────────────────────

  _wrap(headerColor, headerHtml, bodyHtml) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f0f4ff}
  .wrap{max-width:580px;margin:36px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(79,70,229,.15)}
  .hdr{background:${headerColor};padding:36px 24px;text-align:center}
  .hdr h1{color:#fff;margin:0;font-size:24px;font-weight:700}
  .hdr p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}
  .logo{width:72px;height:72px;background:linear-gradient(135deg,#1E40AF,#3B82F6,#60A5FA);border-radius:18px;display:table;margin:0 auto 16px;border:3px solid rgba(255,255,255,.3);text-align:center}
  .logo span{display:table-cell;vertical-align:middle;color:#fff;font-size:34px;font-weight:900}
  .body{padding:36px 28px}
  .msg{color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px}
  .btn-wrap{text-align:center;margin:32px 0}
  .btn{display:inline-block;background:linear-gradient(135deg,#3B82F6,#2563EB);color:#fff!important;padding:15px 44px;text-decoration:none!important;border-radius:12px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(59,130,246,.3)}
  .url{color:#3B82F6;word-break:break-all;font-size:13px;background:#f0f4ff;padding:12px;border-radius:8px;margin:16px 0}
  .note{color:#6B7280;font-size:13px;margin:16px 0}
  .footer{border-top:1px solid #E5E7EB;padding:24px;text-align:center;color:#6B7280;font-size:12px;background:#F9FAFB}
  @media(max-width:600px){.wrap{margin:16px 8px}.body{padding:24px 16px}.btn{padding:15px 28px;font-size:15px}}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div class="logo"><span>S</span></div>
    ${headerHtml}
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="footer"><p><strong>© SpendWise</strong> — Your Smart Finance Companion</p><p>This is an automated message, please do not reply.</p></div>
</div></body></html>`;
  }

  _verificationHtml(username, link) {
    return this._wrap(
      'linear-gradient(135deg,#4F46E5,#3B82F6)',
      '<h1>Verify Your Email</h1><p>One step to activate your SpendWise account</p>',
      `<p class="msg">Hi <strong>${username}</strong>,</p>
       <p class="msg">Click the button below to verify your email address and activate your account:</p>
       <div class="btn-wrap"><a href="${link}" class="btn">✅ Verify Email Address</a></div>
       <p class="msg">Or copy this link into your browser:</p>
       <div class="url">${link}</div>
       <p class="note">This link expires in <strong>24 hours</strong>. If you didn't create a SpendWise account, ignore this email.</p>`
    );
  }

  _passwordResetHtml(url, email) {
    return this._wrap(
      'linear-gradient(135deg,#4F46E5,#3B82F6)',
      '<h1>Password Reset</h1><p>SpendWise account recovery</p>',
      `<p class="msg">We received a password reset request for <strong>${email}</strong>.</p>
       <div class="btn-wrap"><a href="${url}" class="btn">Reset Password</a></div>
       <p class="msg">Or copy this link:</p>
       <div class="url">${url}</div>
       <p class="note">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>`
    );
  }

  _welcomeHtml(username) {
    return this._wrap(
      'linear-gradient(135deg,#059669,#10B981)',
      '<h1>Email Verified! 🎉</h1><p>Welcome to SpendWise</p>',
      `<p class="msg">Congratulations <strong>${username}</strong>! Your email is verified and your account is ready.</p>
       <div class="btn-wrap"><a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a></div>`
    );
  }

  _shoppingInviteHtml(inviterName, acceptUrl) {
    return this._wrap(
      'linear-gradient(135deg,#4F46E5,#3B82F6)',
      '<h1>הזמנה לרשימת קניות</h1><p>SpendWise — ניהול פיננסי חכם</p>',
      `<p class="msg">היי!</p>
       <p class="msg"><strong>${inviterName}</strong> הזמין אותך לרשימת קניות משותפת ב-SpendWise.</p>
       <div class="btn-wrap"><a href="${acceptUrl}" class="btn">הצטרף לרשימה</a></div>
       <p class="msg">או העתק קישור:</p>
       <div class="url">${acceptUrl}</div>
       <p class="note">ההזמנה תפוג תוך 7 ימים. אם לא ציפית להזמנה זו, התעלם מהמייל.</p>`
    );
  }
}

module.exports = new EmailService();
