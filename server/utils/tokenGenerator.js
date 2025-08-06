/**
 * 🔐 TOKEN GENERATOR UTILITY
 * Centralized secure token generation for all server operations
 * @module utils/tokenGenerator
 */

const crypto = require('crypto');

/**
 * Generate cryptographically secure verification token
 * @param {number} bytes - Number of bytes for token (default: 32)
 * @returns {string} Hex string token
 */
const generateVerificationToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate shorter token for password reset or similar operations
 * @param {number} bytes - Number of bytes for token (default: 16)
 * @returns {string} Hex string token
 */
const generateShortToken = (bytes = 16) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate random password for OAuth users
 * @param {number} bytes - Number of bytes for password (default: 32)
 * @returns {string} Hex string password
 */
const generateRandomPassword = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateVerificationToken,
  generateShortToken,
  generateRandomPassword
};