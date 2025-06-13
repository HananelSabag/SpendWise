/**
 * Onboarding Routes - Handle user onboarding process
 * @module routes/onboarding
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * POST /api/onboarding/complete
 * Mark user onboarding as complete
 */
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mark onboarding as complete
    const updatedUser = await User.markOnboardingComplete(userId);
    
    logger.info('User completed onboarding', { userId });
    
    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Onboarding completed successfully'
      }
    });
  } catch (error) {
    logger.error('Error completing onboarding:', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: error
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        ...errorCodes.INTERNAL_ERROR,
        details: 'Failed to complete onboarding'
      }
    });
  }
});

/**
 * POST /api/onboarding/preferences
 * Update user preferences during onboarding
 */
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      language_preference, 
      theme_preference, 
      currency_preference,
      preferences 
    } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (language_preference) {
      updateData.language_preference = language_preference;
    }
    
    if (theme_preference) {
      updateData.theme_preference = theme_preference;
    }
    
    if (currency_preference) {
      updateData.currency_preference = currency_preference;
    }
    
    // Update profile preferences
    if (Object.keys(updateData).length > 0) {
      await User.updateProfile(userId, updateData);
    }
    
    // Update JSONB preferences if provided
    if (preferences && typeof preferences === 'object') {
      await User.updatePreferences(userId, preferences);
    }
    
    // Get updated user data
    const updatedUser = await User.findById(userId);
    
    logger.info('User updated onboarding preferences', { 
      userId,
      preferences: Object.keys(updateData) 
    });
    
    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Preferences updated successfully'
      }
    });
  } catch (error) {
    logger.error('Error updating onboarding preferences:', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        success: false,
        error: error
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        ...errorCodes.INTERNAL_ERROR,
        details: 'Failed to update preferences'
      }
    });
  }
});

/**
 * GET /api/onboarding/status
 * Get user onboarding status
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          ...errorCodes.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        onboarding_completed: user.onboarding_completed || false,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          preferences: user.preferences,
          language_preference: user.language_preference,
          theme_preference: user.theme_preference,
          currency_preference: user.currency_preference
        }
      }
    });
  } catch (error) {
    logger.error('Error getting onboarding status:', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: {
        ...errorCodes.INTERNAL_ERROR,
        details: 'Failed to get onboarding status'
      }
    });
  }
});

module.exports = router; 