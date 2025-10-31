import { useState, useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime } from '../utils/dateUtils';
import { detectConflicts } from '../utils/matchFilters';
import { ConflictDetailsPanel } from './ConflictDetailsPanel';
import type { useCoveragePlan } from '../hooks/useCoveragePlan';
import { useFilters } from '../hooks/useFilters';
import { usePriority } from '../hooks/usePriority';
import { PrioritySelector } from './PrioritySelector';
import { detectOpportunities } from '../utils/opportunityDetector';
import { useCoverageStatus } from '../hooks/useCoverageStatus';
import { CoverageStatusSelector } from './CoverageStatusSelector';
import type { useUserRole } from '../hooks/useUserRole';
import { useMatchClaiming } from '../hooks/useMatchClaiming';
import { Scorekeeper } from './Scorekeeper';
import type { SetScore } from '../types';
import { useScoreSync } from '../hooks/useScoreSync';
import { LiveScoreIndicator } from './LiveScoreIndicator';

interface TimelineViewProps {
  matches: FilteredMatch[];
  coveragePlan: ReturnType<typeof useCoveragePlan>;
  userRole: ReturnType<typeof useUserRole>;
  eventId: string;
}

export const TimelineView = ({ matches, coveragePlan, userRole, eventId }: TimelineViewProps) => {
  const conflicts = detectConflicts(matches);
  const [selectedConflict, setSelectedConflict] = useState<FilteredMatch | null>(null);
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState<number | null>(null);
  const [coverageStatusMenuOpen, setCoverageStatusMenuOpen] = useState<string | null>(null);
  const [scorekeeperMatch, setScorekeeperMatch] = useState<FilteredMatch | null>(null);

  // Use match claiming hook (for spectator role)
  const matchClaiming = useMatchClaiming({ eventId, userId: userRole.isSpectator ? 'spectator' : 'anonymous' });

  // Use score synchronization hook
  useScoreSync({
    eventId,
    onScoreUpdate: () => {
      // Force re-render when scores update
      // The matchClaiming hook will automatically update its state from localStorage
    },
  });

  // Use shared filter hook
  const {
    filters,
    applyFilters,
    updateFilter,
    resetFilters,
    getUniqueDivisions,
    getFilteredDivisions,
    getUniqueTeams,
    getTeamIdentifier: getTeamIdFromFilter,
  } = useFilters();

  // Use priority hook
  const priority = usePriority();

  // Use coverage status hook
  const coverageStatus = useCoverageStatus();

  // Get unique divisions and teams for filter dropdowns
  // Filter divisions by wave if wave filter is active
  const divisions = useMemo(() => {
    if (filters.wave !== 'all') {
      return getFilteredDivisions(matches, filters.wave);
    }
    return getUniqueDivisions(matches);
  }, [matches, filters.wave, getUniqueDivisions, getFilteredDivisions]);
  const teams = useMemo(() => getUniqueTeams(matches), [matches, getUniqueTeams]);

  // Apply filters to matches (including priority and coverage status filters)
  const filteredMatches = useMemo(() => {
    let filtered = applyFilters(matches);
    
    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(m => {
        const matchPriority = priority.getPriority(m.MatchId);
        return matchPriority === filters.priority;
      });
    }
    
    // Apply coverage status filter
    if (filters.coverageStatus && filters.coverageStatus !== 'all') {
      filtered = filtered.filter(m => {
        const teamId = getTeamIdFromFilter(m);
        if (!teamId) return true; // Keep matches without team ID
        const status = coverageStatus.getTeamStatus(teamId);
        
        if (filters.coverageStatus === 'uncovered') {
          return status === 'not-covered';
        } else if (filters.coverageStatus === 'covered') {
          return status === 'covered' || status === 'partially-covered';
        } else if (filters.coverageStatus === 'planned') {
          return status === 'planned';
        }
        
        return true;
      });
    }
    
    return filtered;
  }, [matches, applyFilters, filters.priority, filters.coverageStatus, priority, coverageStatus, getTeamIdFromFilter]);

  // Detect opportunities for visual indicators
  const opportunities = useMemo(() => {
    const selectedSet = new Set(coveragePlan.selectedMatches);
    return detectOpportunities(matches, selectedSet, conflicts, {
      excludeSelected: true,
      preferNoConflicts: true,
      preferNearSelected: true,
      maxResults: 50,
    });
  }, [matches, coveragePlan.selectedMatches, conflicts]);

  const opportunityMatchIds = useMemo(() => {
    return new Set(opportunities.map(o => o.match.MatchId));
  }, [opportunities]);

  // Get team identifier (use filter hook's version)
  const getTeamIdentifier = getTeamIdFromFilter;

  if (filteredMatches.length === 0) {
    return (
      <div className="text-center py-12 text-[#9fa2ab] text-sm">
        {filters.division || filters.wave !== 'all' || filters.teams.length > 0 || filters.timeRange.start || filters.timeRange.end
          ? 'No matches found for selected filters'
          : 'No matches found'}
      </div>
    );
  }

  // Get opponent
  const getOpponent = (match: FilteredMatch): string => {
    if (match.InvolvedTeam === 'first') return match.SecondTeamText;
    if (match.InvolvedTeam === 'second') return match.FirstTeamText;
    return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
  };

  // Calculate timeline bounds
  const earliestTime = Math.min(...filteredMatches.map((m) => m.ScheduledStartDateTime));
  const latestTime = Math.max(...filteredMatches.map((m) => m.ScheduledEndDateTime));
  const totalDuration = latestTime - earliestTime;

  const getPosition = (startTime: number) => {
    if (totalDuration === 0) return 0;
    return ((startTime - earliestTime) / (latestTime - earliestTime)) * 100;
  };

  const getWidth = (startTime: number, endTime: number) => {
    if (totalDuration === 0) return 100;
    return ((endTime - startTime) / (latestTime - earliestTime)) * 100;
  };

  // Group matches by court
  const matchesByCourt = filteredMatches.reduce((acc, match) => {
    if (!acc[match.CourtName]) {
      acc[match.CourtName] = [];
    }
    acc[match.CourtName].push(match);
    return acc;
  }, {} as Record<string, FilteredMatch[]>);

  const courts = Object.keys(matchesByCourt).sort();

  // Get conflicting matches for selected conflict
  const conflictingMatchesForSelected = useMemo(() => {
    if (!selectedConflict) return [];
    const conflictIds = conflicts.get(selectedConflict.MatchId) || [];
    return matches.filter(m => conflictIds.includes(m.MatchId));
  }, [selectedConflict, conflicts, matches]);

  const handleMatchClick = (match: FilteredMatch) => {
    if (conflicts.has(match.MatchId)) {
      setSelectedConflict(match);
    }
  };

  const handleTeamClick = (teamId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent match click from firing
    if (highlightedTeam === teamId) {
      setHighlightedTeam(null); // Toggle off if already highlighted
    } else {
      setHighlightedTeam(teamId);
      setSelectedConflict(null); // Clear conflict selection when highlighting team
    }
  };

  // Get matches for highlighted team
  const highlightedTeamMatches = useMemo(() => {
    if (!highlightedTeam) return new Set<number>();
    return new Set(
      matches
        .filter(m => getTeamIdentifier(m) === highlightedTeam)
        .map(m => m.MatchId)
    );
  }, [highlightedTeam, matches]);

  // Calculate time gaps between matches on each court
  const calculateGaps = (courtMatches: FilteredMatch[]) => {
    const gaps: Array<{ before: FilteredMatch; after: FilteredMatch; gapMinutes: number }> = [];
    const sorted = [...courtMatches].sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const gapMinutes = Math.floor((next.ScheduledStartDateTime - current.ScheduledEndDateTime) / 60000);
      
      if (gapMinutes > 0) {
        gaps.push({ before: current, after: next, gapMinutes });
      }
    }
    
    return gaps;
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
        {/* Wave Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Wave:</span>
          <div className="flex gap-1 bg-[#454654] rounded-lg p-1">
            <button
              onClick={() => updateFilter('wave', 'all')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                filters.wave === 'all'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => updateFilter('wave', 'morning')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                filters.wave === 'morning'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => updateFilter('wave', 'afternoon')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                filters.wave === 'afternoon'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Afternoon
            </button>
          </div>
        </div>

        {/* Division Filter */}
        {divisions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Division:</span>
            <select
              value={filters.division || ''}
              onChange={(e) => updateFilter('division', e.target.value || null)}
              className="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
            >
              <option value="">All Divisions{filters.wave !== 'all' ? ` (${filters.wave})` : ''}</option>
              {divisions.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
        )}

        {/* Team Filter */}
        {teams.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Team:</span>
            <select
              multiple
              value={filters.teams}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateFilter('teams', selected);
              }}
              className="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0 min-w-[120px]"
              size={Math.min(teams.length, 4)}
            >
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        )}

        {/* Time Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Time:</span>
          <div className="flex gap-1 bg-[#454654] rounded-lg p-1">
            <button
              onClick={() => updateFilter('timeRange', { start: null, end: null })}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                filters.timeRange.start === null && filters.timeRange.end === null
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => updateFilter('timeRange', { start: '08:00', end: '14:30' })}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                filters.timeRange.start === '08:00' && filters.timeRange.end === '14:30'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => updateFilter('timeRange', { start: '14:30', end: '23:59' })}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                filters.timeRange.start === '14:30' && filters.timeRange.end === '23:59'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Afternoon
            </button>
          </div>
        </div>

        {/* Coverage Status Filter - Media Only */}
        {userRole.isMedia && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Status:</span>
            <select
              value={filters.coverageStatus || 'all'}
              onChange={(e) => updateFilter('coverageStatus', e.target.value as any)}
              className="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
            >
              <option value="all">All Status</option>
              <option value="uncovered">Uncovered</option>
              <option value="planned">Planned</option>
              <option value="covered">Covered</option>
            </select>
          </div>
        )}

        {/* Priority Filter - Media Only */}
        {userRole.isMedia && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Priority:</span>
            <select
              value={filters.priority || 'all'}
              onChange={(e) => updateFilter('priority', e.target.value === 'all' ? 'all' : e.target.value as any)}
              className="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
            >
              <option value="all">All Priorities</option>
              <option value="must-cover">Must Cover</option>
              <option value="priority">Priority</option>
              <option value="optional">Optional</option>
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {(filters.division || filters.wave !== 'all' || filters.teams.length > 0 || filters.timeRange.start || filters.timeRange.end || (filters.priority && filters.priority !== 'all') || (filters.coverageStatus && filters.coverageStatus !== 'all')) && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 sm:py-1 text-xs font-medium rounded-lg transition-colors text-[#9fa2ab] hover:text-[#f8f8f9] hover:bg-[#454654] border border-[#525463] min-h-[44px] sm:min-h-0"
          >
            Clear
          </button>
        )}
      </div>

      {/* Timeline Header - Compact per style guide */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#9fa2ab]">
          Timeline: {formatMatchTime(earliestTime)} - {formatMatchTime(latestTime)}
          {filteredMatches.length !== matches.length && (
            <span className="ml-2">
              ({filteredMatches.length} of {matches.length})
            </span>
          )}
        </div>
        {highlightedTeam && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9fa2ab]">Showing:</span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50">
              Team {highlightedTeam}
            </span>
            <button
              onClick={() => setHighlightedTeam(null)}
              className="text-xs text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
              aria-label="Clear highlight"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Court Timelines - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="space-y-4 min-w-max sm:min-w-0">
          {courts.map((courtName) => {
            const courtMatches = matchesByCourt[courtName];
            return (
              <div key={courtName} className="border-b border-[#454654] pb-4 last:border-b-0 last:pb-0 min-w-[600px] sm:min-w-0">
                {/* Court Header - Inline utility pattern */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-base font-semibold text-[#f8f8f9]">{courtName}</div>
                  <div className="text-xs text-[#808593]">
                    {courtMatches.length} match{courtMatches.length !== 1 ? 'es' : ''}
                  </div>
                </div>

                {/* Timeline Bar - Taller for readability, touch-friendly */}
                <div className="relative h-20 sm:h-20 rounded-lg border overflow-hidden bg-[#3b3c48] border-[#454654]">
                  {/* Time gaps visualization */}
                  {(() => {
                    const gaps = calculateGaps(courtMatches);
                    return gaps.map((gap, gapIndex) => {
                      const gapStart = getPosition(gap.before.ScheduledEndDateTime);
                      const gapEnd = getPosition(gap.after.ScheduledStartDateTime);
                      const gapWidth = gapEnd - gapStart;
                      
                      // Categorize gaps
                      const isLargeGap = gap.gapMinutes >= 30;
                      const isMediumGap = gap.gapMinutes >= 15 && gap.gapMinutes < 30;
                      
                      // Only show gaps if they're visible (width > 1%)
                      if (gapWidth < 1) return null;
                      
                      return (
                        <div
                          key={`gap-${gapIndex}`}
                          className="absolute top-0 bottom-0 flex items-center justify-center"
                          style={{
                            left: `${gapStart}%`,
                            width: `${gapWidth}%`,
                            zIndex: 0,
                          }}
                          title={`${gap.gapMinutes} min gap between matches`}
                        >
                          {gapWidth > 3 && (
                            <div className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                              isLargeGap 
                                ? 'bg-green-500/20 text-green-400' 
                                : isMediumGap
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {gap.gapMinutes}m
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  
                  {courtMatches.map((match) => {
                    const hasConflict = conflicts.has(match.MatchId);
                    const isSelected = selectedConflict?.MatchId === match.MatchId;
                    const teamId = getTeamIdentifier(match);
                    const isHighlighted = highlightedTeam !== null && highlightedTeamMatches.has(match.MatchId);
                    const shouldDim = highlightedTeam !== null && !isHighlighted;
                    const isInPlan = coveragePlan.isSelected(match.MatchId);
                    const matchPriority = priority.getPriority(match.MatchId);
                    const isOpportunity = opportunityMatchIds.has(match.MatchId);
                    const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered';
                    const isCovered = teamCoverageStatus === 'covered' || teamCoverageStatus === 'partially-covered';
                    const isPlanned = teamCoverageStatus === 'planned';
                    const isUncovered = teamCoverageStatus === 'not-covered';
                    const left = getPosition(match.ScheduledStartDateTime);
                    const width = Math.max(
                      getWidth(match.ScheduledStartDateTime, match.ScheduledEndDateTime),
                      2
                    );
                    const opponent = getOpponent(match);

                    return (
                      <div
                        key={match.MatchId}
                        onClick={(e) => {
                          if (e.target instanceof HTMLElement && e.target.closest('.priority-button')) {
                            return; // Don't toggle if clicking priority button
                          }
                          if (hasConflict) {
                            handleMatchClick(match);
                          } else if (userRole.isMedia) {
                            coveragePlan.toggleMatch(match.MatchId);
                          } else {
                            handleMatchClick(match);
                          }
                        }}
                        className={`group absolute h-16 rounded-md px-2 py-1.5 text-white shadow-sm border-2 flex flex-col justify-center transition-all active:scale-95 sm:hover:z-20 sm:hover:shadow-lg touch-manipulation cursor-pointer ${
                          isSelected ? 'ring-2 ring-[#eab308] ring-offset-2 ring-offset-[#3b3c48]' : ''
                        } ${
                          isHighlighted ? 'ring-2 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''
                        } ${shouldDim ? 'opacity-30' : ''} ${isInPlan ? 'ring-1 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''} ${isCovered ? 'opacity-60' : ''}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: matchPriority === 'must-cover'
                            ? '#eab308'
                            : matchPriority === 'priority'
                            ? '#f59e0b'
                            : isUncovered && !isInPlan
                            ? '#eab308'
                            : isPlanned
                            ? '#eab308'
                            : isHighlighted 
                            ? '#eab308'
                            : isInPlan && !hasConflict
                            ? '#eab308'
                            : isCovered
                            ? '#10b981'
                            : isOpportunity && !isInPlan
                            ? '#10b981'
                            : hasConflict 
                            ? '#dc2626' 
                            : match.Division.ColorHex,
                          borderColor: matchPriority === 'must-cover'
                            ? '#facc15'
                            : matchPriority === 'priority'
                            ? '#fbbf24'
                            : isUncovered && !isInPlan
                            ? '#facc15'
                            : isPlanned
                            ? '#facc15'
                            : isSelected 
                            ? '#eab308' 
                            : isHighlighted
                            ? '#facc15'
                            : isInPlan
                            ? '#facc15'
                            : hasConflict 
                            ? '#ef4444' 
                            : 'rgba(255, 255, 255, 0.2)',
                          minWidth: '100px',
                          zIndex: isSelected ? 30 : isHighlighted ? 20 : matchPriority === 'must-cover' ? 18 : isInPlan ? 15 : hasConflict ? 10 : 1,
                        }}
                        title={`${match.CompleteShortName}: ${match.FirstTeamText} vs ${match.SecondTeamText} - ${formatMatchTime(match.ScheduledStartDateTime)}${hasConflict ? ' (Click to see conflicts)' : ' (Click to add to plan)'}${matchPriority ? ` [Priority: ${matchPriority}]` : ''}${isOpportunity && !isInPlan ? ' [Easy opportunity]' : ''}${teamCoverageStatus !== 'not-covered' ? ` [Coverage: ${teamCoverageStatus}]` : ''}`}
                      >
                        {/* Priority Indicator - Media Only */}
                        {userRole.isMedia && matchPriority && (
                          <div className="absolute top-0 left-0 text-[10px]">
                            {matchPriority === 'must-cover' && '⭐'}
                            {matchPriority === 'priority' && '🔸'}
                            {matchPriority === 'optional' && '○'}
                          </div>
                        )}
                        
                        {/* Opportunity Badge - Media Only */}
                        {userRole.isMedia && isOpportunity && !isInPlan && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" title="Easy coverage opportunity" />
                        )}
                        
                        {/* Selection Indicator - Media Only */}
                        {userRole.isMedia && isInPlan && (
                          <div className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center">
                            <svg className="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* Team Identifier - Primary content - Clickable for highlighting */}
                        <div 
                          onClick={(e) => teamId && handleTeamClick(teamId, e)}
                          className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                            teamId ? 'cursor-pointer hover:underline' : ''
                          }`}
                        >
                          {teamId || match.Division.CodeAlias}
                        </div>
                        
                        {/* Opponent - Secondary content */}
                        <div className="text-[9px] sm:text-[10px] opacity-90 truncate mt-0.5 leading-tight">
                          vs {opponent.length > 20 ? opponent.substring(0, 17) + '...' : opponent}
                        </div>
                        
                        {/* Time - Metadata */}
                        <div className="text-[9px] sm:text-[10px] opacity-75 mt-0.5">
                          {formatMatchTime(match.ScheduledStartDateTime)}
                        </div>

                        {/* Score Display - Show if match has score */}
                        {(() => {
                          const score = matchClaiming.getScore(match.MatchId);
                          if (score && score.status !== 'not-started') {
                            const currentSet = score.sets.find((s: SetScore) => s.completedAt === 0) || score.sets[score.sets.length - 1];
                            const completedSets = score.sets.filter((s: SetScore) => s.completedAt > 0);
                            const team1Wins = completedSets.filter((s: SetScore) => s.team1Score > s.team2Score).length;
                            const team2Wins = completedSets.filter((s: SetScore) => s.team2Score > s.team1Score).length;
                            
                            return (
                              <div className="flex items-center gap-1 mt-0.5">
                                {completedSets.length > 0 && (
                                  <div className="text-[8px] text-[#9fa2ab]">
                                    ({team1Wins}-{team2Wins})
                                  </div>
                                )}
                                <div className="text-[9px] font-semibold text-white">
                                  {currentSet.team1Score}-{currentSet.team2Score}
                                </div>
                                <LiveScoreIndicator
                                  isLive={score.status === 'in-progress'}
                                  lastUpdated={score.lastUpdated}
                                  className="text-[8px]"
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Priority Button - Media Only */}
                        {userRole.isMedia && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPriorityMenuOpen(priorityMenuOpen === match.MatchId ? null : match.MatchId);
                              }}
                              className={`priority-button flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-black/20 ${
                                matchPriority === 'must-cover'
                                  ? 'text-[#facc15]'
                                  : matchPriority === 'priority'
                                  ? 'text-[#fbbf24]'
                                  : matchPriority === 'optional'
                                  ? 'text-white/60'
                                  : 'text-white/40'
                              }`}
                              aria-label="Set priority"
                              title={matchPriority ? `Priority: ${matchPriority}` : 'Set priority'}
                            >
                              {matchPriority === 'must-cover' && '⭐'}
                              {matchPriority === 'priority' && '🔸'}
                              {matchPriority === 'optional' && '○'}
                              {!matchPriority && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              )}
                            </button>
                            {priorityMenuOpen === match.MatchId && (
                              <div className="absolute left-full top-0 ml-2 z-50">
                                <PrioritySelector
                                  matchId={match.MatchId}
                                  currentPriority={matchPriority}
                                  onPriorityChange={priority.setPriority}
                                  onClose={() => setPriorityMenuOpen(null)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Coverage Status Button - Media Only */}
                        {userRole.isMedia && teamId && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCoverageStatusMenuOpen(coverageStatusMenuOpen === teamId ? null : teamId);
                              }}
                              className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-black/20 ${
                                teamCoverageStatus === 'covered'
                                  ? 'text-green-400'
                                  : teamCoverageStatus === 'partially-covered'
                                  ? 'text-[#fbbf24]'
                                  : teamCoverageStatus === 'planned'
                                  ? 'text-[#facc15]'
                                  : 'text-white/40'
                              }`}
                              aria-label="Set coverage status"
                              title={`Coverage: ${teamCoverageStatus}`}
                            >
                              {teamCoverageStatus === 'covered' && '✓'}
                              {teamCoverageStatus === 'partially-covered' && '◐'}
                              {teamCoverageStatus === 'planned' && '📋'}
                              {teamCoverageStatus === 'not-covered' && '○'}
                            </button>
                            {coverageStatusMenuOpen === teamId && (
                              <div className="absolute left-full top-0 ml-2 z-50">
                                <CoverageStatusSelector
                                  teamId={teamId}
                                  currentStatus={teamCoverageStatus}
                                  onStatusChange={coverageStatus.setTeamStatus}
                                  onClose={() => setCoverageStatusMenuOpen(null)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict Details Panel */}
      {selectedConflict && (
        <ConflictDetailsPanel
          match={selectedConflict}
          conflictingMatches={conflictingMatchesForSelected}
          onClose={() => setSelectedConflict(null)}
        />
      )}

      {/* Scorekeeper Modal */}
      {scorekeeperMatch && matchClaiming.isClaimOwner(scorekeeperMatch.MatchId) && (
        <Scorekeeper
          matchId={scorekeeperMatch.MatchId}
          team1Name={scorekeeperMatch.FirstTeamText}
          team2Name={scorekeeperMatch.SecondTeamText}
          currentScore={matchClaiming.getScore(scorekeeperMatch.MatchId)}
          onScoreUpdate={(sets: SetScore[], status: 'not-started' | 'in-progress' | 'completed') => {
            matchClaiming.updateScore(scorekeeperMatch.MatchId, sets, status);
          }}
          onClose={() => setScorekeeperMatch(null)}
        />
      )}
      
      {/* Close priority menu when clicking outside */}
      {priorityMenuOpen !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setPriorityMenuOpen(null)}
        />
      )}
      
      {/* Close coverage status menu when clicking outside */}
      {coverageStatusMenuOpen !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setCoverageStatusMenuOpen(null)}
        />
      )}
    </div>
  );
};
