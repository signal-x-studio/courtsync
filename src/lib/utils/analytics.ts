import type { FilteredMatch } from '../types';

export interface CoverageMetrics {
  totalMatches: number;
  coveredMatches: number;
  coveragePercentage: number;
  totalCoverageTime: number; // in minutes
  teamsCovered: number;
  totalTeams: number;
  averageMatchesPerTeam: number;
  conflictsInPlan: number;
}

export interface TeamCoverageStats {
  teamId: string;
  totalMatches: number;
  coveredMatches: number;
  coveragePercentage: number;
}

/**
 * Calculate coverage metrics from matches and selected matches
 */
export const calculateCoverageMetrics = (
  allMatches: FilteredMatch[],
  selectedMatchIds: Set<number>,
  conflicts: Map<number, number[]>
): CoverageMetrics => {
  const totalMatches = allMatches.length;
  const coveredMatches = selectedMatchIds.size;
  const coveragePercentage = totalMatches > 0 ? (coveredMatches / totalMatches) * 100 : 0;

  // Calculate total coverage time (sum of durations of selected matches)
  const totalCoverageTime = allMatches
    .filter(m => selectedMatchIds.has(m.MatchId))
    .reduce((total, match) => {
      const duration = (match.ScheduledEndDateTime - match.ScheduledStartDateTime) / 60000; // Convert to minutes
      return total + duration;
    }, 0);

  // Get unique teams from all matches
  const extractTeamId = (match: FilteredMatch): string => {
    const teamText = match.InvolvedTeam === 'first' 
      ? match.FirstTeamText 
      : match.SecondTeamText;
    const matchResult = teamText.match(/(\d+-\d+)/);
    return matchResult ? matchResult[1] : '';
  };

  const allTeamIds = new Set<string>();
  const coveredTeamIds = new Set<string>();
  
  allMatches.forEach(match => {
    const teamId = extractTeamId(match);
    if (teamId) {
      allTeamIds.add(teamId);
      if (selectedMatchIds.has(match.MatchId)) {
        coveredTeamIds.add(teamId);
      }
    }
  });

  const teamsCovered = coveredTeamIds.size;
  const totalTeams = allTeamIds.size;
  const averageMatchesPerTeam = totalTeams > 0 ? totalMatches / totalTeams : 0;

  // Count conflicts in the plan
  const conflictsInPlan = Array.from(selectedMatchIds).filter(matchId => conflicts.has(matchId)).length;

  return {
    totalMatches,
    coveredMatches,
    coveragePercentage,
    totalCoverageTime,
    teamsCovered,
    totalTeams,
    averageMatchesPerTeam,
    conflictsInPlan,
  };
};

/**
 * Calculate team-level coverage statistics
 */
export const calculateTeamCoverageStats = (
  allMatches: FilteredMatch[],
  selectedMatchIds: Set<number>
): TeamCoverageStats[] => {
  const extractTeamId = (match: FilteredMatch): string => {
    const teamText = match.InvolvedTeam === 'first' 
      ? match.FirstTeamText 
      : match.SecondTeamText;
    const matchResult = teamText.match(/(\d+-\d+)/);
    return matchResult ? matchResult[1] : '';
  };

  const teamStatsMap = new Map<string, { total: number; covered: number }>();

  allMatches.forEach(match => {
    const teamId = extractTeamId(match);
    if (teamId) {
      const stats = teamStatsMap.get(teamId) || { total: 0, covered: 0 };
      stats.total++;
      if (selectedMatchIds.has(match.MatchId)) {
        stats.covered++;
      }
      teamStatsMap.set(teamId, stats);
    }
  });

  return Array.from(teamStatsMap.entries())
    .map(([teamId, stats]) => ({
      teamId,
      totalMatches: stats.total,
      coveredMatches: stats.covered,
      coveragePercentage: stats.total > 0 ? (stats.covered / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.coveragePercentage - a.coveragePercentage);
};

/**
 * Format time duration in minutes to human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

