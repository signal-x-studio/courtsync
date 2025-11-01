import type { MatchScore, SetScore } from '../types';

/**
 * Score history entry for tracking score changes over time
 */
export interface ScoreHistoryEntry {
  matchId: number;
  timestamp: number;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
  updatedBy: string;
}

/**
 * Store score history in localStorage
 */
const STORAGE_KEY_SCORE_HISTORY = 'scoreHistory';

/**
 * Get score history for a match
 */
export const getScoreHistory = (matchId: number): ScoreHistoryEntry[] => {
  try {
    const historyData = localStorage.getItem(STORAGE_KEY_SCORE_HISTORY);
    if (!historyData) return [];

    const allHistory = JSON.parse(historyData) as Record<string, ScoreHistoryEntry[]>;
    return allHistory[matchId.toString()] || [];
  } catch (error) {
    console.error('Failed to load score history:', error);
    return [];
  }
};

/**
 * Add a score history entry
 */
export const addScoreHistory = (
  matchId: number,
  score: MatchScore,
  updatedBy: string
): void => {
  try {
    const historyData = localStorage.getItem(STORAGE_KEY_SCORE_HISTORY);
    const allHistory: Record<string, ScoreHistoryEntry[]> = historyData
      ? JSON.parse(historyData)
      : {};

    if (!allHistory[matchId.toString()]) {
      allHistory[matchId.toString()] = [];
    }

    const entry: ScoreHistoryEntry = {
      matchId,
      timestamp: Date.now(),
      sets: [...score.sets],
      status: score.status,
      updatedBy,
    };

    allHistory[matchId.toString()].push(entry);

    // Keep only last 100 entries per match to prevent storage bloat
    if (allHistory[matchId.toString()].length > 100) {
      allHistory[matchId.toString()] = allHistory[matchId.toString()].slice(-100);
    }

    localStorage.setItem(STORAGE_KEY_SCORE_HISTORY, JSON.stringify(allHistory));
  } catch (error) {
    console.error('Failed to save score history:', error);
  }
};

/**
 * Clear score history for a match
 */
export const clearScoreHistory = (matchId: number): void => {
  try {
    const historyData = localStorage.getItem(STORAGE_KEY_SCORE_HISTORY);
    if (!historyData) return;

    const allHistory = JSON.parse(historyData) as Record<string, ScoreHistoryEntry[]>;
    delete allHistory[matchId.toString()];
    localStorage.setItem(STORAGE_KEY_SCORE_HISTORY, JSON.stringify(allHistory));
  } catch (error) {
    console.error('Failed to clear score history:', error);
  }
};

/**
 * Calculate team statistics from scores
 */
export interface TeamStats {
  teamId: string;
  teamName: string;
  totalMatches: number;
  completedMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsAllowed: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  avgSetScore: string;
}

/**
 * Calculate team statistics from all scores
 */
export const calculateTeamStats = (
  teamId: string,
  teamName: string,
  matches: Array<{ MatchId: number; FirstTeamText: string; SecondTeamText: string }>,
  scores: Map<number, MatchScore>
): TeamStats => {
  let totalMatches = 0;
  let completedMatches = 0;
  let wins = 0;
  let losses = 0;
  let setsWon = 0;
  let setsLost = 0;
  let pointsScored = 0;
  let pointsAllowed = 0;

  matches.forEach(match => {
    const isTeam1 = match.FirstTeamText === teamId || match.FirstTeamText === teamName;
    const isTeam2 = match.SecondTeamText === teamId || match.SecondTeamText === teamName;
    
    if (!isTeam1 && !isTeam2) return;

    totalMatches++;
    const score = scores.get(match.MatchId);
    
    if (!score || score.status !== 'completed') return;

    completedMatches++;
    
    // Count sets won/lost
    const team1SetsWon = score.sets.filter(s => s.completedAt > 0 && s.team1Score > s.team2Score).length;
    const team2SetsWon = score.sets.filter(s => s.completedAt > 0 && s.team2Score > s.team1Score).length;
    
    if (isTeam1) {
      setsWon += team1SetsWon;
      setsLost += team2SetsWon;
      
      // Sum points
      score.sets.forEach(set => {
        if (set.completedAt > 0) {
          pointsScored += set.team1Score;
          pointsAllowed += set.team2Score;
        }
      });
      
      // Determine win/loss
      if (team1SetsWon > team2SetsWon) {
        wins++;
      } else {
        losses++;
      }
    } else {
      setsWon += team2SetsWon;
      setsLost += team1SetsWon;
      
      // Sum points
      score.sets.forEach(set => {
        if (set.completedAt > 0) {
          pointsScored += set.team2Score;
          pointsAllowed += set.team1Score;
        }
      });
      
      // Determine win/loss
      if (team2SetsWon > team1SetsWon) {
        wins++;
      } else {
        losses++;
      }
    }
  });

  const winPercentage = completedMatches > 0 ? (wins / completedMatches) * 100 : 0;
  const avgPointsScored = completedMatches > 0 ? pointsScored / completedMatches : 0;
  const avgPointsAllowed = completedMatches > 0 ? pointsAllowed / completedMatches : 0;
  const avgSetScore = setsWon + setsLost > 0
    ? `${(setsWon / (setsWon + setsLost) * 100).toFixed(1)}%`
    : '0%';

  return {
    teamId,
    teamName,
    totalMatches,
    completedMatches,
    wins,
    losses,
    winPercentage,
    setsWon,
    setsLost,
    pointsScored,
    pointsAllowed,
    avgPointsScored,
    avgPointsAllowed,
    avgSetScore,
  };
};

/**
 * Export scores to CSV format
 */
export const exportScoresToCSV = (
  matches: Array<{ MatchId: number; FirstTeamText: string; SecondTeamText: string; ScheduledStartDateTime: number; CourtName: string; Division: { CodeAlias: string } }>,
  scores: Map<number, MatchScore>
): string => {
  const headers = ['Match ID', 'Date', 'Time', 'Court', 'Division', 'Team 1', 'Team 2', 'Sets Won (Team 1)', 'Sets Won (Team 2)', 'Status'];
  const rows: string[] = [];

  matches.forEach(match => {
    const score = scores.get(match.MatchId);
    if (!score) return;

    const date = new Date(match.ScheduledStartDateTime);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const completedSets = score.sets.filter(s => s.completedAt > 0);
    const team1SetsWon = completedSets.filter(s => s.team1Score > s.team2Score).length;
    const team2SetsWon = completedSets.filter(s => s.team2Score > s.team1Score).length;

    rows.push([
      match.MatchId.toString(),
      dateStr,
      timeStr,
      match.CourtName,
      match.Division.CodeAlias,
      match.FirstTeamText,
      match.SecondTeamText,
      team1SetsWon.toString(),
      team2SetsWon.toString(),
      score.status,
    ].join(','));
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Export scores to JSON format
 */
export const exportScoresToJSON = (
  matches: Array<{ MatchId: number; FirstTeamText: string; SecondTeamText: string; ScheduledStartDateTime: number; CourtName: string; Division: { CodeAlias: string } }>,
  scores: Map<number, MatchScore>
): string => {
  const exportData = matches
    .filter(match => scores.has(match.MatchId))
    .map(match => {
      const score = scores.get(match.MatchId)!;
      return {
        matchId: match.MatchId,
        date: new Date(match.ScheduledStartDateTime).toISOString(),
        court: match.CourtName,
        division: match.Division.CodeAlias,
        team1: match.FirstTeamText,
        team2: match.SecondTeamText,
        score: {
          sets: score.sets,
          status: score.status,
          lastUpdated: score.lastUpdated,
          lastUpdatedBy: score.lastUpdatedBy,
        },
      };
    });

  return JSON.stringify(exportData, null, 2);
};

