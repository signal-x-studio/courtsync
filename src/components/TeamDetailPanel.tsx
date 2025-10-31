import { useState, useEffect, useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime, formatMatchDate } from '../utils/dateUtils';
import {
  fetchTeamAssignments,
  fetchTeamSchedule,
  fetchDivisionPlays,
  fetchPoolSheet,
} from '../services/api';

interface TeamDetailPanelProps {
  match: FilteredMatch;
  eventId: string;
  clubId: number;
  onClose: () => void;
}

interface TeamInfo {
  TeamId: number;
  DivisionId: number;
  TeamName: string;
  TeamText: string;
}

interface ScheduleMatch {
  MatchId: number;
  ScheduledStartDateTime: string | number;
  ScheduledEndDateTime: string | number;
  FirstTeamText: string;
  SecondTeamText?: string;
  WorkTeamText?: string;
  Court?: {
    Name: string;
    CourtId: number;
  } | null;
  Division?: {
    CodeAlias: string;
    ColorHex: string;
    CompleteShortName?: string;
    FullName?: string;
    PlayId?: number;
  } | null;
}

export const TeamDetailPanel = ({
  match,
  eventId,
  clubId,
  onClose,
}: TeamDetailPanelProps) => {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleMatch[]>([]);
  const [workSchedule, setWorkSchedule] = useState<ScheduleMatch[]>([]);
  const [futureSchedule, setFutureSchedule] = useState<ScheduleMatch[]>([]);
  const [divisionPlays, setDivisionPlays] = useState<any[]>([]);
  const [selectedPlayId, setSelectedPlayId] = useState<number | null>(null);
  const [poolSheet, setPoolSheet] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'schedule' | 'poolsheet'>('schedule');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset selectedPlayId and poolSheet when view mode changes to poolsheet
  useEffect(() => {
    if (viewMode === 'poolsheet') {
      setPoolSheet(null); // Clear previous pool sheet data
      // selectedPlayId will be auto-set by the relevantPools useEffect
    }
  }, [viewMode]);

  // Extract team name from match
  const getTeamName = (): string => {
    if (match.InvolvedTeam === 'first') {
      return match.FirstTeamText;
    } else if (match.InvolvedTeam === 'second') {
      return match.SecondTeamText;
    }
    return '';
  };

  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, fetch team assignments to get TeamId and DivisionId
        const assignmentsResponse = await fetchTeamAssignments(eventId, clubId);
        const assignments = assignmentsResponse.value || [];

        // Find matching team by name
        const teamName = getTeamName();
        if (!teamName) {
          setError('Could not extract team name from match');
          setLoading(false);
          return;
        }

        // Try multiple matching strategies
        const team = assignments.find((t: any) => {
          // Exact match on TeamText
          if (t.TeamText === teamName) return true;
          // Match on TeamName
          if (t.TeamName === teamName) return true;
          // Partial match - extract team number (e.g., "16-1" from "630 Volleyball 16-1 (GL)")
          const teamNumberMatch = teamName.match(/(\d+-\d+)/);
          if (teamNumberMatch) {
            const teamNumber = teamNumberMatch[1];
            return t.TeamName.includes(teamNumber) || t.TeamText.includes(teamNumber);
          }
          return false;
        });

        if (!team) {
          setError(`Team not found: ${teamName}`);
          setLoading(false);
          return;
        }

        const teamId = team.TeamId;
        const divisionId = team.TeamDivision.DivisionId;

        setTeamInfo({
          TeamId: teamId,
          DivisionId: divisionId,
          TeamName: team.TeamName,
          TeamText: team.TeamText,
        });

        // Fetch all team schedules
        const [current, work, future] = await Promise.all([
          fetchTeamSchedule(eventId, divisionId, teamId, 'current').catch(() => []),
          fetchTeamSchedule(eventId, divisionId, teamId, 'work').catch(() => []),
          fetchTeamSchedule(eventId, divisionId, teamId, 'future').catch(() => []),
        ]);

        // Flatten the response - API returns array of Play objects
        // For current/future: each Play has Matches array
        // For work: each Play has a single Match object
        const flattenMatches = (response: any[], isWorkSchedule: boolean = false): ScheduleMatch[] => {
          if (!Array.isArray(response)) return [];
          return response.flatMap((play: any) => {
            if (isWorkSchedule) {
              // Work schedule has single Match object
              if (!play.Match) return [];
              return [{
                ...play.Match,
                Court: play.Match.Court || null,
                Division: {
                  ...play.Play,
                  PlayId: play.Play?.PlayId,
                } as any,
                // Work assignments don't have team info, so we'll use the Play name
                FirstTeamText: play.Play?.CompleteShortName || 'Work Assignment',
                SecondTeamText: undefined,
              }];
            } else {
              // Current/future schedules have Matches array
              if (!play.Matches || !Array.isArray(play.Matches)) return [];
              return play.Matches.map((match: any) => ({
                ...match,
                // Use the match's own Court property, not the Play's first court
                Court: match.Court || null,
                Division: {
                  ...play.Play,
                  PlayId: play.Play?.PlayId,
                } as any,
              }));
            }
          });
        };

        setCurrentSchedule(flattenMatches(current, false));
        setWorkSchedule(flattenMatches(work, true));
        setFutureSchedule(flattenMatches(future, false));

        // Fetch division plays to get pool information
        const playsData = await fetchDivisionPlays(eventId, divisionId).catch(() => null);
        if (playsData?.Plays) {
          setDivisionPlays(playsData.Plays);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.MatchId, eventId, clubId]);

  // Fetch pool sheet when play is selected
  useEffect(() => {
    if (selectedPlayId && viewMode === 'poolsheet') {
      // PlayIds from AES API are negative, fetchPoolSheet handles this
      fetchPoolSheet(eventId, selectedPlayId)
        .then(setPoolSheet)
        .catch((err) => {
          console.error('Failed to fetch pool sheet:', err);
          setPoolSheet(null);
        });
    }
  }, [selectedPlayId, viewMode, eventId]);

  const renderMatch = (scheduleMatch: ScheduleMatch, isWork: boolean = false) => {
    // Handle different date formats
    const startTime = typeof scheduleMatch.ScheduledStartDateTime === 'string'
      ? new Date(scheduleMatch.ScheduledStartDateTime).getTime()
      : scheduleMatch.ScheduledStartDateTime;
    
    const isPlaying = scheduleMatch.FirstTeamText?.includes('630') || scheduleMatch.SecondTeamText?.includes('630');
    const matchDate = formatMatchDate(startTime);
    const startTimeDisplay = formatMatchTime(startTime);
    
    return (
      <div
        key={scheduleMatch.MatchId}
        className={`flex items-center gap-3 px-3 py-2 rounded border ${
          isWork
            ? 'border-[#525463] bg-[#454654]/30' // Subtle background for work
            : isPlaying
            ? 'border-[#eab308]/50 bg-[#eab308]/5' // Gold tint for playing
            : 'border-[#454654] bg-[#3b3c48]/30'
        }`}
      >
        {/* Status Indicator - Left border for quick scan */}
        <div className={`flex-shrink-0 w-1 h-full rounded-full ${
          isWork
            ? 'bg-[#808593]' // Gray for work
            : isPlaying
            ? 'bg-[#eab308]' // Gold for playing
            : 'bg-[#525463]' // Neutral for watching
        }`} />

        {/* Date */}
        <div className="flex-shrink-0 w-16 text-xs font-medium text-[#9fa2ab]">
          {matchDate}
        </div>

        {/* Scheduled Start Time - PRIMARY */}
        <div className="flex-shrink-0 w-20 text-sm font-semibold text-[#f8f8f9]">
          {startTimeDisplay}
        </div>

        {/* Court */}
        {scheduleMatch.Court && (
          <div className="flex-shrink-0 w-20 text-xs text-[#facc15] font-medium">
            {scheduleMatch.Court.Name}
          </div>
        )}

        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs">
            {isWork ? (
              <>
                <span className="text-[#808593] font-medium">WORK</span>
                <span className="text-[#808593] ml-2">
                  {scheduleMatch.Division?.CompleteShortName || scheduleMatch.Division?.FullName || scheduleMatch.FirstTeamText}
                </span>
              </>
            ) : isPlaying ? (
              <>
                <span className="text-[#eab308] font-semibold">PLAY</span>
                <span className="text-[#c0c2c8] ml-2">
                  {scheduleMatch.FirstTeamText}
                  {scheduleMatch.SecondTeamText && (
                    <>
                      <span className="text-[#808593] mx-1">vs</span>
                      {scheduleMatch.SecondTeamText}
                    </>
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="text-[#808593] font-medium">WATCH</span>
                <span className="text-[#808593] ml-2">
                  {scheduleMatch.FirstTeamText}
                  {scheduleMatch.SecondTeamText && (
                    <>
                      <span className="mx-1">vs</span>
                      {scheduleMatch.SecondTeamText}
                    </>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Division Badge */}
        {scheduleMatch.Division && (
          <div className="flex-shrink-0">
            <span
              className="px-2 py-0.5 text-[10px] font-semibold rounded"
              style={{
                backgroundColor: scheduleMatch.Division.ColorHex + '20',
                color: scheduleMatch.Division.ColorHex,
                border: `1px solid ${scheduleMatch.Division.ColorHex}40`,
              }}
            >
              {scheduleMatch.Division.CodeAlias}
            </span>
          </div>
        )}
      </div>
    );
  };

  const allMatches = useMemo(() => {
    const matches = [
      ...currentSchedule.map(m => ({ ...m, type: 'current' as const })),
      ...workSchedule.map(m => ({ ...m, type: 'work' as const })),
      ...futureSchedule.map(m => ({ ...m, type: 'future' as const })),
    ].filter((match, index, array) => {
      // Deduplicate by MatchId - same match might appear in multiple schedules
      return array.findIndex(m => m.MatchId === match.MatchId) === index;
    }).sort((a, b) => {
      const timeA = typeof a.ScheduledStartDateTime === 'string'
        ? new Date(a.ScheduledStartDateTime).getTime()
        : a.ScheduledStartDateTime || 0;
      const timeB = typeof b.ScheduledStartDateTime === 'string'
        ? new Date(b.ScheduledStartDateTime).getTime()
        : b.ScheduledStartDateTime || 0;
      return timeA - timeB;
    });
    return matches;
  }, [currentSchedule, workSchedule, futureSchedule]);

  // Extract pools that this team is actually in from their schedule
  const teamPools = useMemo(() => {
    const poolSet = new Set<number>();
    allMatches.forEach(match => {
      // Each match has a Division/Play object with PlayId
      // PlayIds from AES API are negative, so we use Math.abs to normalize
      if (match.Division && match.Division.PlayId) {
        const playId = Math.abs(match.Division.PlayId);
        poolSet.add(playId);
      }
    });
    return Array.from(poolSet);
  }, [allMatches]);

  // Filter division plays to only show pools this team is in
  const relevantPools = useMemo(() => {
    return divisionPlays.filter((play: any) => {
      // Compare using absolute values since API returns negative PlayIds
      const normalizedPlayId = Math.abs(play.PlayId);
      return teamPools.includes(normalizedPlayId);
    });
  }, [divisionPlays, teamPools]);

  // Auto-select the team's pool
  useEffect(() => {
    if (relevantPools.length > 0 && !selectedPlayId) {
      // Use first pool from relevant pools, store as negative to match API format
      setSelectedPlayId(relevantPools[0].PlayId);
    }
  }, [relevantPools, selectedPlayId]);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, typeof allMatches> = {};
    allMatches.forEach(match => {
      const startTime = typeof match.ScheduledStartDateTime === 'string'
        ? new Date(match.ScheduledStartDateTime).getTime()
        : match.ScheduledStartDateTime || 0;
      const dateKey = formatMatchDate(startTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  }, [allMatches]);

  // Sort dates chronologically
  const sortedDates = useMemo(() => {
    return Object.keys(matchesByDate).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      return dateA - dateB;
    });
  }, [matchesByDate]);

  return (
    <div className="mt-2 border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-semibold text-[#f8f8f9] truncate pr-2">
            {teamInfo?.TeamText || getTeamName()} - Full Schedule
          </h4>
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

        {loading && (
          <div className="text-center py-8 text-[#9fa2ab] text-sm">
            Loading schedule...
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && teamInfo && (
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border-b border-[#454654] pb-2">
              <button
                onClick={() => setViewMode('schedule')}
                className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                  viewMode === 'schedule'
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setViewMode('poolsheet')}
                className={`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                  viewMode === 'poolsheet'
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
                }`}
              >
                Pool Sheet
              </button>
            </div>

            {viewMode === 'schedule' ? (
              /* Full Schedule Timeline */
              <div>
                <h5 className="text-xs font-semibold text-[#9fa2ab] uppercase tracking-wider mb-2">
                  Complete Schedule
                </h5>
                <div className="space-y-4">
                  {sortedDates.length === 0 ? (
                    <div className="text-xs text-[#808593] py-4 text-center">
                      No schedule data available
                    </div>
                  ) : (
                    sortedDates.map((dateKey) => {
                      const dateMatches = matchesByDate[dateKey];
                      return (
                        <div key={dateKey} className="space-y-1">
                          {/* Date Header */}
                          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-[#454654]">
                            <h6 className="text-xs font-semibold text-[#f8f8f9]">{dateKey}</h6>
                            <span className="text-[10px] text-[#808593]">
                              ({dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''})
                            </span>
                          </div>
                          {/* Matches for this date */}
                          {dateMatches.map((scheduleMatch) =>
                            renderMatch(scheduleMatch, scheduleMatch.type === 'work')
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Pool Sheet View */
              <div>
                <h5 className="text-xs font-semibold text-[#9fa2ab] uppercase tracking-wider mb-2">
                  Pool Standings
                </h5>
                
                {relevantPools.length === 0 ? (
                  <div className="text-xs text-[#808593] py-4 text-center">
                    No pool data available for this team
                  </div>
                ) : (
                  <>
                    {/* Pool Selector - Show if team is in multiple pools */}
                    {relevantPools.length > 1 && (
                      <div className="mb-4">
                        <label className="text-xs text-[#9fa2ab] mb-1 block">Pool:</label>
                        <select
                          value={selectedPlayId || ''}
                          onChange={(e) => setSelectedPlayId(Number(e.target.value))}
                          className="w-full px-3 py-2.5 sm:py-2 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
                        >
                          {relevantPools.map((play: any) => (
                            <option key={play.PlayId} value={play.PlayId}>
                              {play.CompleteFullName || play.FullName || `Pool ${play.PlayId}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedPlayId ? (
                      <>
                        {poolSheet ? (
                          <div className="space-y-4">
                            {/* Pool Standings */}
                            {poolSheet.Pool && poolSheet.Pool.Teams && poolSheet.Pool.Teams.length > 0 && (
                              <div className="border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
                                <div className="px-3 sm:px-4 py-2 bg-[#454654] border-b border-[#525463]">
                                  <h6 className="text-xs sm:text-sm font-semibold text-[#f8f8f9]">
                                    {poolSheet.Pool.CompleteFullName || poolSheet.Pool.FullName} - Standings
                                  </h6>
                                </div>
                                
                                {/* Standings Table - Horizontal scroll on mobile */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[#454654] bg-[#454654]/50">
                                        <th className="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Rank</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Team</th>
                                        <th className="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">W</th>
                                        <th className="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">L</th>
                                        <th className="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">Sets</th>
                                        <th className="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">Points</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {poolSheet.Pool.Teams.map((team: any) => {
                                        const isOurTeam = team.TeamText?.includes('630');
                                        return (
                                          <tr
                                            key={team.TeamId}
                                            className={`border-b border-[#454654] ${
                                              isOurTeam ? 'bg-[#eab308]/10' : ''
                                            }`}
                                          >
                                            <td className="px-2 sm:px-3 py-2 text-[#f8f8f9] font-medium">
                                              {team.FinishRank || team.OverallRank || '-'}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2">
                                              <div className={`${isOurTeam ? 'text-[#facc15] font-semibold' : 'text-[#c0c2c8]'}`}>
                                                {team.TeamText}
                                              </div>
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
                                              {team.MatchesWon ?? '-'}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
                                              {team.MatchesLost ?? '-'}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
                                              {team.SetsWon ?? '-'}-{team.SetsLost ?? '-'}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
                                              {team.PointRatio && team.PointRatio !== 'NaN' ? team.PointRatio : '-'}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Pool Matches Schedule */}
                            {poolSheet.Matches && poolSheet.Matches.length > 0 && (
                              <div className="border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
                                <div className="px-3 sm:px-4 py-2 bg-[#454654] border-b border-[#525463]">
                                  <h6 className="text-xs sm:text-sm font-semibold text-[#f8f8f9]">
                                    Pool Matches ({poolSheet.Pool?.MatchDescription || 'All matches in pool'})
                                  </h6>
                                </div>
                                
                                <div className="space-y-1 overflow-x-auto">
                                  {poolSheet.Matches.map((poolMatch: any, index: number) => {
                                    const startTime = new Date(poolMatch.ScheduledStartDateTime).getTime();
                                    const isOurTeam = poolMatch.FirstTeamText?.includes('630') || poolMatch.SecondTeamText?.includes('630');
                                    const isWorkTeam = poolMatch.WorkTeamText?.includes('630');
                                    
                                    return (
                                      <div
                                        key={poolMatch.MatchId || index}
                                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-2 border-b border-[#454654] last:border-b-0 min-h-[44px] sm:min-h-0 ${
                                          isOurTeam ? 'bg-[#eab308]/5' : ''
                                        }`}
                                      >
                                        {/* Status Indicator */}
                                        <div className={`flex-shrink-0 w-full sm:w-1 h-1 sm:h-full rounded-full sm:rounded-none ${
                                          isOurTeam
                                            ? 'bg-[#eab308]'
                                            : isWorkTeam
                                            ? 'bg-[#808593]'
                                            : 'bg-[#525463]'
                                        }`} />

                                        {/* Mobile: Stack time and court */}
                                        <div className="flex items-center gap-2 sm:contents">
                                          {/* Time */}
                                          <div className="flex-shrink-0 w-auto sm:w-20 text-xs font-semibold text-[#f8f8f9]">
                                            {formatMatchTime(startTime)}
                                          </div>

                                          {/* Court */}
                                          {poolMatch.Court && (
                                            <div className="flex-shrink-0 w-auto sm:w-20 text-xs text-[#facc15] font-medium">
                                              {poolMatch.Court.Name}
                                            </div>
                                          )}
                                        </div>

                                        {/* Match Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs">
                                            {isOurTeam ? (
                                              <>
                                                <span className="text-[#eab308] font-semibold">PLAY</span>
                                                <span className="text-[#c0c2c8] ml-2">
                                                  {poolMatch.FirstTeamText}
                                                  {poolMatch.SecondTeamText && (
                                                    <>
                                                      <span className="text-[#808593] mx-1">vs</span>
                                                      {poolMatch.SecondTeamText}
                                                    </>
                                                  )}
                                                </span>
                                              </>
                                            ) : isWorkTeam ? (
                                              <>
                                                <span className="text-[#808593] font-medium">WORK</span>
                                                <span className="text-[#808593] ml-2">
                                                  {poolMatch.FirstTeamText}
                                                  {poolMatch.SecondTeamText && (
                                                    <>
                                                      <span className="mx-1">vs</span>
                                                      {poolMatch.SecondTeamText}
                                                    </>
                                                  )}
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <span className="text-[#808593] font-medium">WATCH</span>
                                                <span className="text-[#808593] ml-2">
                                                  {poolMatch.FirstTeamText}
                                                  {poolMatch.SecondTeamText && (
                                                    <>
                                                      <span className="mx-1">vs</span>
                                                      {poolMatch.SecondTeamText}
                                                    </>
                                                  )}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          
                                          {/* Work Team */}
                                          {poolMatch.WorkTeamText && (
                                            <div className="text-[10px] text-[#808593] mt-0.5">
                                              Work: {poolMatch.WorkTeamText}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Future Matches Based on Ranking */}
                            {poolSheet.FutureRoundMatches && poolSheet.FutureRoundMatches.length > 0 && (
                              <div className="border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
                                <div className="px-3 sm:px-4 py-2 bg-[#454654] border-b border-[#525463]">
                                  <h6 className="text-xs sm:text-sm font-semibold text-[#f8f8f9]">
                                    Future Matches
                                  </h6>
                                  <p className="text-[10px] text-[#9fa2ab] mt-0.5">
                                    Based on final pool ranking
                                  </p>
                                </div>
                                
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs min-w-[400px]">
                                    <thead>
                                      <tr className="border-b border-[#454654] bg-[#454654]/50">
                                        <th className="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Rank</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Next Match</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Work Assignment</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {poolSheet.FutureRoundMatches.map((futureMatch: any, index: number) => {
                                        const hasMatch = futureMatch.Match;
                                        const hasWorkMatch = futureMatch.WorkMatch;
                                        const matchTime = hasMatch ? new Date(futureMatch.Match.ScheduledStartDateTime).getTime() : null;
                                        const workTime = hasWorkMatch ? new Date(futureMatch.WorkMatch.ScheduledStartDateTime).getTime() : null;
                                        
                                        return (
                                          <tr
                                            key={index}
                                            className="border-b border-[#454654] last:border-b-0"
                                          >
                                            <td className="px-2 sm:px-3 py-2 text-[#f8f8f9] font-medium">
                                              {futureMatch.RankText || '-'}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2">
                                              {hasMatch ? (
                                                <div className="text-[#c0c2c8]">
                                                  <div className="font-medium">
                                                    {formatMatchDate(matchTime!)} {formatMatchTime(matchTime!)}
                                                  </div>
                                                  {futureMatch.Match.Court && (
                                                    <div className="text-[10px] text-[#9fa2ab]">
                                                      {futureMatch.Match.Court.Name}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-[#808593]">Pending Reseed</span>
                                              )}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2">
                                              {hasWorkMatch ? (
                                                <div className="text-[#c0c2c8]">
                                                  <div className="font-medium">
                                                    {formatMatchDate(workTime!)} {formatMatchTime(workTime!)}
                                                  </div>
                                                  {futureMatch.WorkMatch.Court && (
                                                    <div className="text-[10px] text-[#9fa2ab]">
                                                      {futureMatch.WorkMatch.Court.Name}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-[#808593]">Pending Reseed</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-[#808593] py-4 text-center">
                            Loading pool sheet...
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-[#808593] py-4 text-center">
                        Select a pool to view standings
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
