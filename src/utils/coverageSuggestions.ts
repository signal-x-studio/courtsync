import type { FilteredMatch } from '../types';
import type { CoverageStatus } from '../hooks/useCoverageStatus';

export interface CoverageSuggestion {
  match: FilteredMatch;
  teamId: string;
  reason: string;
  score: number;
}

export interface CoverageSuggestionsOptions {
  excludeSelected?: boolean;
  preferUncovered?: boolean;
  preferNoConflicts?: boolean;
  preferNearSelected?: boolean;
  maxResults?: number;
}

/**
 * Generate coverage suggestions based on uncovered teams and conflicts
 */
export const generateCoverageSuggestions = (
  matches: FilteredMatch[],
  selectedMatchIds: Set<number>,
  conflicts: Map<number, number[]>,
  coverageStatus: Map<string, CoverageStatus>,
  getTeamIdentifier: (match: FilteredMatch) => string,
  options: CoverageSuggestionsOptions = {}
): CoverageSuggestion[] => {
  const {
    excludeSelected = true,
    preferUncovered = true,
    preferNoConflicts = true,
    preferNearSelected = true,
    maxResults = 10,
  } = options;

  const suggestions: CoverageSuggestion[] = [];

  matches.forEach(match => {
    // Skip if already selected
    if (excludeSelected && selectedMatchIds.has(match.MatchId)) {
      return;
    }

    const teamId = getTeamIdentifier(match);
    if (!teamId) return;

    const status = coverageStatus.get(teamId) || 'not-covered';
    const hasConflict = conflicts.has(match.MatchId);
    
    let score = 0;
    const reasons: string[] = [];

    // Boost score for uncovered teams
    if (preferUncovered && status === 'not-covered') {
      score += 10;
      reasons.push('Uncovered team');
    }

    // Boost score for no conflicts
    if (preferNoConflicts && !hasConflict) {
      score += 5;
      reasons.push('No conflicts');
    }

    // Boost score if near selected matches (within 30 minutes)
    if (preferNearSelected && selectedMatchIds.size > 0) {
      const matchStart = match.ScheduledStartDateTime;
      let isNearSelected = false;
      
      matches.forEach(m => {
        if (selectedMatchIds.has(m.MatchId)) {
          const timeDiff = Math.abs(matchStart - m.ScheduledStartDateTime);
          const minutesDiff = timeDiff / 60000;
          if (minutesDiff <= 30 && minutesDiff > 0) {
            isNearSelected = true;
          }
        }
      });
      
      if (isNearSelected) {
        score += 3;
        reasons.push('Near selected match');
      }
    }

    // Only include suggestions with positive scores
    if (score > 0 && reasons.length > 0) {
      suggestions.push({
        match,
        teamId,
        reason: reasons.join(', '),
        score,
      });
    }
  });

  // Sort by score (highest first) and limit results
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

