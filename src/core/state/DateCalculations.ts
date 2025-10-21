export const BASE_DATE = new Date(1900, 0, 1);
export const PIXELS_PER_DAY = 1;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex];
}

function monthNameToIndex(monthName: string): number {
  return MONTH_NAMES.indexOf(monthName);
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function distanceToDate(distance: number, startOffset: number = 0): Date {
  if (!Number.isFinite(distance)) {
    throw new Error('Distance must be finite number');
  }
  
  const daysSinceBase = Math.round((distance + startOffset) / PIXELS_PER_DAY);
  const result = new Date(BASE_DATE);
  result.setDate(result.getDate() + daysSinceBase);
  
  return result;
}

export function dateToDistance(date: Date): number {
  const millisecondsDiff = date.getTime() - BASE_DATE.getTime();
  const daysDiff = millisecondsDiff / MS_PER_DAY;
  const distance = daysDiff * PIXELS_PER_DAY;
  
  return distance;
}

export function formatDate(date: Date): string {
  if (!isValidDate(date)) {
    return 'Invalid Date';
  }
  
  const month = getMonthName(date.getMonth());
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(date1: Date, date2: Date): number {
  const millisecondsDiff = date2.getTime() - date1.getTime();
  return Math.round(millisecondsDiff / MS_PER_DAY);
}

export function clampDate(
  date: Date,
  minDate: Date | null = null,
  maxDate: Date | null = null
): Date {
  let result = date;
  
  if (minDate && date < minDate) {
    result = new Date(minDate);
  }
  
  if (maxDate && date > maxDate) {
    result = new Date(maxDate);
  }
  
  return result;
}

export function parseFormattedDate(formatted: string): Date | null {
  const match = formatted.match(/^([A-Z][a-z]+) (\d{1,2}), (-?\d+)$/);
  
  if (!match) {
    return null;
  }
  
  const [, monthName, dayStr, yearStr] = match;
  const monthIndex = monthNameToIndex(monthName);
  
  if (monthIndex === -1) {
    return null;
  }
  
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  
  const date = new Date(year, monthIndex, day);
  
  if (!isValidDate(date)) {
    return null;
  }
  
  return date;
}
