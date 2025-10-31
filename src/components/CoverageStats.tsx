import { useMemo } from 'react';
import type { FilteredMatch } from '../types';
import type { useCoveragePlan } from '../hooks/useCoveragePlan';
import { useCoverageStatus } from '../hooks/useCoverageStatus';
import { useFilters } from '../hooks/useFilters';
import { calculateTeamCoverageMetrics, calculateCoverageDashboardMetrics } from '../utils/coverageStats';
import { exportCoverageStatsToCSV, exportCoverageStatsToJSON } from '../utils/coverageStats';
import type { TeamCoverageMetrics, CoverageDashboardMetrics } from '../utils/coverageStats';

interface CoverageStatsProps {
  matches: FilteredMatch[];
  coveragePlan: ReturnType<typeof useCoveragePlan>;
}

export const CoverageStats = ({ matches, coveragePlan }: CoverageStatsProps) => {
  const coverageStatus = useCoverageStatus();
  const { getTeamIdentifier } = useFilters();

  // Build coverage status map
  const coverageStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (teamId) {
        map.set(teamId, coverageStatus.getTeamStatus(teamId));
      }
    });
    return map;
  }, [matches, coverageStatus, getTeamIdentifier]);

  // Calculate metrics
  const selectedMatchIds = useMemo(() => {
    return new Set(coveragePlan.selectedMatches);
  }, [coveragePlan.selectedMatches]);

  const teamMetrics = useMemo<TeamCoverageMetrics[]>(() => {
    return calculateTeamCoverageMetrics(
      matches,
      selectedMatchIds,
      coverageStatusMap as any,
      getTeamIdentifier
    );
  }, [matches, selectedMatchIds, coverageStatusMap, getTeamIdentifier]);

  const dashboardMetrics = useMemo<CoverageDashboardMetrics>(() => {
    return calculateCoverageDashboardMetrics(
      matches,
      selectedMatchIds,
      coverageStatusMap as any,
      getTeamIdentifier
    );
  }, [matches, selectedMatchIds, coverageStatusMap, getTeamIdentifier]);

  const handleExportCSV = () => {
    const csv = exportCoverageStatsToCSV(teamMetrics, dashboardMetrics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-stats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = exportCoverageStatsToJSON(teamMetrics, dashboardMetrics);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage Percentage */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Coverage</div>
          <div className="text-2xl font-bold text-[#f8f8f9] mb-1">
            {dashboardMetrics.coveragePercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-[#9fa2ab]">
            {dashboardMetrics.coveredTeams + dashboardMetrics.partiallyCoveredTeams} of {dashboardMetrics.totalTeams} teams
          </div>
        </div>

        {/* Covered Teams */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Covered</div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {dashboardMetrics.coveredTeams}
          </div>
          <div className="text-xs text-[#9fa2ab]">
            {dashboardMetrics.partiallyCoveredTeams} partially covered
          </div>
        </div>

        {/* Planned Teams */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Planned</div>
          <div className="text-2xl font-bold text-[#eab308] mb-1">
            {dashboardMetrics.plannedTeams}
          </div>
          <div className="text-xs text-[#9fa2ab]">
            {dashboardMetrics.plannedPercentage.toFixed(1)}% of teams
          </div>
        </div>

        {/* Uncovered Teams */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Uncovered</div>
          <div className="text-2xl font-bold text-[#808593] mb-1">
            {dashboardMetrics.uncoveredTeams}
          </div>
          <div className="text-xs text-[#9fa2ab]">
            {dashboardMetrics.totalTeams > 0 ? ((dashboardMetrics.uncoveredTeams / dashboardMetrics.totalTeams) * 100).toFixed(1) : 0}% remaining
          </div>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-[#f8f8f9]">Overall Coverage Progress</div>
          <div className="text-xs text-[#9fa2ab]">{dashboardMetrics.coveragePercentage.toFixed(1)}%</div>
        </div>
        <div className="w-full h-3 bg-[#454654] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#eab308] transition-all duration-300"
            style={{ width: `${Math.min(dashboardMetrics.coveragePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Team Breakdown */}
      <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-[#f8f8f9]">Team Coverage Breakdown</div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
            >
              Export JSON
            </button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {teamMetrics.map((team) => (
            <div key={team.teamId} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-3 h-3 rounded ${
                    team.status === 'covered'
                      ? 'bg-green-500'
                      : team.status === 'partially-covered'
                      ? 'bg-[#f59e0b]'
                      : team.status === 'planned'
                      ? 'bg-[#eab308]'
                      : 'bg-[#808593]'
                  }`} />
                  <div className="text-sm font-medium text-[#f8f8f9]">
                    Team {team.teamId}
                  </div>
                </div>
                <div className="text-xs text-[#9fa2ab]">
                  {team.coveredMatches}/{team.totalMatches} matches
                  {team.plannedMatches > 0 && ` • ${team.plannedMatches} planned`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-24 h-2 bg-[#454654] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      team.status === 'covered'
                        ? 'bg-green-500'
                        : team.status === 'partially-covered'
                        ? 'bg-[#f59e0b]'
                        : team.status === 'planned'
                        ? 'bg-[#eab308]'
                        : 'bg-[#808593]'
                    }`}
                    style={{ width: `${Math.min(team.coveragePercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-[#9fa2ab] w-12 text-right">
                  {team.coveragePercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

