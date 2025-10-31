import type { FilteredMatch } from '../types';
import type { CoverageStatus } from '../hooks/useCoverageStatus';

export interface TeamCoverageMetrics {
  teamId: string;
  status: CoverageStatus;
  totalMatches: number;
  coveredMatches: number;
  coveragePercentage: number;
  plannedMatches: number;
}

export interface CoverageDashboardMetrics {
  totalTeams: number;
  coveredTeams: number;
  partiallyCoveredTeams: number;
  plannedTeams: number;
  uncoveredTeams: number;
  coveragePercentage: number;
  plannedPercentage: number;
  totalMatches: number;
  coveredMatches: number;
  plannedMatches: number;
}

/**
 * Calculate team-level coverage metrics
 */
export const calculateTeamCoverageMetrics = (
  matches: FilteredMatch[],
  selectedMatchIds: Set<number>,
  coverageStatus: Map<string, CoverageStatus>,
  getTeamIdentifier: (match: FilteredMatch) => string
): TeamCoverageMetrics[] => {
  const teamStatsMap = new Map<string, { total: number; covered: number; planned: number }>();

  matches.forEach(match => {
    const teamId = getTeamIdentifier(match);
    if (!teamId) return;

    const stats = teamStatsMap.get(teamId) || { total: 0, covered: 0, planned: 0 };
    stats.total++;
    
    if (selectedMatchIds.has(match.MatchId)) {
      stats.covered++;
    }
    
    // Count planned matches (matches for teams with 'planned' status)
    const status = coverageStatus.get(teamId);
    if (status === 'planned') {
      stats.planned++;
    }
    
    teamStatsMap.set(teamId, stats);
  });

  return Array.from(teamStatsMap.entries())
    .map(([teamId, stats]) => ({
      teamId,
      status: coverageStatus.get(teamId) || 'not-covered',
      totalMatches: stats.total,
      coveredMatches: stats.covered,
      plannedMatches: stats.planned,
      coveragePercentage: stats.total > 0 ? (stats.covered / stats.total) * 100 : 0,
    }))
    .sort((a, b) => {
      // Sort by status priority: uncovered > planned > partially-covered > covered
      const statusOrder: Record<CoverageStatus, number> = {
        'not-covered': 0,
        'planned': 1,
        'partially-covered': 2,
        'covered': 3,
      };
      const orderA = statusOrder[a.status];
      const orderB = statusOrder[b.status];
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // If same status, sort by coverage percentage (lower first)
      return a.coveragePercentage - b.coveragePercentage;
    });
};

/**
 * Calculate overall coverage dashboard metrics
 */
export const calculateCoverageDashboardMetrics = (
  matches: FilteredMatch[],
  selectedMatchIds: Set<number>,
  coverageStatus: Map<string, CoverageStatus>,
  getTeamIdentifier: (match: FilteredMatch) => string
): CoverageDashboardMetrics => {
  const teamStatusMap = new Map<string, CoverageStatus>();
  const teamMatchesMap = new Map<string, { total: number; covered: number; planned: number }>();

  matches.forEach(match => {
    const teamId = getTeamIdentifier(match);
    if (!teamId) return;

    // Track team status
    const status = coverageStatus.get(teamId) || 'not-covered';
    if (!teamStatusMap.has(teamId)) {
      teamStatusMap.set(teamId, status);
    }

    // Track match counts
    const stats = teamMatchesMap.get(teamId) || { total: 0, covered: 0, planned: 0 };
    stats.total++;
    
    if (selectedMatchIds.has(match.MatchId)) {
      stats.covered++;
    }
    
    if (status === 'planned') {
      stats.planned++;
    }
    
    teamMatchesMap.set(teamId, stats);
  });

  const totalTeams = teamStatusMap.size;
  const coveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'covered').length;
  const partiallyCoveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'partially-covered').length;
  const plannedTeams = Array.from(teamStatusMap.values()).filter(s => s === 'planned').length;
  const uncoveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'not-covered').length;

  const totalMatches = matches.length;
  const coveredMatches = selectedMatchIds.size;
  const plannedMatches = Array.from(teamMatchesMap.values()).reduce((sum, stats) => sum + stats.planned, 0);

  return {
    totalTeams,
    coveredTeams,
    partiallyCoveredTeams,
    plannedTeams,
    uncoveredTeams,
    coveragePercentage: totalTeams > 0 ? ((coveredTeams + partiallyCoveredTeams) / totalTeams) * 100 : 0,
    plannedPercentage: totalTeams > 0 ? (plannedTeams / totalTeams) * 100 : 0,
    totalMatches,
    coveredMatches,
    plannedMatches,
  };
};

/**
 * Export coverage statistics to CSV
 */
export const exportCoverageStatsToCSV = (
  teamMetrics: TeamCoverageMetrics[],
  dashboardMetrics: CoverageDashboardMetrics
): string => {
  const lines: string[] = [];
  
  // Header
  lines.push('Coverage Statistics Report');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Dashboard Summary
  lines.push('Summary');
  lines.push(`Total Teams,${dashboardMetrics.totalTeams}`);
  lines.push(`Covered Teams,${dashboardMetrics.coveredTeams}`);
  lines.push(`Partially Covered Teams,${dashboardMetrics.partiallyCoveredTeams}`);
  lines.push(`Planned Teams,${dashboardMetrics.plannedTeams}`);
  lines.push(`Uncovered Teams,${dashboardMetrics.uncoveredTeams}`);
  lines.push(`Coverage Percentage,${dashboardMetrics.coveragePercentage.toFixed(1)}%`);
  lines.push(`Planned Percentage,${dashboardMetrics.plannedPercentage.toFixed(1)}%`);
  lines.push('');
  
  // Team Breakdown
  lines.push('Team Breakdown');
  lines.push('Team ID,Status,Total Matches,Covered Matches,Planned Matches,Coverage Percentage');
  teamMetrics.forEach(team => {
    lines.push(
      `${team.teamId},${team.status},${team.totalMatches},${team.coveredMatches},${team.plannedMatches},${team.coveragePercentage.toFixed(1)}%`
    );
  });
  
  return lines.join('\n');
};

/**
 * Export coverage statistics to JSON
 */
export const exportCoverageStatsToJSON = (
  teamMetrics: TeamCoverageMetrics[],
  dashboardMetrics: CoverageDashboardMetrics
): string => {
  return JSON.stringify({
    generated: new Date().toISOString(),
    summary: dashboardMetrics,
    teams: teamMetrics,
  }, null, 2);
};

