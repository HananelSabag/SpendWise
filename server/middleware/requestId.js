const crypto = require('crypto');

const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  
  // Update logger to include request ID
  req.log = {
    info: (message, meta = {}) => {
      const logger = require('../utils/logger');
      logger.info(message, { requestId: req.id, ...meta });
    },
    error: (message, error, meta = {}) => {
      const logger = require('../utils/logger');
      logger.error(message, { 
        requestId: req.id, 
        error: error.message, 
        stack: error.stack,
        ...meta 
      });
    }
  };
  
  next();
};

module.exports = requestId;