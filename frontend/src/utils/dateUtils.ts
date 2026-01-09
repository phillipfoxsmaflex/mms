/**
 * Date utility functions for handling timezone-related issues
 */

/**
 * Formats a Date object to ISO string format while preserving local time values.
 * Unlike toISOString(), this does NOT convert to UTC.
 * 
 * Example:
 * - Input: Date object with 14:00 local time (e.g., CET/CEST)
 * - Output: "2026-01-07T14:00:00" (preserves 14:00, no timezone conversion)
 * 
 * Use this when the backend expects local time without timezone information,
 * or when you want to preserve the exact time values shown in the UI.
 * 
 * @param date - The date to format
 * @returns ISO-formatted string with local time values (no 'Z' suffix)
 */
export const formatDateForBackend = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a Date object to ISO string in UTC (standard behavior).
 * This is just a wrapper around toISOString() for consistency.
 * 
 * @param date - The date to format
 * @returns ISO-formatted string in UTC with 'Z' suffix
 */
export const formatDateAsUTC = (date: Date): string => {
  return date.toISOString();
};
