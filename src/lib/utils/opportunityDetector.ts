import type { FilteredMatch } from '../types';

export interface OpportunityScore {
  match: FilteredMatch;
  score: number;
  reasons: string[];
}

export interface OpportunityDetectionOptions {
  excludeSelected?: boolean;
  preferNoConflicts?: boolean;
  preferNearSelected?: boolean;
  maxResults?: number;
}

/**
 * Detect easy coverage opportunities
 */
export const detectOpportunities = (
  allMatches: FilteredMatch[],
  selectedMatchIds: Set<number>,
  conflicts: Map<number, number[]>,
  options: OpportunityDetectionOptions = {}
): OpportunityScore[] => {
  const {
    excludeSelected = true,
    preferNoConflicts = true,
    preferNearSelected = true,
    maxResults = 10,
  } = options;

  // Filter out already selected matches if requested
  let candidates = excludeSelected
    ? allMatches.filter(m => !selectedMatchIds.has(m.MatchId))
    : allMatches;

  // Score each candidate match
  const scored = candidates.map(match => {
    const reasons: string[] = [];
    let score = 0;

    // No conflicts = high score
    const hasConflict = conflicts.has(match.MatchId);
    if (!hasConflict && preferNoConflicts) {
      score += 50;
      reasons.push('No conflicts');
    } else if (hasConflict) {
      score -= 20;
      reasons.push('Has conflicts');
    }

    // Proximity to selected matches
    if (preferNearSelected && selectedMatchIds.size > 0) {
      const matchStart = match.ScheduledStartDateTime;
      const matchEnd = match.ScheduledEndDateTime;
      
      // Find nearest selected match
      const selectedMatches = allMatches.filter(m => selectedMatchIds.has(m.MatchId));
      let minGap = Infinity;
      
      selectedMatches.forEach(selected => {
        const selectedStart = selected.ScheduledStartDateTime;
        const selectedEnd = selected.ScheduledEndDateTime;
        
        // Check if matches are close (within 2 hours)
        const gapBefore = Math.abs(matchStart - selectedEnd);
        const gapAfter = Math.abs(selectedStart - matchEnd);
        const minGapForThis = Math.min(gapBefore, gapAfter);
        
        if (minGapForThis < minGap) {
          minGap = minGapForThis;
        }
      });

      if (minGap < 2 * 60 * 60 * 1000) { // Within 2 hours
        score += 20;
        reasons.push('Near selected matches');
      } else if (minGap > 4 * 60 * 60 * 1000) { // More than 4 hours away
        score -= 10;
        reasons.push('Far from selected matches');
      }
    }

    // Prefer matches on same court as selected matches
    if (preferNearSelected && selectedMatchIds.size > 0) {
      const selectedMatches = allMatches.filter(m => selectedMatchIds.has(m.MatchId));
      const sameCourtCount = selectedMatches.filter(m => m.CourtName === match.CourtName).length;
      
      if (sameCourtCount > 0) {
        score += 15;
        reasons.push('Same court as selected matches');
      }
    }

    // Prefer morning matches (less likely to be tired)
    const matchHour = new Date(match.ScheduledStartDateTime).getHours();
    if (matchHour >= 8 && matchHour < 12) {
      score += 5;
      reasons.push('Morning match');
    }

    return {
      match,
      score,
      reasons,
    };
  });

  // Sort by score (highest first) and return top results
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .filter(opportunity => opportunity.score > 0); // Only return positive opportunities
};

/**
 * Calculate coverage potential (how many matches could be covered)
 */
export const calculateCoveragePotential = (
  allMatches: FilteredMatch[],
  conflicts: Map<number, number[]>
): { totalMatches: number; conflictFreeMatches: number; potentialCoverage: number } => {
  const totalMatches = allMatches.length;
  const conflictFreeMatches = allMatches.filter(m => !conflicts.has(m.MatchId)).length;
  
  // Estimate potential coverage assuming no conflicts = easy coverage
  const potentialCoverage = (conflictFreeMatches / totalMatches) * 100;

  return {
    totalMatches,
    conflictFreeMatches,
    potentialCoverage,
  };
};

