import { useMemo, useState, useEffect } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime, formatMatchDate } from '../utils/dateUtils';
import { detectConflicts } from '../utils/matchFilters';
import type { useCoveragePlan } from '../hooks/useCoveragePlan';
import { CoverageAnalytics } from './CoverageAnalytics';
import { CoverageStats } from './CoverageStats';
import { TeamMemberSelector } from './TeamMemberSelector';
import { TeamCoverageView } from './TeamCoverageView';
import { useTeamCoordination } from '../hooks/useTeamCoordination';
import { useCoverageStatus } from '../hooks/useCoverageStatus';
import { CoverageStatusSelector } from './CoverageStatusSelector';
import { generateCoverageSuggestions } from '../utils/coverageSuggestions';
import { useFilters } from '../hooks/useFilters';

interface CoveragePlanPanelProps {
  matches: FilteredMatch[];
  coveragePlan: ReturnType<typeof useCoveragePlan>;
  onClose: () => void;
}

interface ConflictGroup {
  matches: FilteredMatch[];
  conflictCount: number;
}

export const CoveragePlanPanel = ({
  matches,
  coveragePlan,
  onClose,
}: CoveragePlanPanelProps) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'analytics' | 'stats' | 'coordination'>('plan');
  const [coverageStatusFilter, setCoverageStatusFilter] = useState<'all' | 'not-covered' | 'planned' | 'covered'>('all');
  const [coverageStatusMenuOpen, setCoverageStatusMenuOpen] = useState<string | null>(null);
  
  // Team coordination hooks
  const teamCoordination = useTeamCoordination();
  const coverageStatus = useCoverageStatus();
  const { getTeamIdentifier } = useFilters();

  // Auto-update coverage status when matches are added/removed from plan
  useEffect(() => {
    if (matches.length === 0) return;
    
    // Group matches by team
    const teamMatches = new Map<string, { total: number; inPlan: number }>();
    
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (!teamId) return;
      
      const stats = teamMatches.get(teamId) || { total: 0, inPlan: 0 };
      stats.total++;
      if (coveragePlan.isSelected(match.MatchId)) {
        stats.inPlan++;
      }
      teamMatches.set(teamId, stats);
    });
    
    // Update coverage status for each team
    teamMatches.forEach((stats, teamId) => {
      coverageStatus.updateFromPlan(teamId, stats.inPlan, stats.total);
    });
  }, [matches, coveragePlan.selectedMatches, coverageStatus, getTeamIdentifier]);

  // Get selected matches with full details, filtered by coverage status if needed
  const selectedMatchesList = useMemo(() => {
    let filtered = matches
      .filter(m => coveragePlan.isSelected(m.MatchId))
      .sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
    
    // Apply coverage status filter
    if (coverageStatusFilter !== 'all') {
      filtered = filtered.filter(match => {
        const teamId = getTeamIdentifier(match);
        if (!teamId) return false;
        const status = coverageStatus.getTeamStatus(teamId);
        return status === coverageStatusFilter;
      });
    }
    
    return filtered;
  }, [matches, coveragePlan, coverageStatusFilter, coverageStatus, getTeamIdentifier]);

  // Detect conflicts within selected matches
  const planConflicts = useMemo(() => {
    return detectConflicts(selectedMatchesList);
  }, [selectedMatchesList]);

  // Coverage-aware opportunities (prioritize uncovered teams)
  const coverageAwareOpportunities = useMemo(() => {
    const conflicts = detectConflicts(matches);
    const selectedSet = new Set(coveragePlan.selectedMatches);
    
    // Get coverage status map
    const coverageStatusMap = new Map<string, string>();
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (teamId) {
        coverageStatusMap.set(teamId, coverageStatus.getTeamStatus(teamId));
      }
    });
    
    return generateCoverageSuggestions(
      matches,
      selectedSet,
      conflicts,
      coverageStatusMap as any,
      getTeamIdentifier,
      {
        preferUncovered: true,
        preferNoConflicts: true,
        preferNearSelected: true,
        maxResults: 5,
      }
    );
  }, [matches, coveragePlan.selectedMatches, coverageStatus, getTeamIdentifier]);

  // Group conflicts for easier resolution
  const conflictGroups = useMemo(() => {
    if (planConflicts.size === 0) return [];

    const groups: ConflictGroup[] = [];
    const processed = new Set<number>();

    selectedMatchesList.forEach(match => {
      if (processed.has(match.MatchId)) return;

      const conflictIds = planConflicts.get(match.MatchId);
      if (!conflictIds || conflictIds.length === 0) return;

      const conflictMatches = [
        match,
        ...conflictIds.map(id => selectedMatchesList.find(m => m.MatchId === id)).filter(Boolean) as FilteredMatch[],
      ];

      conflictMatches.forEach(m => processed.add(m.MatchId));

      groups.push({
        matches: conflictMatches.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime),
        conflictCount: conflictMatches.length,
      });
    });

    return groups;
  }, [selectedMatchesList, planConflicts]);

  // Get conflicts for a specific match
  const getMatchConflicts = (matchId: number): FilteredMatch[] => {
    const conflictIds = planConflicts.get(matchId) || [];
    return conflictIds
      .map(id => selectedMatchesList.find(m => m.MatchId === id))
      .filter(Boolean) as FilteredMatch[];
  };

  // Extract team identifier (using useFilters)
  // Note: getTeamIdentifier is already available from useFilters hook above

  // Get opponent
  const getOpponent = (m: FilteredMatch): string => {
    if (m.InvolvedTeam === 'first') return m.SecondTeamText;
    if (m.InvolvedTeam === 'second') return m.FirstTeamText;
    return `${m.FirstTeamText} vs ${m.SecondTeamText}`;
  };

  // Calculate total coverage time
  const totalCoverageTime = useMemo(() => {
    if (selectedMatchesList.length === 0) return 0;
    const earliest = Math.min(...selectedMatchesList.map(m => m.ScheduledStartDateTime));
    const latest = Math.max(...selectedMatchesList.map(m => m.ScheduledEndDateTime));
    return Math.floor((latest - earliest) / 60000); // minutes
  }, [selectedMatchesList]);

  // Group by date
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, FilteredMatch[]> = {};
    selectedMatchesList.forEach(match => {
      const dateKey = formatMatchDate(match.ScheduledStartDateTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  }, [selectedMatchesList]);

  const sortedDates = useMemo(() => {
    return Object.keys(matchesByDate).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      return dateA - dateB;
    });
  }, [matchesByDate]);

  // Export handlers
  const handleExportJSON = () => {
    const exportData = {
      plan: {
        createdAt: new Date().toISOString(),
        totalMatches: selectedMatchesList.length,
        totalCoverageTime: totalCoverageTime,
        conflicts: conflictGroups.length,
      },
      matches: selectedMatchesList.map(match => ({
        MatchId: match.MatchId,
        Date: formatMatchDate(match.ScheduledStartDateTime),
        Time: formatMatchTime(match.ScheduledStartDateTime),
        Court: match.CourtName,
        Team: getTeamIdentifier(match) || match.Division.CodeAlias,
        Opponent: getOpponent(match),
        Division: match.Division.CodeAlias,
        FirstTeam: match.FirstTeamText,
        SecondTeam: match.SecondTeamText,
        StartTime: new Date(match.ScheduledStartDateTime).toISOString(),
        EndTime: new Date(match.ScheduledEndDateTime).toISOString(),
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Time',
      'Court',
      'Team',
      'Opponent',
      'Division',
      'First Team',
      'Second Team',
      'Start Time',
      'End Time',
    ];

    const rows = selectedMatchesList.map(match => [
      formatMatchDate(match.ScheduledStartDateTime),
      formatMatchTime(match.ScheduledStartDateTime),
      match.CourtName,
      getTeamIdentifier(match) || match.Division.CodeAlias,
      getOpponent(match),
      match.Division.CodeAlias,
      match.FirstTeamText,
      match.SecondTeamText,
      new Date(match.ScheduledStartDateTime).toISOString(),
      new Date(match.ScheduledEndDateTime).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    let text = 'COVERAGE PLAN\n';
    text += `${'='.repeat(50)}\n\n`;
    text += `Total Matches: ${selectedMatchesList.length}\n`;
    text += `Total Coverage Time: ${Math.floor(totalCoverageTime / 60)}h ${totalCoverageTime % 60}m\n`;
    if (conflictGroups.length > 0) {
      text += `Conflicts: ${conflictGroups.length}\n`;
    }
    text += '\n';

    sortedDates.forEach(dateKey => {
      const dateMatches = matchesByDate[dateKey];
      text += `${dateKey}\n`;
      text += `${'-'.repeat(50)}\n`;
      
      dateMatches.forEach(match => {
        const teamId = getTeamIdentifier(match);
        const opponent = getOpponent(match);
        text += `${formatMatchTime(match.ScheduledStartDateTime)} | ${match.CourtName} | ${teamId || match.Division.CodeAlias} vs ${opponent}\n`;
      });
      
      text += '\n';
    });

    const dataBlob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    let text = 'COVERAGE PLAN\n';
    text += `${'='.repeat(50)}\n\n`;
    text += `Total Matches: ${selectedMatchesList.length}\n`;
    text += `Total Coverage Time: ${Math.floor(totalCoverageTime / 60)}h ${totalCoverageTime % 60}m\n`;
    if (conflictGroups.length > 0) {
      text += `Conflicts: ${conflictGroups.length}\n`;
    }
    text += '\n';

    sortedDates.forEach(dateKey => {
      const dateMatches = matchesByDate[dateKey];
      text += `${dateKey}\n`;
      text += `${'-'.repeat(50)}\n`;
      
      dateMatches.forEach(match => {
        const teamId = getTeamIdentifier(match);
        const opponent = getOpponent(match);
        text += `${formatMatchTime(match.ScheduledStartDateTime)} | ${match.CourtName} | ${teamId || match.Division.CodeAlias} vs ${opponent}\n`;
      });
      
      text += '\n';
    });

    try {
      await navigator.clipboard.writeText(text);
      // Show brief success feedback (could be enhanced with a toast notification)
      alert('Coverage plan copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try exporting instead.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[90vh] border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#454654] bg-[#454654]/50">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-[#f8f8f9]">
              My Coverage Plan
            </h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-xs text-[#9fa2ab]">
                {selectedMatchesList.length} match{selectedMatchesList.length !== 1 ? 'es' : ''} selected
                {totalCoverageTime > 0 && ` • ${Math.floor(totalCoverageTime / 60)}h ${totalCoverageTime % 60}m coverage`}
                {conflictGroups.length > 0 && (
                  <span className="ml-2 text-red-400">
                    • {conflictGroups.length} conflict{conflictGroups.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
              {/* Coverage Status Filter */}
              <select
                value={coverageStatusFilter}
                onChange={(e) => setCoverageStatusFilter(e.target.value as any)}
                className="px-2 py-1 text-xs rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="not-covered">Uncovered</option>
                <option value="planned">Planned</option>
                <option value="covered">Covered</option>
              </select>
            </div>
          </div>
          
          {/* Tabs */}
          {selectedMatchesList.length > 0 && (
            <div className="flex items-center gap-1 bg-[#3b3c48] rounded-lg p-1 border border-[#454654] mx-4">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'plan'
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
                }`}
              >
                Plan
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setActiveTab('coordination')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'coordination'
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
                }`}
              >
                Team
              </button>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'plan' ? (
            <>
              {selectedMatchesList.length === 0 ? (
                <div className="text-center py-12 text-[#9fa2ab] text-sm">
                  <p>No matches selected yet</p>
                  <p className="text-xs text-[#808593] mt-2">
                    Click matches in the timeline or list to add them to your coverage plan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Conflict Resolution Section */}
                  {conflictGroups.length > 0 && (
                <div className="border border-red-800/50 rounded-lg bg-red-950/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-red-400">
                        ⚠️ Conflicts Detected
                      </h4>
                      <p className="text-xs text-[#9fa2ab] mt-0.5">
                        {conflictGroups.length} conflict group{conflictGroups.length !== 1 ? 's' : ''} in your plan
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Remove all conflicting matches except the first one in each group
                        conflictGroups.forEach(group => {
                          group.matches.slice(1).forEach(match => {
                            coveragePlan.deselectMatch(match.MatchId);
                          });
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
                    >
                      Auto-Resolve
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {conflictGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="border border-red-800/30 rounded bg-[#3b3c48]/50 p-3">
                        <div className="text-xs font-medium text-red-400 mb-2">
                          Conflict Group {groupIndex + 1}: {group.conflictCount} overlapping match{group.conflictCount !== 1 ? 'es' : ''}
                        </div>
                        <div className="space-y-2">
                          {group.matches.map((match, matchIndex) => {
                            const teamId = getTeamIdentifier(match);
                            const conflictMatches = getMatchConflicts(match.MatchId);
                            const isFirstMatch = matchIndex === 0;

                            return (
                              <div
                                key={match.MatchId}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                                  isFirstMatch ? 'bg-[#eab308]/10 border border-[#eab308]/30' : 'bg-[#454654]/50'
                                }`}
                              >
                                {/* Recommended Keep Indicator */}
                                {isFirstMatch && (
                                  <div className="flex-shrink-0 text-[10px] font-semibold text-[#eab308] px-1.5 py-0.5 rounded bg-[#eab308]/20">
                                    KEEP
                                  </div>
                                )}

                                {/* Match Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#f8f8f9]">
                                      {formatMatchTime(match.ScheduledStartDateTime)}
                                    </span>
                                    <span className="text-xs text-[#facc15] font-medium">
                                      {match.CourtName}
                                    </span>
                                    <span className="text-xs text-[#c0c2c8]">
                                      {teamId || match.Division.CodeAlias}
                                    </span>
                                  </div>
                                  {conflictMatches.length > 0 && (
                                    <div className="text-[10px] text-[#808593] mt-0.5">
                                      Conflicts with {conflictMatches.length} other match{conflictMatches.length !== 1 ? 'es' : ''}
                                    </div>
                                  )}
                                </div>

                                {/* Quick Remove */}
                                {!isFirstMatch && (
                                  <button
                                    onClick={() => coveragePlan.deselectMatch(match.MatchId)}
                                    className="px-2 py-1 text-[10px] font-medium rounded bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                  {/* Opportunity Suggestions */}
                  {coverageAwareOpportunities.length > 0 && (
                    <div className="border border-green-500/50 rounded-lg bg-green-950/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-green-400">
                            💡 Coverage Opportunities
                          </h4>
                          <p className="text-xs text-[#9fa2ab] mt-0.5">
                            {coverageAwareOpportunities.length} suggestion{coverageAwareOpportunities.length !== 1 ? 's' : ''} (prioritizing uncovered teams)
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {coverageAwareOpportunities.map((suggestion) => {
                          const match = suggestion.match;
                          const teamId = getTeamIdentifier(match);
                          const teamStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered';
                          
                          return (
                            <div
                              key={match.MatchId}
                              className="flex items-center gap-2 px-2 py-1.5 rounded bg-green-950/20 border border-green-500/30"
                            >
                              {/* Match Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-[#f8f8f9]">
                                    {formatMatchTime(match.ScheduledStartDateTime)}
                                  </span>
                                  <span className="text-xs text-green-400 font-medium">
                                    {match.CourtName}
                                  </span>
                                  <span className="text-xs text-[#c0c2c8]">
                                    {teamId || match.Division.CodeAlias}
                                  </span>
                                  {teamStatus === 'not-covered' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/50">
                                      Uncovered
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#808593] mt-0.5">
                                  {suggestion.reason}
                                </div>
                              </div>

                              {/* Add Button */}
                              <button
                                onClick={() => coveragePlan.selectMatch(match.MatchId)}
                                className="px-2 py-1 text-xs font-medium rounded transition-colors bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                              >
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matches List */}
                  <div className="space-y-4">
                {sortedDates.map((dateKey) => {
                  const dateMatches = matchesByDate[dateKey];
                  return (
                    <div key={dateKey} className="space-y-2">
                      {/* Date Header */}
                      <div className="flex items-center gap-2 pb-2 border-b border-[#454654]">
                        <h4 className="text-sm font-semibold text-[#f8f8f9]">{dateKey}</h4>
                        <span className="text-xs text-[#808593]">
                          ({dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''})
                        </span>
                      </div>

                      {/* Matches for this date */}
                      {dateMatches.map((match) => {
                        const teamId = getTeamIdentifier(match);
                        const opponent = getOpponent(match);
                        const hasConflict = planConflicts.has(match.MatchId);

                        return (
                          <div
                            key={match.MatchId}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded border ${
                              hasConflict
                                ? 'border-red-800/50 bg-red-950/10'
                                : 'border-[#eab308]/50 bg-[#eab308]/5'
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => coveragePlan.toggleMatch(match.MatchId)}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center hover:opacity-80 transition-colors ${
                                hasConflict
                                  ? 'border-red-800/50 bg-red-950/20'
                                  : 'border-[#eab308] bg-[#eab308]/20'
                              }`}
                              aria-label="Remove from plan"
                            >
                              <svg className={`w-3 h-3 ${hasConflict ? 'text-red-400' : 'text-[#facc15]'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>

                            {/* Conflict Indicator */}
                            {hasConflict && (
                              <div className="flex-shrink-0 text-[10px] font-semibold text-red-400 px-1.5 py-0.5 rounded bg-red-950/50">
                                CONFLICT
                              </div>
                            )}

                            {/* Time */}
                            <div className="flex-shrink-0 w-20 text-sm font-semibold text-[#f8f8f9]">
                              {formatMatchTime(match.ScheduledStartDateTime)}
                            </div>

                            {/* Court */}
                            <div className="flex-shrink-0 w-24 text-sm font-bold text-[#facc15]">
                              {match.CourtName}
                            </div>

                            {/* Team Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-[#f8f8f9]">
                                  {teamId || match.Division.CodeAlias}
                                </div>
                                {teamId && (() => {
                                  const teamStatus = coverageStatus.getTeamStatus(teamId);
                                  return (
                                    <div className={`w-2 h-2 rounded ${
                                      teamStatus === 'covered'
                                        ? 'bg-green-500'
                                        : teamStatus === 'partially-covered'
                                        ? 'bg-[#f59e0b]'
                                        : teamStatus === 'planned'
                                        ? 'bg-[#eab308]'
                                        : 'bg-[#808593]'
                                    }`} title={`Status: ${teamStatus}`} />
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-[#c0c2c8] truncate">
                                vs {opponent}
                              </div>
                            </div>

                            {/* Coverage Status Selector */}
                            {teamId && (
                              <div className="relative flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCoverageStatusMenuOpen(coverageStatusMenuOpen === teamId ? null : teamId);
                                  }}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    coverageStatusMenuOpen === teamId
                                      ? 'bg-[#eab308] text-[#18181b]'
                                      : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]'
                                  }`}
                                  title="Set coverage status"
                                >
                                  {(() => {
                                    const status = coverageStatus.getTeamStatus(teamId);
                                    if (status === 'covered') return '✓';
                                    if (status === 'partially-covered') return '◐';
                                    if (status === 'planned') return '📋';
                                    return '○';
                                  })()}
                                </button>
                                {coverageStatusMenuOpen === teamId && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setCoverageStatusMenuOpen(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 z-50">
                                      <CoverageStatusSelector
                                        teamId={teamId}
                                        currentStatus={coverageStatus.getTeamStatus(teamId)}
                                        onStatusChange={(status) => {
                                          coverageStatus.setTeamStatus(teamId, status as any);
                                          setCoverageStatusMenuOpen(null);
                                        }}
                                        onClose={() => setCoverageStatusMenuOpen(null)}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Division Badge */}
                            <div className="flex-shrink-0">
                              <span
                                className="px-2 py-0.5 text-[10px] font-semibold rounded"
                                style={{
                                  backgroundColor: match.Division.ColorHex + '20',
                                  color: match.Division.ColorHex,
                                  border: `1px solid ${match.Division.ColorHex}40`,
                                }}
                              >
                                {match.Division.CodeAlias}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
                </div>
              )}
            </>
          ) : activeTab === 'analytics' ? (
            <CoverageAnalytics matches={matches} coveragePlan={coveragePlan} />
          ) : activeTab === 'stats' ? (
            <CoverageStats matches={matches} coveragePlan={coveragePlan} />
          ) : (
            <div className="space-y-6">
              <TeamMemberSelector teamCoordination={teamCoordination} />
              <TeamCoverageView
                matches={matches}
                coverageStatus={coverageStatus}
                teamCoordination={teamCoordination}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {selectedMatchesList.length > 0 && activeTab === 'plan' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-[#454654] bg-[#454654]/50">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  // Mark all matches in plan as "Planned"
                  selectedMatchesList.forEach(match => {
                    const teamId = getTeamIdentifier(match);
                    if (teamId) {
                      coverageStatus.setTeamStatus(teamId, 'planned');
                    }
                  });
                  alert('All matches marked as Planned');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]"
              >
                Mark All as Planned
              </button>
              <button
                onClick={() => {
                  // Mark all matches in plan as "Covered"
                  selectedMatchesList.forEach(match => {
                    const teamId = getTeamIdentifier(match);
                    if (teamId) {
                      coverageStatus.setTeamStatus(teamId, 'covered');
                    }
                  });
                  alert('All matches marked as Covered');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]"
              >
                Mark All as Covered
              </button>
              <button
                onClick={coveragePlan.clearPlan}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-[#9fa2ab] hover:text-[#f8f8f9] hover:bg-[#454654]"
              >
                Clear Plan
              </button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Copy to Clipboard */}
              <button
                onClick={handleCopyToClipboard}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]"
                title="Copy plan to clipboard"
              >
                Copy
              </button>

              {/* Export Options */}
              <div className="flex items-center gap-1 bg-[#3b3c48] rounded-lg p-1 border border-[#454654]">
                <button
                  onClick={handleExportJSON}
                  className="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
                  title="Export as JSON"
                >
                  JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
                  title="Export as CSV"
                >
                  CSV
                </button>
                <button
                  onClick={handleExportText}
                  className="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
                  title="Export as Text"
                >
                  TXT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

