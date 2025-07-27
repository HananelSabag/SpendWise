const cron = require('node-cron');
const https = require('https');
const http = require('http');

class KeepAliveService {
  constructor() {
    this.appUrl = process.env.APP_URL || 'https://spendwise-dx8g.onrender.com'; // Your deployed app URL
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEP_ALIVE === 'true';
  }

  start() {
    if (!this.isEnabled || !this.appUrl) {
      console.log('Keep-alive service disabled');
      return;
    }

    // Ping every 10 minutes to prevent cold start
    cron.schedule('*/10 * * * *', () => {
      this.pingServer();
    });

    console.log('Keep-alive service started');
  }

  pingServer() {
    const url = `${this.appUrl}/health`;
    
    // Choose the appropriate module based on URL protocol
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      console.log(`Keep-alive ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('Keep-alive ping failed:', err.message);
    });
  }
}

module.exports = new KeepAliveService(); 