import type { FilteredMatch, PoolsheetResponse, PoolsheetMatch } from '$lib/types';

/**
 * Extract BallerTV link from poolsheet match data
 */
export function getBallerTVLinkFromPoolsheetMatch(
  matchId: number,
  poolsheetData: PoolsheetResponse
): string | null {
  // Handle case where poolsheet might be empty or error response
  if (!poolsheetData || !poolsheetData.Matches || !Array.isArray(poolsheetData.Matches)) {
    return null;
  }
  
  const match = poolsheetData.Matches.find((m: PoolsheetMatch) => m.MatchId === matchId);
  return match?.Court?.VideoLink || null;
}

/**
 * Create a map of match IDs to BallerTV links from poolsheet data
 */
export function createBallerTVLinkMap(
  poolsheetData: PoolsheetResponse
): Map<number, string> {
  const linkMap = new Map<number, string>();
  
  // Handle case where poolsheet might be empty or error response
  if (!poolsheetData || !poolsheetData.Matches || !Array.isArray(poolsheetData.Matches)) {
    return linkMap;
  }
  
  poolsheetData.Matches.forEach((match: PoolsheetMatch) => {
    if (match.Court?.VideoLink) {
      linkMap.set(match.MatchId, match.Court.VideoLink);
    }
  });
  
  return linkMap;
}

/**
 * Merge BallerTV links into FilteredMatch objects
 */
export function mergeBallerTVLinks(
  matches: FilteredMatch[],
  linkMap: Map<number, string>
): FilteredMatch[] {
  return matches.map(match => {
    const ballerTVLink = linkMap.get(match.MatchId);
    if (ballerTVLink) {
      return { ...match, BallerTVLink: ballerTVLink };
    }
    return match;
  });
}

/**
 * Get BallerTV link for a specific match from multiple poolsheet responses
 */
export function getBallerTVLinkForMatch(
  matchId: number,
  poolsheets: PoolsheetResponse[]
): string | null {
  for (const poolsheet of poolsheets) {
    const link = getBallerTVLinkFromPoolsheetMatch(matchId, poolsheet);
    if (link) return link;
  }
  return null;
}

