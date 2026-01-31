/**
 * Rate limiter implementation for API request throttling
 * Implements sliding window rate limiting algorithm
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  /**
   * Create a new rate limiter
   * 
   * @param maxRequests - Maximum number of requests allowed in the time window
   * @param windowMs - Time window in milliseconds
   * @throws Error if parameters are invalid
   */
  constructor(maxRequests: number, windowMs: number) {
    if (maxRequests <= 0) {
      throw new Error('maxRequests must be greater than 0');
    }
    if (windowMs <= 0) {
      throw new Error('windowMs must be greater than 0');
    }
    
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  /**
   * Acquire a slot for making a request
   * Will wait if rate limit is exceeded
   * 
   * @returns Promise that resolves when a slot is available
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // If limit reached, wait for oldest request to expire
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // +100ms buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire(); // Recursively try again
    }
    
    // Add current request timestamp
    this.requests.push(now);
  }
  
  /**
   * Reset all tracked requests
   * Useful for testing or manual rate limit resets
   */
  reset(): void {
    this.requests = [];
  }
  
  /**
   * Get the number of remaining requests in the current window
   * 
   * @returns Number of requests that can be made without waiting
   */
  get remainingRequests(): number {
    const now = Date.now();
    const recentRequests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}
