const cron = require('node-cron');
const https = require('https');
const http = require('http');
const logger = require('./logger');

class KeepAliveService {
  constructor() {
    this.appUrl = process.env.APP_URL || 'http://localhost:5001';
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEP_ALIVE === 'true';
  }

  start() {
    if (!this.isEnabled || !this.appUrl) {
      logger.info('Keep-alive service disabled');
      return;
    }

    // Ping every 10 minutes to prevent cold start
    cron.schedule('*/10 * * * *', () => {
      this.pingServer();
    });

    logger.info('Keep-alive service started');
  }

  pingServer() {
    const url = `${this.appUrl}/health`;
    
    // Choose the appropriate module based on URL protocol
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      logger.debug(`Keep-alive ping: ${res.statusCode}`);
      res.resume(); // drain the response so the socket is released
    });
    req.on('error', (err) => {
      logger.warn('Keep-alive ping failed:', err.message);
    });
    req.setTimeout(10000, () => {
      req.destroy();
      logger.warn('Keep-alive ping timed out');
    });
  }
}

module.exports = new KeepAliveService(); 