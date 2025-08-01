/**
 * 🧪 AUTHENTICATION RECOVERY TESTING UTILITIES
 * Helper functions to test and demonstrate the auth recovery system
 * @version 1.0.0
 */

// Test functions to simulate different failure scenarios
export const AuthRecoveryTestUtils = {
  /**
   * Simulate multiple auth failures to trigger recovery
   */
  simulateAuthFailures: () => {
    console.log('🧪 Simulating multiple auth failures...');
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found. Make sure app is fully loaded.');
      return;
    }

    // Simulate 3 consecutive auth errors
    for (let i = 0; i < 3; i++) {
      const mockError = {
        response: { status: 401 },
        message: `Simulated auth error ${i + 1}`
      };
      manager.handleApiError(mockError);
    }
  },

  /**
   * Simulate network failures to trigger recovery
   */
  simulateNetworkFailures: () => {
    console.log('🧪 Simulating network failures...');
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found. Make sure app is fully loaded.');
      return;
    }

    // Simulate network errors
    for (let i = 0; i < 4; i++) {
      const mockError = {
        code: 'NETWORK_ERROR',
        message: `Network unreachable ${i + 1}`
      };
      manager.handleApiError(mockError);
    }
  },

  /**
   * Simulate stuck state (user authenticated but requests failing)
   */
  simulateStuckState: () => {
    console.log('🧪 Simulating stuck state...');
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found. Make sure app is fully loaded.');
      return;
    }

    // Reset last success time to simulate old session
    manager.healthState.lastSuccessTime = Date.now() - 20000; // 20 seconds ago
    manager.healthState.consecutiveFailures = 2;

    // Trigger stuck state check
    if (manager.isInStuckState()) {
      manager.handleStuckState();
    }
  },

  /**
   * Test recovery from timeout errors
   */
  simulateTimeoutErrors: () => {
    console.log('🧪 Simulating timeout errors...');
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found. Make sure app is fully loaded.');
      return;
    }

    for (let i = 0; i < 3; i++) {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      };
      manager.handleApiError(mockError, { timeout: 10000 });
    }
  },

  /**
   * Get current health status for debugging
   */
  getHealthStatus: () => {
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found.');
      return null;
    }
    
    const status = manager.getHealthStatus();
    console.log('🏥 Current Health Status:', status);
    return status;
  },

  /**
   * Reset health state for clean testing
   */
  resetHealthState: () => {
    console.log('🔄 Resetting health state...');
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found.');
      return;
    }
    
    manager.resetHealthState();
    console.log('✅ Health state reset complete');
  },

  /**
   * Test successful recovery
   */
  simulateSuccessfulRecovery: () => {
    console.log('🧪 Simulating successful recovery...');
    const manager = window.authRecoveryManager;
    if (!manager) {
      console.error('Auth Recovery Manager not found.');
      return;
    }

    // First simulate some failures
    manager.healthState.consecutiveFailures = 2;
    manager.healthState.isRecovering = true;

    // Then simulate success
    manager.handleApiSuccess();
    console.log('✅ Recovery simulation complete');
  },

  /**
   * Show available test commands
   */
  showTestCommands: () => {
    console.log(`
🧪 Auth Recovery Test Commands Available:

// Test different failure scenarios:
AuthRecoveryTestUtils.simulateAuthFailures()     // Trigger auth error recovery
AuthRecoveryTestUtils.simulateNetworkFailures()  // Trigger network error recovery  
AuthRecoveryTestUtils.simulateStuckState()       // Trigger stuck state recovery
AuthRecoveryTestUtils.simulateTimeoutErrors()    // Trigger timeout error recovery

// Recovery testing:
AuthRecoveryTestUtils.simulateSuccessfulRecovery() // Test recovery success flow

// Debugging:
AuthRecoveryTestUtils.getHealthStatus()          // Check current health status
AuthRecoveryTestUtils.resetHealthState()         // Reset for clean testing

// Quick access in console:
window.AuthRecoveryTestUtils = AuthRecoveryTestUtils
    `);
  }
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.AuthRecoveryTestUtils = AuthRecoveryTestUtils;
  
  // Show commands on load
  setTimeout(() => {
    console.log('🧪 Auth Recovery Test Utils loaded! Type AuthRecoveryTestUtils.showTestCommands() for help.');
  }, 2000);
}

export default AuthRecoveryTestUtils;