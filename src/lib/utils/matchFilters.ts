import type { Match, FilteredMatch, CourtSchedule } from '../types';

const CLUB_NAME = '630 Volleyball';
const CLUB_SHORT = '630';

export const isClubMatch = (match: Match): boolean => {
  const teamTexts = [
    match.FirstTeamText,
    match.SecondTeamText,
    match.WorkTeamText,
  ];
  
  return teamTexts.some(
    (team) =>
      team && (team.includes(CLUB_NAME) || team.includes(CLUB_SHORT))
  );
};

export const getInvolvedTeam = (match: Match): 'first' | 'second' | 'work' | null => {
  if (match.FirstTeamText && (match.FirstTeamText.includes(CLUB_NAME) || match.FirstTeamText.includes(CLUB_SHORT))) {
    return 'first';
  }
  if (match.SecondTeamText && (match.SecondTeamText.includes(CLUB_NAME) || match.SecondTeamText.includes(CLUB_SHORT))) {
    return 'second';
  }
  if (match.WorkTeamText && (match.WorkTeamText.includes(CLUB_NAME) || match.WorkTeamText.includes(CLUB_SHORT))) {
    return 'work';
  }
  return null;
};

export const filterClubMatches = (
  courtSchedules: CourtSchedule[]
): FilteredMatch[] => {
  const filteredMatches: FilteredMatch[] = [];
  
  courtSchedules.forEach((court) => {
    court.CourtMatches.forEach((match) => {
      if (isClubMatch(match)) {
        const involvedTeam = getInvolvedTeam(match);
        // ONLY include matches where 630 Volleyball is PLAYING (not working)
        if (involvedTeam && involvedTeam !== 'work') {
          filteredMatches.push({
            ...match,
            CourtName: court.Name,
            CourtId: court.CourtId,
            InvolvedTeam: involvedTeam,
          });
        }
      }
    });
  });
  
  return filteredMatches.sort(
    (a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime
  );
};

export const detectConflicts = (matches: FilteredMatch[]): Map<number, number[]> => {
  const conflicts = new Map<number, number[]>();
  
  // All matches are already filtered to only playing matches (no work)
  for (let i = 0; i < matches.length; i++) {
    const match1 = matches[i];
    const conflictsForMatch: number[] = [];
    
    // Check against ALL other matches
    for (let j = 0; j < matches.length; j++) {
      if (i === j) continue; // Skip self
      
      const match2 = matches[j];
      
      // Check if matches overlap AND are on different courts
      // (same court = no conflict, photographer can cover sequentially)
      const overlaps =
        match1.ScheduledStartDateTime < match2.ScheduledEndDateTime &&
        match1.ScheduledEndDateTime > match2.ScheduledStartDateTime;
      
      const differentCourts = match1.CourtId !== match2.CourtId;
      
      if (overlaps && differentCourts) {
        conflictsForMatch.push(match2.MatchId);
      }
    }
    
    if (conflictsForMatch.length > 0) {
      conflicts.set(match1.MatchId, conflictsForMatch);
    }
  }
  
  return conflicts;
};
