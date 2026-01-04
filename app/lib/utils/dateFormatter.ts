/**
 * Date formatting utility for PrismCapital
 * Formats dates according to user preferences
 */

export type DateFormatType = 'YYYY-MM-DD' | 'DD Mmm YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY';

/**
 * Formats a date string according to the specified format
 * @param dateString - Date string in ISO format (YYYY-MM-DD) or Date object
 * @param format - Date format from user preferences
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  format: DateFormatType = 'YYYY-MM-DD'
): string {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check for invalid date
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();

    // Month names for formatting
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[month];

    // Pad single digits with leading zero
    const padZero = (num: number) => num.toString().padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${padZero(month + 1)}-${padZero(day)}`;
      
      case 'DD Mmm YYYY':
        return `${padZero(day)} ${monthName} ${year}`;
      
      case 'MM/DD/YYYY':
        return `${padZero(month + 1)}/${padZero(day)}/${year}`;
      
      case 'DD/MM/YYYY':
        return `${padZero(day)}/${padZero(month + 1)}/${year}`;
      
      default:
        return `${year}-${padZero(month + 1)}-${padZero(day)}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Parses a date string to ISO format (YYYY-MM-DD) for database storage
 * @param dateString - Date string in any common format
 * @returns ISO formatted date string (YYYY-MM-DD)
 */
export function parseToISO(dateString: string | Date | null | undefined): string | null {
  if (!dateString) return null;

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error parsing date to ISO:', error);
    return null;
  }
}

/**
 * Formats a date for display in tables, cards, etc.
 * Uses user's preferred format from preferences
 * @param dateString - Date string in ISO format
 * @param userDateFormat - User's preferred date format
 * @returns Formatted date string
 */
export function formatDisplayDate(
  dateString: string | Date | null | undefined,
  userDateFormat?: string
): string {
  const format = (userDateFormat || 'YYYY-MM-DD') as DateFormatType;
  return formatDate(dateString, format);
}

/**
 * Get current date in ISO format (YYYY-MM-DD)
 * @returns Current date in ISO format
 */
export function getCurrentDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current date formatted according to user preference
 * @param format - User's preferred date format
 * @returns Current date in specified format
 */
export function getCurrentDateFormatted(format: DateFormatType = 'YYYY-MM-DD'): string {
  return formatDate(new Date(), format);
}