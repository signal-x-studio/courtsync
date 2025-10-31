import type { FilteredMatch } from '../types';
import { formatMatchTime, calculateTimeGap, formatTimeGap } from '../utils/dateUtils';
import { detectConflicts } from '../utils/matchFilters';
import { useState, useMemo } from 'react';
import { TeamDetailPanel } from './TeamDetailPanel';

interface MatchListProps {
  matches: FilteredMatch[];
  eventId: string;
  clubId: number;
}

type SortMode = 'team' | 'court' | 'time';
type DivisionFilter = string | null; // null = all divisions
type WaveFilter = 'all' | 'morning' | 'afternoon'; // afternoon starts at 2:30 PM

export const MatchList = ({ matches, eventId, clubId }: MatchListProps) => {
  const [sortMode, setSortMode] = useState<SortMode>('team');
  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>(null);
  const [waveFilter, setWaveFilter] = useState<WaveFilter>('all');
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const conflicts = detectConflicts(matches);

  // Get unique divisions for filter dropdown
  const divisions = useMemo(() => {
    const divSet = new Set(matches.map(m => m.Division.CodeAlias));
    return Array.from(divSet).sort();
  }, [matches]);

  // Filter matches by division and wave
  const filteredMatches = useMemo(() => {
    let filtered = matches;
    
    // Filter by division
    if (divisionFilter) {
      filtered = filtered.filter(m => m.Division.CodeAlias === divisionFilter);
    }
    
    // Filter by wave (morning = before 2:30 PM, afternoon = 2:30 PM or later)
    if (waveFilter !== 'all') {
      filtered = filtered.filter(m => {
        const startTime = new Date(m.ScheduledStartDateTime).getTime();
        const startDate = new Date(startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        const afternoonStartMinutes = 14 * 60 + 30; // 2:30 PM = 14:30
        
        if (waveFilter === 'morning') {
          return totalMinutes < afternoonStartMinutes;
        } else {
          return totalMinutes >= afternoonStartMinutes;
        }
      });
    }
    
    return filtered;
  }, [matches, divisionFilter, waveFilter]);

  // Extract team identifier (e.g., "16-1" from "630 Volleyball 16-1 (GL)")
  const getTeamIdentifier = (match: FilteredMatch): string => {
    const teamText = match.InvolvedTeam === 'first' 
      ? match.FirstTeamText 
      : match.SecondTeamText;
    
    const matchResult = teamText.match(/(\d+-\d+)/);
    return matchResult ? matchResult[1] : '';
  };

  // Get opponent
  const getOpponent = (match: FilteredMatch): string => {
    if (match.InvolvedTeam === 'first') return match.SecondTeamText;
    if (match.InvolvedTeam === 'second') return match.FirstTeamText;
    return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
  };

  // Sort matches
  const sortedMatches = useMemo(() => {
    if (sortMode === 'team') {
      return [...filteredMatches].sort((a, b) => {
        const teamA = getTeamIdentifier(a);
        const teamB = getTeamIdentifier(b);
        return teamA.localeCompare(teamB);
      });
    } else if (sortMode === 'court') {
      return [...filteredMatches].sort((a, b) => {
        return a.CourtName.localeCompare(b.CourtName);
      });
    } else {
      // Sort by time
      return [...filteredMatches].sort((a, b) => {
        return a.ScheduledStartDateTime - b.ScheduledStartDateTime;
      });
    }
  }, [filteredMatches, sortMode]);

  // Group matches by start time for conflict visibility - ALWAYS GROUP BY TIME
  const matchesByStartTime = useMemo(() => {
    const grouped: Record<string, FilteredMatch[]> = {};
    sortedMatches.forEach(match => {
      const startTime = formatMatchTime(match.ScheduledStartDateTime);
      if (!grouped[startTime]) {
        grouped[startTime] = [];
      }
      grouped[startTime].push(match);
    });
    return grouped;
  }, [sortedMatches]);

  const startTimes = useMemo(() => {
    return Object.keys(matchesByStartTime).sort((a, b) => {
      // Parse time strings to sort chronologically
      const timeA = new Date(`2000-01-01 ${a}`).getTime();
      const timeB = new Date(`2000-01-01 ${b}`).getTime();
      return timeA - timeB;
    });
  }, [matchesByStartTime]);

  if (filteredMatches.length === 0) {
    return (
      <div className="text-center py-12 text-[#9fa2ab] text-sm">
        {divisionFilter 
          ? `No matches found for division ${divisionFilter}`
          : 'No matches found'}
      </div>
    );
  }

  return (
    <div>
      {/* Sort & Filter Controls - Stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Sort:</span>
          <div className="flex gap-1 bg-[#454654] rounded-lg p-1">
            <button
              onClick={() => setSortMode('team')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                sortMode === 'team'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setSortMode('court')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                sortMode === 'court'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Court
            </button>
            <button
              onClick={() => setSortMode('time')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                sortMode === 'time'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Time
            </button>
          </div>
        </div>

        {/* Wave Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Wave:</span>
          <div className="flex gap-1 bg-[#454654] rounded-lg p-1">
            <button
              onClick={() => setWaveFilter('all')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                waveFilter === 'all'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setWaveFilter('morning')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                waveFilter === 'morning'
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setWaveFilter('afternoon')}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                waveFilter === 'afternoon'
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
              value={divisionFilter || ''}
              onChange={(e) => setDivisionFilter(e.target.value || null)}
              className="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
            >
              <option value="">All Divisions</option>
              {divisions.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Matches List - ALWAYS Grouped by Start Time for Conflict Visibility */}
      <div className="space-y-4">
        {startTimes.length === 0 ? (
          <div className="text-center py-12 text-[#9fa2ab] text-sm">
            {waveFilter !== 'all' || divisionFilter
              ? 'No matches found for selected filters'
              : 'No matches found'}
          </div>
        ) : (
          startTimes.map((startTime) => {
            const timeMatches = matchesByStartTime[startTime];
            const timeConflicts = timeMatches.filter(m => conflicts.has(m.MatchId)).length;
            const hasAnyConflict = timeConflicts > 0;
            const allHaveConflicts = timeConflicts === timeMatches.length;
            
            return (
              <div key={startTime} className="space-y-1.5">
                {/* Time Header with Conflict Count */}
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#454654]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#f8f8f9]">{startTime}</h3>
                    <span className="text-xs text-[#9fa2ab]">
                      {timeMatches.length} match{timeMatches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  {hasAnyConflict && (
                    <span className={`text-xs font-medium ${allHaveConflicts ? 'text-[#808593]' : 'text-red-400'}`}>
                      {timeConflicts} conflict{timeConflicts !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Matches at this time */}
                {timeMatches.map((match, index) => {
                  const hasConflict = conflicts.has(match.MatchId);
                  const teamId = getTeamIdentifier(match);
                  const opponent = getOpponent(match);
                  const isExpanded = expandedMatch === match.MatchId;
                  
                  // Calculate time gap from previous match (if sorted by time)
                  const previousMatch = index > 0 ? timeMatches[index - 1] : null;
                  const timeGap = previousMatch && sortMode === 'time'
                    ? calculateTimeGap(previousMatch.ScheduledEndDateTime, match.ScheduledStartDateTime)
                    : null;

                  // Only show conflict styling if NOT all matches conflict (when it's actually differentiating)
                  const showConflictStyling = hasConflict && !allHaveConflicts;

                  return (
                    <div key={match.MatchId}>
                      <div
                        onClick={() => setExpandedMatch(isExpanded ? null : match.MatchId)}
                        className={`group relative rounded transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-2 cursor-pointer match-card min-h-[44px] sm:min-h-0 ${
                          showConflictStyling
                            ? 'border border-red-800/50 bg-red-950/10' 
                            : 'border border-[#454654] bg-[#3b3c48]'
                        } hover:border-[#525463] hover:bg-[#3b3c48]/80`}
                      >
                        {/* Time Gap Indicator */}
                        {timeGap !== null && timeGap > 0 && (
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 text-[10px] font-medium rounded bg-[#454654] text-[#9fa2ab] border border-[#525463]">
                            {formatTimeGap(timeGap)} gap
                          </div>
                        )}
                        {/* Conflict Indicator - Only show when differentiating */}
                        {showConflictStyling && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-l" />
                        )}

                        {/* Mobile: Stack team and court */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 sm:flex-shrink-0 sm:w-16">
                          {/* Team Identifier */}
                          <div>
                            <div className="text-sm sm:text-base font-bold text-[#f8f8f9]">
                              {teamId || match.Division.CodeAlias}
                            </div>
                            <div className="text-[10px] text-[#9fa2ab]">
                              {match.Division.CodeAlias}
                            </div>
                          </div>

                          {/* Court - Prominent on mobile */}
                          <div className="sm:hidden">
                            <div className="text-base font-bold text-[#facc15]">
                              {match.CourtName}
                            </div>
                          </div>
                        </div>

                        {/* Court - Desktop */}
                        <div className="hidden sm:block flex-shrink-0 w-28">
                          <div className="text-lg font-bold text-[#facc15]">
                            {match.CourtName}
                          </div>
                        </div>

                        {/* Opponent */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm text-[#c0c2c8] truncate">
                            vs {opponent}
                          </div>
                        </div>

                        {/* Time - Show on mobile */}
                        <div className="sm:hidden flex-shrink-0 text-right">
                          <div className="text-sm font-semibold text-[#f8f8f9]">
                            {formatMatchTime(match.ScheduledStartDateTime)}
                          </div>
                        </div>

                        {/* Conflict Badge - Only show when differentiating */}
                        {showConflictStyling && (
                          <div className="flex-shrink-0">
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-950/50 text-red-400">
                              {conflicts.get(match.MatchId)?.length || 0}
                            </span>
                          </div>
                        )}

                        {/* Expand Indicator */}
                        <div className="flex-shrink-0 w-4">
                          <svg
                            className={`w-4 h-4 text-[#9fa2ab] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Team Detail Panel */}
                      {isExpanded && (
                        <TeamDetailPanel
                          match={match}
                          eventId={eventId}
                          clubId={clubId}
                          onClose={() => setExpandedMatch(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
