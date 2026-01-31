import type { OpenRouterError } from '@/types';

/**
 * Factory class for creating standardized OpenRouter errors
 * Provides consistent error handling across the OpenRouter service
 */
export class OpenRouterErrorFactory {
  /**
   * Create a new OpenRouter error with specified code and message
   * 
   * @param code - Error code (e.g., 'OPENROUTER_RATE_LIMIT')
   * @param message - Human-readable error message
   * @param options - Additional error options
   * @returns OpenRouterError instance
   */
  static create(
    code: string,
    message: string,
    options: {
      statusCode?: number;
      details?: unknown;
      retryable?: boolean;
    } = {}
  ): OpenRouterError {
    const error = new Error(message) as OpenRouterError;
    error.code = code;
    error.statusCode = options.statusCode;
    error.details = options.details;
    error.retryable = options.retryable ?? false;
    error.name = 'OpenRouterError';
    
    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, OpenRouterErrorFactory.create);
    }
    
    return error;
  }
  
  /**
   * Check if an error is an OpenRouter error
   * 
   * @param error - Error to check
   * @returns True if error is an OpenRouterError
   */
  static isOpenRouterError(error: unknown): error is OpenRouterError {
    return error instanceof Error && error.name === 'OpenRouterError';
  }
  
  /**
   * Check if an error is retryable
   * 
   * @param error - Error to check
   * @returns True if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    return this.isOpenRouterError(error) && error.retryable;
  }
}
