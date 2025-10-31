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
