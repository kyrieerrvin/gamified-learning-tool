/**
 * Timer utility functions for 24-hour reset countdown
 * Handles timezone-aware calculations for streak and daily quest resets
 */

export interface TimeToReset {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isToday: boolean;
}

/**
 * Calculate time remaining until next midnight in user's local timezone
 * @returns TimeToReset object with countdown values
 */
export function getTimeToNextReset(): TimeToReset {
  const now = new Date();
  
  // Get next midnight in user's local timezone
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); // Set to next midnight
  
  // Calculate total seconds until reset
  const totalSeconds = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  
  // Convert to hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Check if reset is today (less than 24 hours away)
  const isToday = hours < 24;
  
  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    isToday
  };
}

/**
 * Format time remaining as HH:MM:SS string
 * @param timeToReset TimeToReset object
 * @returns Formatted time string
 */
export function formatTimeToReset(timeToReset: TimeToReset): string {
  const { hours, minutes, seconds } = timeToReset;
  
  const pad = (num: number): string => num.toString().padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Get the next reset time as a formatted string
 * @returns Formatted string like "12:00 AM tomorrow" or "12:00 AM today"
 */
export function getNextResetTimeString(): string {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  
  const isToday = nextMidnight.getDate() === now.getDate();
  const dayText = isToday ? 'today' : 'tomorrow';
  
  return `12:00 AM ${dayText}`;
}

/**
 * Check if it's currently within the "danger zone" (less than 1 hour until reset)
 * @returns boolean indicating if reset is imminent
 */
export function isResetImminent(): boolean {
  const timeToReset = getTimeToNextReset();
  return timeToReset.totalSeconds < 3600; // Less than 1 hour
}

/**
 * Get timezone abbreviation for display
 * @returns timezone abbreviation (e.g., "PST", "EST", "UTC")
 */
export function getTimezoneAbbreviation(): string {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  try {
    // Try to get timezone abbreviation
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: timeZone
    });
    
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    return timeZonePart?.value || 'Local';
  } catch (error) {
    return 'Local';
  }
}

/**
 * Calculate percentage of day completed (for progress visualization)
 * @returns percentage (0-100) of how much of the day has passed
 */
export function getDayProgress(): number {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const totalDay = endOfDay.getTime() - startOfDay.getTime();
  const elapsed = now.getTime() - startOfDay.getTime();
  
  return Math.min(100, Math.max(0, (elapsed / totalDay) * 100));
} 