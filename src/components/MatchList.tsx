import type { FilteredMatch } from '../types';
import { formatMatchTime, calculateTimeGap, formatTimeGap } from '../utils/dateUtils';
import { detectConflicts } from '../utils/matchFilters';
import { useState, useMemo, useEffect, useRef } from 'react';
import { TeamDetailPanel } from './TeamDetailPanel';
import type { useCoveragePlan } from '../hooks/useCoveragePlan';
import { useFilters } from '../hooks/useFilters';
import { usePriority } from '../hooks/usePriority';
import { PrioritySelector } from './PrioritySelector';
import { detectOpportunities } from '../utils/opportunityDetector';
import { useCoverageStatus } from '../hooks/useCoverageStatus';
import { CoverageStatusSelector } from './CoverageStatusSelector';
import { generateCoverageSuggestions } from '../utils/coverageSuggestions';
import type { CoverageStatus } from '../hooks/useCoverageStatus';
import type { useUserRole } from '../hooks/useUserRole';
import { useMatchClaiming } from '../hooks/useMatchClaiming';
import { MatchClaimButton } from './MatchClaimButton';
import { Scorekeeper } from './Scorekeeper';
import type { SetScore } from '../types';
import { useScoreSync } from '../hooks/useScoreSync';
import { LiveScoreIndicator } from './LiveScoreIndicator';
import { exportScoresToJSON, importScoresFromJSON, generateScoreShareUrl, extractScoresFromUrl, hasShareableScoresInUrl } from '../utils/scoreShare';
import { useFollowedTeams } from '../hooks/useFollowedTeams';
import { useNotifications } from '../hooks/useNotifications';
import { MyTeamsSelector } from './MyTeamsSelector';
import { LiveMatchDashboard } from './LiveMatchDashboard';
import { ClaimHistoryPanel } from './ClaimHistoryPanel';

interface MatchListProps {
  matches: FilteredMatch[];
  eventId: string;
  clubId: number;
  coveragePlan: ReturnType<typeof useCoveragePlan>;
  userRole: ReturnType<typeof useUserRole>;
}

type SortMode = 'team' | 'court' | 'time' | 'priority';

export const MatchList = ({ matches, eventId, clubId, coveragePlan, userRole }: MatchListProps) => {
  const [sortMode, setSortMode] = useState<SortMode>('team');
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState<number | null>(null);
  const [coverageStatusMenuOpen, setCoverageStatusMenuOpen] = useState<string | null>(null);
  const [scanningMode, setScanningMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scorekeeperMatch, setScorekeeperMatch] = useState<FilteredMatch | null>(null);
  const [showScoreExportMenu, setShowScoreExportMenu] = useState(false);
  const [showScoreImportDialog, setShowScoreImportDialog] = useState(false);
  const [showClaimHistory, setShowClaimHistory] = useState(false);
  const [claimHistoryMatchId, setClaimHistoryMatchId] = useState<number | undefined>(undefined);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const conflicts = detectConflicts(matches);
  
  // Use match claiming hook (for spectator role)
  const matchClaiming = useMatchClaiming({ eventId, userId: userRole.isSpectator ? 'spectator' : 'anonymous' });

  // Use followed teams hook (for spectator role)
  const followedTeams = useFollowedTeams();

  // Use notifications hook
  const notifications = useNotifications();

  // Use score synchronization hook
  useScoreSync({
    eventId,
    onScoreUpdate: () => {
      // Force re-render when scores update
      // The matchClaiming hook will automatically update its state from localStorage
    },
  });

  // Track claimed matches to auto-open scorekeeper (use ref to avoid dependency issues)
  const previousClaimedMatchIdsRef = useRef<Set<number>>(new Set());
  
  // Get claimed match IDs for dependency tracking
  const claimedMatchIds = useMemo(() => {
    return Array.from(matchClaiming.claims.keys()).sort();
  }, [matchClaiming.claims]);
  
  // Auto-open scorekeeper when a match is newly claimed
  useEffect(() => {
    if (!userRole.isSpectator) return;
    
    // Find currently claimed matches
    const currentClaimed = new Set<number>();
    matches.forEach(match => {
      if (matchClaiming.isClaimOwner(match.MatchId)) {
        currentClaimed.add(match.MatchId);
        
        // If this is a newly claimed match and scorekeeper isn't open, open it
        if (!previousClaimedMatchIdsRef.current.has(match.MatchId) && 
            (!scorekeeperMatch || scorekeeperMatch.MatchId !== match.MatchId)) {
          setTimeout(() => {
            setScorekeeperMatch(match);
          }, 200);
        }
      }
    });
    
    // Update ref for next render
    previousClaimedMatchIdsRef.current = currentClaimed;
  }, [matches, claimedMatchIds, userRole.isSpectator, scorekeeperMatch, matchClaiming]);
  
  // Check for shareable scores in URL on mount
  useEffect(() => {
    if (hasShareableScoresInUrl()) {
      const urlData = extractScoresFromUrl();
      if (urlData && urlData.scores.length > 0) {
        const jsonData = JSON.stringify({ eventId: urlData.eventId, scores: urlData.scores }, null, 2);
        setImportJson(jsonData);
        setShowScoreImportDialog(true);
      }
    }
  }, [eventId]);

  // Handle score export
  const handleExportScores = () => {
    const jsonData = exportScoresToJSON(eventId);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scores-${eventId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowScoreExportMenu(false);
  };

  // Handle score share link
  const handleShareScoreLink = () => {
    const shareUrl = generateScoreShareUrl(eventId);
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Score link copied to clipboard! Share this link with others.');
      setShowScoreExportMenu(false);
    }).catch(() => {
      // Fallback: show URL in prompt
      prompt('Copy this link to share scores:', shareUrl);
    });
  };

  // Handle score import
  const handleImportScores = () => {
    try {
      setImportError(null);
      const result = importScoresFromJSON(importJson);
      
      if (result.success) {
        alert(`Successfully imported ${result.imported} score(s)!`);
        setShowScoreImportDialog(false);
        setImportJson('');
        // Reload scores by triggering a re-render
        window.location.reload();
      } else {
        setImportError(result.errors.join(', '));
      }
    } catch (error) {
      setImportError(`Failed to import scores: ${error}`);
    }
  };
  
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

  // Build coverage status map for suggestions
  const coverageStatusMap = useMemo(() => {
    const map = new Map<string, CoverageStatus>();
    matches.forEach(match => {
      const teamId = getTeamIdFromFilter(match);
      if (teamId) {
        map.set(teamId, coverageStatus.getTeamStatus(teamId));
      }
    });
    return map;
  }, [matches, coverageStatus, getTeamIdFromFilter]);

  // Generate coverage suggestions
  const coverageSuggestions = useMemo(() => {
    return generateCoverageSuggestions(
      matches,
      new Set(coveragePlan.selectedMatches),
      conflicts,
      coverageStatusMap,
      getTeamIdFromFilter,
      {
        excludeSelected: true,
        preferUncovered: true,
        preferNoConflicts: true,
        preferNearSelected: true,
        maxResults: 10,
      }
    );
  }, [matches, coveragePlan.selectedMatches, conflicts, coverageStatusMap, getTeamIdFromFilter]);

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

    // Apply "My Teams" filter for spectators
    if (userRole.isSpectator && followedTeams.followedTeams.length > 0) {
      const followedTeamIds = followedTeams.followedTeams.map(t => t.teamId);
      filtered = filtered.filter(m => {
        const teamId = getTeamIdFromFilter(m);
        return teamId && followedTeamIds.includes(teamId);
      });
    }
    
    return filtered;
  }, [matches, applyFilters, filters.priority, filters.coverageStatus, priority, coverageStatus, getTeamIdFromFilter, userRole.isSpectator, followedTeams.followedTeams]);

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

  // Calculate coverage statistics
  const coverageStats = useMemo(() => {
    const teamStatusMap = new Map<string, string>();
    matches.forEach(match => {
      const teamId = getTeamIdFromFilter(match);
      if (teamId) {
        const status = coverageStatus.getTeamStatus(teamId);
        teamStatusMap.set(teamId, status);
      }
    });
    
    const totalTeams = teamStatusMap.size;
    const coveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'covered').length;
    const partiallyCoveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'partially-covered').length;
    const plannedTeams = Array.from(teamStatusMap.values()).filter(s => s === 'planned').length;
    const uncoveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'not-covered').length;
    
    return {
      totalTeams,
      coveredTeams,
      partiallyCoveredTeams,
      plannedTeams,
      uncoveredTeams,
      coveragePercentage: totalTeams > 0 ? ((coveredTeams + partiallyCoveredTeams) / totalTeams) * 100 : 0,
    };
  }, [matches, coverageStatus, getTeamIdFromFilter]);

  // Get team identifier (use filter hook's version)
  const getTeamIdentifier = getTeamIdFromFilter;

  // Get opponent
  const getOpponent = (match: FilteredMatch): string => {
    if (match.InvolvedTeam === 'first') return match.SecondTeamText;
    if (match.InvolvedTeam === 'second') return match.FirstTeamText;
    return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
  };

  // Sort matches (including priority sorting)
  const sortedMatches = useMemo(() => {
    let sorted = [...filteredMatches];
    
    // Priority sorting first (if enabled)
    if (sortMode === 'priority') {
      sorted.sort((a, b) => {
        const priorityA = priority.getPriority(a.MatchId);
        const priorityB = priority.getPriority(b.MatchId);
        
        // Priority order: must-cover > priority > optional > null
        const priorityOrder: Record<string, number> = {
          'must-cover': 3,
          'priority': 2,
          'optional': 1,
          'null': 0,
        };
        
        const orderA = priorityOrder[priorityA || 'null'];
        const orderB = priorityOrder[priorityB || 'null'];
        
        if (orderA !== orderB) {
          return orderB - orderA; // Higher priority first
        }
        
        // If same priority, sort by time
        return a.ScheduledStartDateTime - b.ScheduledStartDateTime;
      });
    } else if (sortMode === 'team') {
      sorted.sort((a, b) => {
        const teamA = getTeamIdentifier(a);
        const teamB = getTeamIdentifier(b);
        return teamA.localeCompare(teamB);
      });
    } else if (sortMode === 'court') {
      sorted.sort((a, b) => {
        return a.CourtName.localeCompare(b.CourtName);
      });
    } else {
      // Sort by time
      sorted.sort((a, b) => {
        return a.ScheduledStartDateTime - b.ScheduledStartDateTime;
      });
    }
    
    return sorted;
  }, [filteredMatches, sortMode, priority, getTeamIdentifier]);

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

  // Check for upcoming matches and send notifications
  useEffect(() => {
    if (userRole.isSpectator && followedTeams.followedTeams.length > 0) {
      const followedTeamIds = followedTeams.followedTeams.map(t => t.teamId);
      const interval = setInterval(() => {
        notifications.checkUpcomingMatches(matches, followedTeamIds);
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [matches, followedTeams.followedTeams, userRole.isSpectator, notifications]);

  // Notify on score updates
  useEffect(() => {
    if (userRole.isSpectator && followedTeams.followedTeams.length > 0) {
      const followedTeamIds = followedTeams.followedTeams.map(t => t.teamId);
      matches.forEach(match => {
        const teamId = getTeamIdFromFilter(match);
        if (teamId && followedTeamIds.includes(teamId)) {
          const score = matchClaiming.getScore(match.MatchId);
          if (score && score.status === 'in-progress') {
            notifications.notifyScoreUpdate(match, score);
          }
        }
      });
    }
  }, [matches, matchClaiming, followedTeams.followedTeams, userRole.isSpectator, notifications, getTeamIdFromFilter]);

  if (filteredMatches.length === 0) {
    return (
      <div className="text-center py-12 text-[#9fa2ab] text-sm">
        {filters.division || filters.wave !== 'all' || filters.teams.length > 0 || filters.timeRange.start || filters.timeRange.end
          ? 'No matches found for selected filters'
          : 'No matches found'}
      </div>
    );
  }

  return (
    <div>
      {/* Live Match Dashboard - Spectator Only */}
      {userRole.isSpectator && (
        <LiveMatchDashboard
          matches={matches}
          eventId={eventId}
          userId={userRole.isSpectator ? 'spectator' : 'anonymous'}
          onMatchClick={(match) => setExpandedMatch(match.MatchId)}
        />
      )}

      {/* Coverage Statistics Header - Media Only */}
      {userRole.isMedia && coverageStats.totalTeams > 0 && (
        <div className="mb-4 px-4 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-xs text-[#9fa2ab]">
              <span className="font-semibold text-[#f8f8f9]">{coverageStats.coveragePercentage.toFixed(0)}%</span> Coverage
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400">✓ {coverageStats.coveredTeams}</span>
              <span className="text-[#9fa2ab]">/</span>
              <span className="text-[#f59e0b]">◐ {coverageStats.partiallyCoveredTeams}</span>
              <span className="text-[#9fa2ab]">/</span>
              <span className="text-[#eab308]">📋 {coverageStats.plannedTeams}</span>
              <span className="text-[#9fa2ab]">/</span>
              <span className="text-[#808593]">○ {coverageStats.uncoveredTeams}</span>
            </div>
          </div>
          
          {/* Coverage Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scanning Mode Toggle */}
            <button
              onClick={() => setScanningMode(!scanningMode)}
              className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                scanningMode
                  ? 'bg-[#eab308] text-[#18181b]'
                  : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]'
              }`}
              title="Dim covered teams to focus on uncovered"
            >
              {scanningMode ? '👁️ Scanning' : 'Scanning Mode'}
            </button>
            
            {/* Suggestions Button */}
            {coverageSuggestions.length > 0 && (
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                  showSuggestions
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]'
                }`}
                title={`${coverageSuggestions.length} coverage suggestions`}
              >
                💡 Suggestions ({coverageSuggestions.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Coverage Suggestions Panel - Media Only */}
      {userRole.isMedia && showSuggestions && coverageSuggestions.length > 0 && (
        <div className="mb-4 rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#f8f8f9]">Coverage Suggestions</h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
              aria-label="Close suggestions"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {coverageSuggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.match.MatchId}
                className="flex items-center justify-between px-3 py-2 rounded bg-[#454654] border border-[#525463] hover:border-[#eab308]/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#f8f8f9] truncate">
                    {formatMatchTime(suggestion.match.ScheduledStartDateTime)} - {suggestion.match.CourtName} - Team {suggestion.teamId}
                  </div>
                  <div className="text-[10px] text-[#9fa2ab] mt-0.5">{suggestion.reason}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    coveragePlan.selectMatch(suggestion.match.MatchId);
                  }}
                  className="ml-3 px-3 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors flex-shrink-0"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage Legend - Media Only */}
      {userRole.isMedia && (
        <div className="mb-4 px-3 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] text-xs">
          <div className="font-medium text-[#9fa2ab] uppercase tracking-wider mb-2">Coverage Status Legend</div>
          <div className="flex flex-wrap gap-4 text-[#c0c2c8]">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-[#eab308] bg-[#eab308]/5"></div>
              <span>Uncovered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-[#eab308]/50 bg-[#eab308]/10"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-green-500/30 bg-green-950/5"></div>
              <span>Covered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-red-800/50 bg-red-950/10"></div>
              <span>Conflict</span>
            </div>
          </div>
        </div>
      )}

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

            {/* My Teams Selector - Spectator Only */}
            {userRole.isSpectator && (
              <div className="flex items-center gap-2">
                <MyTeamsSelector
                  matches={matches}
                />
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

      {/* Matches List - ALWAYS Grouped by Start Time for Conflict Visibility */}
      <div className="space-y-4">
        {startTimes.length === 0 ? (
          <div className="text-center py-12 text-[#9fa2ab] text-sm">
            {filters.wave !== 'all' || filters.division || filters.teams.length > 0 || filters.timeRange.start || filters.timeRange.end || (filters.priority && filters.priority !== 'all') || (filters.coverageStatus && filters.coverageStatus !== 'all')
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
                  const matchPriority = priority.getPriority(match.MatchId);
                  const isOpportunity = opportunityMatchIds.has(match.MatchId);
                  const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered';
                  const isCovered = teamCoverageStatus === 'covered' || teamCoverageStatus === 'partially-covered';
                  const isPlanned = teamCoverageStatus === 'planned';
                  const isUncovered = teamCoverageStatus === 'not-covered';
                  const shouldDim = scanningMode && isCovered;
                  
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
                            : matchPriority === 'must-cover'
                            ? 'border-2 border-[#eab308] bg-[#eab308]/10'
                            : matchPriority === 'priority'
                            ? 'border border-[#f59e0b] bg-[#f59e0b]/10'
                            : isUncovered && !coveragePlan.isSelected(match.MatchId)
                            ? 'border border-[#eab308] bg-[#eab308]/5'
                            : isPlanned
                            ? 'border border-[#eab308]/50 bg-[#eab308]/10'
                            : isCovered
                            ? 'border border-green-500/30 bg-green-950/5'
                            : isOpportunity && !coveragePlan.isSelected(match.MatchId)
                            ? 'border border-green-500/50 bg-green-950/10'
                            : coveragePlan.isSelected(match.MatchId)
                            ? 'border border-[#eab308]/50 bg-[#eab308]/10'
                            : 'border border-[#454654] bg-[#3b3c48]'
                        } ${shouldDim ? 'opacity-30' : ''} hover:border-[#525463] hover:bg-[#3b3c48]/80`}
                      >
                        {/* Selection Checkbox - Media Only */}
                        {userRole.isMedia && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              coveragePlan.toggleMatch(match.MatchId);
                            }}
                            className={`absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 flex-shrink-0 w-5 h-5 rounded border-2 ${
                              coveragePlan.isSelected(match.MatchId)
                                ? 'border-[#eab308] bg-[#eab308]/20'
                                : 'border-[#525463] bg-transparent'
                            } flex items-center justify-center hover:bg-[#454654] transition-colors`}
                            aria-label={coveragePlan.isSelected(match.MatchId) ? 'Remove from plan' : 'Add to plan'}
                          >
                            {coveragePlan.isSelected(match.MatchId) && (
                              <svg className="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        {/* Priority Button - Media Only */}
                        {userRole.isMedia && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPriorityMenuOpen(priorityMenuOpen === match.MatchId ? null : match.MatchId);
                              }}
                              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-[#454654] ${
                                matchPriority === 'must-cover'
                                  ? 'text-[#eab308]'
                                  : matchPriority === 'priority'
                                  ? 'text-[#f59e0b]'
                                  : matchPriority === 'optional'
                                  ? 'text-[#9fa2ab]'
                                  : 'text-[#808593]'
                              }`}
                              aria-label="Set priority"
                              title={matchPriority ? `Priority: ${matchPriority}` : 'Set priority'}
                            >
                              {matchPriority === 'must-cover' && '⭐'}
                              {matchPriority === 'priority' && '🔸'}
                              {matchPriority === 'optional' && '○'}
                              {!matchPriority && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              )}
                            </button>
                            {priorityMenuOpen === match.MatchId && (
                              <div className="absolute left-0 top-8 z-50">
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
                              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-[#454654] ${
                                teamCoverageStatus === 'covered'
                                  ? 'text-green-500'
                                  : teamCoverageStatus === 'partially-covered'
                                  ? 'text-[#f59e0b]'
                                  : teamCoverageStatus === 'planned'
                                  ? 'text-[#eab308]'
                                  : 'text-[#808593]'
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
                              <div className="absolute left-0 top-8 z-50">
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
                        
                        {/* Opportunity Badge - Media Only */}
                        {userRole.isMedia && isOpportunity && !coveragePlan.isSelected(match.MatchId) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#3b3c48]" title="Easy coverage opportunity" />
                        )}
                        
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
                          <div className="flex items-center gap-2">
                            {/* Team Color Indicator - Spectator Only */}
                            {userRole.isSpectator && teamId && followedTeams.getTeamColor(teamId) && (
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: followedTeams.getTeamColor(teamId) || undefined }}
                                title={`${teamId} (followed)`}
                              />
                            )}
                            <div>
                              <div className="text-sm sm:text-base font-bold text-[#f8f8f9]">
                                {teamId || match.Division.CodeAlias}
                              </div>
                              <div className="text-[10px] text-[#9fa2ab]">
                                {match.Division.CodeAlias}
                              </div>
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

                        {/* Follow Team Button - Spectator Only */}
                        {userRole.isSpectator && teamId && (
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (followedTeams.isFollowing(teamId)) {
                                  followedTeams.unfollowTeam(teamId);
                                } else {
                                  followedTeams.followTeam(teamId, teamId);
                                }
                              }}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                followedTeams.isFollowing(teamId)
                                  ? 'bg-[#eab308] text-[#18181b]'
                                  : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]'
                              }`}
                              title={followedTeams.isFollowing(teamId) ? 'Unfollow team' : 'Follow team'}
                            >
                              {followedTeams.isFollowing(teamId) ? '✓' : '+'}
                            </button>
                          </div>
                        )}

                        {/* Match Claim Button & Score Controls - Spectator Only */}
                        {userRole.isSpectator && (
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {/* Claim Button */}
                            <MatchClaimButton
                              match={match}
                              matchClaiming={matchClaiming}
                              onClaim={(matchId) => {
                                // Find the match that was claimed
                                const claimedMatch = matches.find(m => m.MatchId === matchId);
                                if (claimedMatch) {
                                  // Auto-open scorekeeper after claim state updates
                                  setTimeout(() => {
                                    setScorekeeperMatch(claimedMatch);
                                  }, 300);
                                }
                              }}
                              onRelease={() => {
                                setScorekeeperMatch(null);
                              }}
                            />
                            
                            {/* Claim History Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowClaimHistory(true);
                                setClaimHistoryMatchId(match.MatchId);
                              }}
                              className="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]"
                              title="View claim history for this match"
                            >
                              📜
                            </button>
                            
                            {/* Start Scoring Button - Show if claimed by current user */}
                            {matchClaiming.getClaimStatus(match.MatchId) === 'claimed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScorekeeperMatch(match);
                                }}
                                className="px-2 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors border border-[#eab308]"
                                title="Start keeping score for this match"
                              >
                                {matchClaiming.getScore(match.MatchId) ? 'Update Score' : 'Start Scoring'}
                              </button>
                            )}
                            
                            {/* Score Display - Show if match has score */}
                            {(() => {
                              const score = matchClaiming.getScore(match.MatchId);
                              if (score && score.status !== 'not-started') {
                                const currentSet = score.sets.find((s: SetScore) => s.completedAt === 0) || score.sets[score.sets.length - 1];
                                const completedSets = score.sets.filter((s: SetScore) => s.completedAt > 0);
                                const team1Wins = completedSets.filter((s: SetScore) => s.team1Score > s.team2Score).length;
                                const team2Wins = completedSets.filter((s: SetScore) => s.team2Score > s.team1Score).length;
                                
                                return (
                                  <div className="flex-shrink-0 flex items-center gap-2">
                                    {completedSets.length > 0 && (
                                      <div className="text-xs font-medium text-[#9fa2ab]">
                                        {team1Wins}-{team2Wins}
                                      </div>
                                    )}
                                    <div className="text-xs font-semibold text-[#f8f8f9]">
                                      {currentSet.team1Score}-{currentSet.team2Score}
                                    </div>
                                    <LiveScoreIndicator
                                      isLive={score.status === 'in-progress'}
                                      lastUpdated={score.lastUpdated}
                                    />
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                        
                        {/* Score Display for Non-Claimers - Show if someone else is scoring */}
                        {userRole.isSpectator && 
                         !matchClaiming.isClaimOwner(match.MatchId) && 
                         matchClaiming.getScore(match.MatchId) && (() => {
                          const score = matchClaiming.getScore(match.MatchId);
                          if (score && score.status !== 'not-started') {
                            const currentSet = score.sets.find((s: SetScore) => s.completedAt === 0) || score.sets[score.sets.length - 1];
                            const completedSets = score.sets.filter((s: SetScore) => s.completedAt > 0);
                            const team1Wins = completedSets.filter((s: SetScore) => s.team1Score > s.team2Score).length;
                            const team2Wins = completedSets.filter((s: SetScore) => s.team2Score > s.team1Score).length;
                            
                            return (
                              <div className="flex-shrink-0 flex items-center gap-2">
                                {completedSets.length > 0 && (
                                  <div className="text-xs font-medium text-[#9fa2ab]">
                                    {team1Wins}-{team2Wins}
                                  </div>
                                )}
                                <div className="text-xs font-semibold text-[#f8f8f9]">
                                  {currentSet.team1Score}-{currentSet.team2Score}
                                </div>
                                <LiveScoreIndicator
                                  isLive={score.status === 'in-progress'}
                                  lastUpdated={score.lastUpdated}
                                />
                                <span className="text-[8px] text-[#9fa2ab]">
                                  (Live)
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}

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

                      {/* Expanded Team Detail Panel - Render inline */}
                      {isExpanded && (
                        <TeamDetailPanel
                          match={match}
                          eventId={eventId}
                          clubId={clubId}
                          matches={matches}
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
      
      {/* Scorekeeper Modal */}
      {scorekeeperMatch && (
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

      {/* Score Export/Import UI - Spectator Only */}
      {userRole.isSpectator && (
        <>
          {/* Score Actions Button */}
          <div className="fixed bottom-4 right-4 z-50">
            <div className="relative">
              <button
                onClick={() => setShowScoreExportMenu(!showScoreExportMenu)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors shadow-lg flex items-center gap-2"
                title="Score sharing & sync options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Scores
              </button>
              
              {showScoreExportMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-[#454654] bg-[#3b3c48] shadow-lg p-2">
                  <div className="px-3 py-2 text-xs text-[#9fa2ab] border-b border-[#454654] mb-2">
                    Score Sharing
                  </div>
                  <button
                    onClick={handleExportScores}
                    className="w-full px-3 py-2 text-sm text-left text-[#c0c2c8] hover:bg-[#454654] rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Scores (JSON)
                  </button>
                  <button
                    onClick={handleShareScoreLink}
                    className="w-full px-3 py-2 text-sm text-left text-[#c0c2c8] hover:bg-[#454654] rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Generate Share Link
                  </button>
                  <div className="border-t border-[#454654] my-2"></div>
                  <div className="px-3 py-2 text-xs text-[#9fa2ab] border-b border-[#454654] mb-2">
                    Receive Scores
                  </div>
                  <button
                    onClick={() => {
                      setShowScoreImportDialog(true);
                      setShowScoreExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-[#c0c2c8] hover:bg-[#454654] rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import Scores from JSON
                  </button>
                  <div className="px-3 py-1.5 mt-2 text-[10px] text-[#808593] bg-[#454654]/30 rounded">
                    💡 Scores sync automatically across tabs. To share with others, use Export or Share Link.
                  </div>
                  <div className="border-t border-[#454654] my-2"></div>
                  <div className="px-3 py-2 text-xs text-[#9fa2ab] border-b border-[#454654] mb-2">
                    Claim History
                  </div>
                  <button
                    onClick={() => {
                      setShowClaimHistory(true);
                      setClaimHistoryMatchId(undefined);
                      setShowScoreExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-[#c0c2c8] hover:bg-[#454654] rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View All Claim History
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Score Import Dialog */}
          {showScoreImportDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-[#3b3c48] rounded-lg border border-[#454654] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#f8f8f9]">Import Scores</h3>
                  <button
                    onClick={() => {
                      setShowScoreImportDialog(false);
                      setImportJson('');
                      setImportError(null);
                    }}
                    className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-[#454654]/50 rounded border border-[#525463]">
                  <div className="text-sm text-[#c0c2c8] mb-2">
                    <strong className="text-[#facc15]">How to receive scores:</strong>
                  </div>
                  <ol className="text-xs text-[#9fa2ab] space-y-1 ml-4 list-decimal">
                    <li>Ask the scorekeeper to click "Scores" button → "Generate Share Link"</li>
                    <li>They copy the link and send it to you</li>
                    <li>Open the link in your browser, or paste JSON data below</li>
                    <li>Scores will sync automatically across tabs if you're both viewing the same event</li>
                  </ol>
                </div>
                
                <textarea
                  value={importJson}
                  onChange={(e) => {
                    setImportJson(e.target.value);
                    setImportError(null);
                  }}
                  placeholder="Paste JSON score data here, or paste a share link URL..."
                  className="w-full h-48 px-3 py-2 bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] font-mono text-xs focus:border-[#eab308] focus:outline-none"
                />
                
                {importError && (
                  <div className="mt-2 p-2 text-sm text-red-400 bg-red-950/20 border border-red-500/30 rounded">
                    {importError}
                  </div>
                )}
                
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleImportScores}
                    className="px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
                  >
                    Import Scores
                  </button>
                  <button
                    onClick={() => {
                      setShowScoreImportDialog(false);
                      setImportJson('');
                      setImportError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Claim History Panel */}
      {showClaimHistory && (
        <ClaimHistoryPanel
          matchId={claimHistoryMatchId}
          eventId={eventId}
          matches={matches}
          onClose={() => {
            setShowClaimHistory(false);
            setClaimHistoryMatchId(undefined);
          }}
        />
      )}
      
      {/* Close priority menu when clicking outside */}
      {priorityMenuOpen !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setPriorityMenuOpen(null)}
        />
      )}
    </div>
  );
};
