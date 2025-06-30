class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.isServerWarm = false;
    this.coldStartRetries = new Map();
  }

  // Enhanced fetch with cold start handling
  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestId = `${options.method || 'GET'}-${endpoint}`;
    
    try {
      // First attempt
      const response = await this.performRequest(url, options);
      
      if (response.ok) {
        this.isServerWarm = true;
        this.coldStartRetries.delete(requestId);
        return response;
      }
      
      throw new Error(`Request failed: ${response.status}`);
      
    } catch (error) {
      // Check if this looks like a cold start issue
      if (this.isColdStartError(error) && !this.isServerWarm) {
        return this.handleColdStartRetry(url, options, requestId);
      }
      
      throw error;
    }
  }

  // Perform the actual request with timeout
  async performRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Detect cold start errors
  isColdStartError(error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    );
  }

  // Handle cold start with exponential backoff retry
  async handleColdStartRetry(url, options, requestId) {
    const maxRetries = 3;
    const currentRetries = this.coldStartRetries.get(requestId) || 0;
    
    if (currentRetries >= maxRetries) {
      throw new Error(typeof window !== 'undefined' && window.localStorage?.getItem('app_language') === 'he' 
      ? 'השרת נכשל להגיב לאחר מספר ניסיונות' 
      : 'Server failed to respond after multiple retries');
    }
    
    // Exponential backoff: 5s, 10s, 20s
    const delay = Math.pow(2, currentRetries) * 5000;
    this.coldStartRetries.set(requestId, currentRetries + 1);
    
    // Show user-friendly message for first retry
    if (currentRetries === 0) {
      this.showColdStartToast();
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the request
    return this.fetch(url.replace(this.baseURL, ''), options);
  }

  // Show user-friendly toast notification
  showColdStartToast() {
    // Integrate with your toast system
    if (window.showToast) {
      window.showToast({
        type: 'info',
        title: 'Server Starting Up',
        message: 'Our server is waking up from sleep mode. This may take 30-60 seconds.',
        duration: 10000,
        icon: '🚀'
      });
    }
  }

  // Health check endpoint
  async healthCheck() {
    try {
      const response = await this.performRequest(`${this.baseURL}/health`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService(); 