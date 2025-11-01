import { format, formatDistanceStrict } from 'date-fns';

export const formatMatchTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'h:mm a');
};

export const formatMatchDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM d, yyyy');
};

export const formatMatchDuration = (startTime: number, endTime: number): string => {
  return formatDistanceStrict(new Date(startTime), new Date(endTime));
};

export const formatTimeRange = (startTime: number, endTime: number): string => {
  return `${formatMatchTime(startTime)} - ${formatMatchTime(endTime)}`;
};

/**
 * Calculate time gap between two matches in minutes
 * Returns null if matches overlap or if there's no gap
 */
export const calculateTimeGap = (
  match1End: number,
  match2Start: number
): number | null => {
  const gap = match2Start - match1End;
  // Return gap in minutes if positive, null if negative (overlap) or zero
  return gap > 0 ? Math.floor(gap / 60000) : null;
};

/**
 * Format time gap as human-readable string
 */
export const formatTimeGap = (gapMinutes: number | null): string => {
  if (gapMinutes === null) return 'No gap';
  if (gapMinutes < 60) return `${gapMinutes} min`;
  const hours = Math.floor(gapMinutes / 60);
  const minutes = gapMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

/**
 * Determine if a match is in the morning or afternoon wave
 * Morning: matches starting before 2:30 PM (14:30)
 * Afternoon: matches starting at 2:30 PM (14:30) or later
 * This matches the filter logic in filters.ts
 */
export const getMatchWave = (matchStartTime: number): 'morning' | 'afternoon' => {
  const date = new Date(matchStartTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Afternoon starts at 2:30 PM (14:30) = 870 minutes
  const afternoonStartMinutes = 14 * 60 + 30; // 870 minutes
  
  // Morning: totalMinutes < 870 (before 2:30 PM)
  // Afternoon: totalMinutes >= 870 (2:30 PM or later)
  return totalMinutes < afternoonStartMinutes ? 'morning' : 'afternoon';
};

/**
 * Check if a time string (h:mm a format like "11:00 AM" or "2:30 PM") is in the morning wave
 * Morning: times before 2:30 PM (14:30)
 * Afternoon: times at 2:30 PM (14:30) or later
 */
export const isMorningWave = (timeString: string): boolean => {
  // Parse format like "11:00 AM" or "2:30 PM"
  const parts = timeString.trim().split(' ');
  if (parts.length < 2) return false;
  
  const ampm = parts[parts.length - 1].toUpperCase();
  const timePart = parts.slice(0, -1).join(' ');
  const [hoursStr, minutesStr] = timePart.split(':');
  
  if (!hoursStr || !minutesStr) return false;
  
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours) || isNaN(minutes)) return false;
  
  // Convert to 24-hour format
  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0; // 12 AM is midnight (0 hours)
  }
  
  const totalMinutes = hours * 60 + minutes;
  const afternoonStartMinutes = 14 * 60 + 30; // 2:30 PM = 870 minutes
  
  // Morning: < 2:30 PM
  return totalMinutes < afternoonStartMinutes;
};
