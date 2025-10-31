import { useMemo } from 'react';
import type { FilteredMatch } from '../types';
import type { useCoveragePlan } from '../hooks/useCoveragePlan';
import { calculateCoverageMetrics, calculateTeamCoverageStats, formatDuration, type CoverageMetrics, type TeamCoverageStats } from '../utils/analytics';
import { detectConflicts } from '../utils/matchFilters';

interface CoverageAnalyticsProps {
  matches: FilteredMatch[];
  coveragePlan: ReturnType<typeof useCoveragePlan>;
}

export const CoverageAnalytics = ({ matches, coveragePlan }: CoverageAnalyticsProps) => {
  const conflicts = useMemo(() => detectConflicts(matches), [matches]);
  
  const selectedMatchIds = useMemo(() => {
    return new Set(coveragePlan.selectedMatches);
  }, [coveragePlan.selectedMatches]);

  const metrics = useMemo<CoverageMetrics>(() => {
    return calculateCoverageMetrics(matches, selectedMatchIds, conflicts);
  }, [matches, selectedMatchIds, conflicts]);

  const teamStats = useMemo<TeamCoverageStats[]>(() => {
    return calculateTeamCoverageStats(matches, selectedMatchIds);
  }, [matches, selectedMatchIds]);

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage Percentage */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Coverage</div>
          <div className="text-2xl font-bold text-[#f8f8f9] mb-1">
            {metrics.coveragePercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-[#9fa2ab]">
            {metrics.coveredMatches} of {metrics.totalMatches} matches
          </div>
        </div>

        {/* Teams Covered */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Teams Covered</div>
          <div className="text-2xl font-bold text-[#f8f8f9] mb-1">
            {metrics.teamsCovered}
          </div>
          <div className="text-xs text-[#9fa2ab]">
            of {metrics.totalTeams} teams
          </div>
        </div>

        {/* Total Coverage Time */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Total Time</div>
          <div className="text-2xl font-bold text-[#f8f8f9] mb-1">
            {formatDuration(metrics.totalCoverageTime)}
          </div>
          <div className="text-xs text-[#9fa2ab]">
            coverage time
          </div>
        </div>

        {/* Conflicts in Plan */}
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Conflicts</div>
          <div className={`text-2xl font-bold mb-1 ${
            metrics.conflictsInPlan > 0 ? 'text-red-400' : 'text-[#f8f8f9]'
          }`}>
            {metrics.conflictsInPlan}
          </div>
          <div className="text-xs text-[#9fa2ab]">
            in coverage plan
          </div>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-[#f8f8f9]">Coverage Progress</div>
          <div className="text-xs text-[#9fa2ab]">{metrics.coveragePercentage.toFixed(1)}%</div>
        </div>
        <div className="w-full h-3 bg-[#454654] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#eab308] transition-all duration-300"
            style={{ width: `${Math.min(metrics.coveragePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Team Coverage Breakdown */}
      {teamStats.length > 0 && (
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-sm font-medium text-[#f8f8f9] mb-4">Team Coverage Breakdown</div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {teamStats.map((team) => (
              <div key={team.teamId} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#f8f8f9] truncate">
                    Team {team.teamId}
                  </div>
                  <div className="text-xs text-[#9fa2ab]">
                    {team.coveredMatches}/{team.totalMatches} matches
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-24 h-2 bg-[#454654] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#eab308] transition-all duration-300"
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
      )}

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Avg Matches/Team</div>
          <div className="text-xl font-bold text-[#f8f8f9]">
            {metrics.averageMatchesPerTeam.toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Coverage Efficiency</div>
          <div className="text-xl font-bold text-[#f8f8f9]">
            {metrics.totalMatches > 0 
              ? ((metrics.teamsCovered / metrics.totalTeams) * 100).toFixed(1) 
              : '0'}%
          </div>
          <div className="text-xs text-[#9fa2ab] mt-1">
            teams covered ratio
          </div>
        </div>
      </div>
    </div>
  );
};

