import type { PoolsheetResponse, PoolsheetMatch, FilteredMatch, SetScore, PoolsheetMatchResult } from '$lib/types';

/**
 * Create a map of MatchId to match results from a PoolsheetResponse
 */
export function createPoolsheetResultsMap(
  poolsheet: PoolsheetResponse
): Map<number, PoolsheetMatchResult> {
  const resultsMap = new Map<number, PoolsheetMatchResult>();
  
  if (!poolsheet || !poolsheet.Matches || !Array.isArray(poolsheet.Matches)) {
    return resultsMap;
  }
  
  poolsheet.Matches.forEach((match: PoolsheetMatch) => {
    if (!match.HasScores || !match.Sets || match.Sets.length === 0) {
      return;
    }
    
    // Convert poolsheet sets to SetScore format
    const sets: SetScore[] = match.Sets.map((set, index) => ({
      setNumber: index + 1,
      team1Score: set.FirstTeamScore ?? 0,
      team2Score: set.SecondTeamScore ?? 0,
      completedAt: set.FirstTeamScore !== null && set.SecondTeamScore !== null ? Date.now() : 0
    }));
    
    // Determine winner (first team to win 2 sets)
    let winner: 'first' | 'second' | null = null;
    let firstTeamWins = 0;
    let secondTeamWins = 0;
    
    sets.forEach(set => {
      if (set.completedAt > 0 && set.team1Score !== null && set.team2Score !== null) {
        if (set.team1Score > set.team2Score) {
          firstTeamWins++;
        } else if (set.team2Score > set.team1Score) {
          secondTeamWins++;
        }
      }
    });
    
    if (firstTeamWins >= 2) {
      winner = 'first';
    } else if (secondTeamWins >= 2) {
      winner = 'second';
    }
    
    // Create final score string
    const finalScore = sets
      .filter(set => set.completedAt > 0)
      .map(set => `${set.team1Score}-${set.team2Score}`)
      .join(', ');
    
    resultsMap.set(match.MatchId, {
      matchId: match.MatchId,
      hasScores: match.HasScores,
      sets,
      winner,
      finalScore: finalScore || null
    });
  });
  
  return resultsMap;
}

/**
 * Merge poolsheet results into FilteredMatch objects
 */
export function mergePoolsheetResults(
  matches: FilteredMatch[],
  resultsMap: Map<number, PoolsheetMatchResult>
): FilteredMatch[] {
  return matches.map(match => {
    const result = resultsMap.get(match.MatchId);
    if (result) {
      return {
        ...match,
        PoolsheetResult: result
      };
    }
    return match;
  });
}

