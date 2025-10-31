import type { FilteredMatch } from '../types';

/**
 * Escape text for ICS format (CRLF, commas, semicolons, backslashes)
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSS)
 */
function formatICSDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique ID for ICS event
 */
function generateUID(matchId: number, timestamp: number): string {
  return `match-${matchId}-${timestamp}@coursync.local`;
}

/**
 * Export coverage plan to ICS calendar format
 */
export function exportCoveragePlanToICS(
  matches: FilteredMatch[],
  getTeamIdentifier: (match: FilteredMatch) => string | null,
  getOpponent: (match: FilteredMatch) => string,
  eventName?: string
): string {
  const now = Date.now();
  
  // Generate calendar header
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CourtSync//Coverage Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(eventName || 'Coverage Plan')}`,
    `X-WR-CALDESC:${escapeICS('Volleyball Match Coverage Plan')}`,
    `X-WR-TIMEZONE:UTC`,
  ].join('\r\n') + '\r\n';

  // Add each match as an event
  matches.forEach((match) => {
    const teamId = getTeamIdentifier(match);
    const opponent = getOpponent(match);
    const matchTitle = teamId 
      ? `${teamId} vs ${opponent}`
      : `${match.FirstTeamText} vs ${match.SecondTeamText}`;
    
    const description = [
      `Court: ${match.CourtName}`,
      `Division: ${match.Division.CodeAlias}`,
      `First Team: ${match.FirstTeamText}`,
      `Second Team: ${match.SecondTeamText}`,
    ].join('\\n');
    
    const location = escapeICS(match.CourtName);
    const summary = escapeICS(matchTitle);
    const desc = escapeICS(description);
    
    // Calculate end time with buffer (5 minutes before start for travel)
    const startTime = match.ScheduledStartDateTime;
    const endTime = match.ScheduledEndDateTime;
    const bufferMinutes = 5; // 5 minute buffer before start for travel
    
    // Start time with buffer (DTSTART is when you should arrive)
    const arrivalTime = startTime - (bufferMinutes * 60 * 1000);
    
    const dtstart = formatICSDate(arrivalTime);
    const dtend = formatICSDate(endTime);
    const dtstamp = formatICSDate(now);
    const uid = generateUID(match.MatchId, startTime);
    
    // Create event
    ics += [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${location}`,
      `SEQUENCE:0`,
      `STATUS:CONFIRMED`,
      `TRANSP:OPAQUE`,
    ].join('\r\n') + '\r\n';
    
    // Add reminder (15 minutes before)
    ics += [
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(`Match starts in 15 minutes: ${matchTitle}`)}`,
      'END:VALARM',
    ].join('\r\n') + '\r\n';
    
    ics += 'END:VEVENT\r\n';
  });

  // Close calendar
  ics += 'END:VCALENDAR\r\n';

  return ics;
}

