/**
 * Date utility functions
 */

/**
 * Get today's date as a string in YYYY-MM-DD format
 * Used for streak and other date-based features
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Check if two dates are the same day
 * @param date1 First date string or Date object
 * @param date2 Second date string or Date object
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  // Convert to Date objects if they're strings
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format a date string to a more readable format
 * @param dateString ISO date string
 * @param format Optional format type ('short', 'medium', 'long')
 */
export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}
