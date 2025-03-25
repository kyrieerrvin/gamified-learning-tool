/**
 * Centralized error handling utilities
 */

/**
 * Format error messages for display to users
 * @param error The error object or message
 * @returns A user-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unknown error occurred';
  }
}

/**
 * Log errors to console with contextual information
 * @param context The context where the error occurred
 * @param error The error object
 */
export function logError(context: string, error: unknown): void {
  console.error(`[ERROR] ${context}:`, error);
  
  // Add additional error reporting here in the future
  // e.g., sending to a monitoring service
}

/**
 * Check if the error is a network connectivity issue
 * @param error The error to check
 * @returns True if it's a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    // Common network error messages
    const networkErrorMessages = [
      'network error',
      'failed to fetch',
      'network request failed',
      'timeout',
      'abort',
      'not connected to internet'
    ];
    
    const message = error.message.toLowerCase();
    return networkErrorMessages.some(msg => message.includes(msg));
  }
  
  return false;
}

/**
 * Create a timeout promise that rejects after a specified time
 * @param ms Milliseconds before timeout
 * @returns A promise that rejects on timeout
 */
export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
}
