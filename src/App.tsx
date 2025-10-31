import { useState, useEffect } from 'react';
import { EventInput } from './components/EventInput';
import { MatchList } from './components/MatchList';
import { TimelineView } from './components/TimelineView';
import { CoachView } from './components/CoachView';
import { fetchCourtSchedule, fetchEventInfo } from './services/api';
import { filterClubMatches } from './utils/matchFilters';
import type { FilteredMatch } from './types';
import { TeamDetailPanel } from './components/TeamDetailPanel';
import { useCoveragePlan } from './hooks/useCoveragePlan';
import { CoveragePlanPanel } from './components/CoveragePlanPanel';
import { formatMatchDate } from './utils/dateUtils';
import { useCoverageStatus } from './hooks/useCoverageStatus';
import { useUserRole } from './hooks/useUserRole';

function App() {
  const [eventId, setEventId] = useState('PTAwMDAwNDEzMTQ90');
  const [date, setDate] = useState('2025-11-01');
  const [timeWindow, setTimeWindow] = useState(300);
  const [matches, setMatches] = useState<FilteredMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showConfig, setShowConfig] = useState(false);
  const [clubId, setClubId] = useState<number>(24426); // 630 Volleyball club ID
  const [selectedTeam, setSelectedTeam] = useState<FilteredMatch | null>(null);
  const [showCoveragePlan, setShowCoveragePlan] = useState(false);
  const [eventInfo, setEventInfo] = useState<{ name?: string; startDate?: string; endDate?: string } | null>(null);
  
  // Coverage plan hook
  const coveragePlan = useCoveragePlan();
  
  // Coverage status hook
  const coverageStatus = useCoverageStatus();
  
  // User role hook
  const userRole = useUserRole();

  // Auto-update coverage status when plan changes
  useEffect(() => {
    if (matches.length === 0) return;
    
    // Group matches by team
    const teamMatches = new Map<string, { total: number; inPlan: number }>();
    
    matches.forEach(match => {
      const teamText = match.InvolvedTeam === 'first' 
        ? match.FirstTeamText 
        : match.SecondTeamText;
      const matchResult = teamText.match(/(\d+-\d+)/);
      const teamId = matchResult ? matchResult[1] : '';
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, coveragePlan.getSelectedCount(), coverageStatus.updateFromPlan]);

  // Auto-load on mount
  useEffect(() => {
    handleLoad(eventId, date, timeWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleLoad = async (
    newEventId: string,
    newDate: string,
    newTimeWindow: number
  ) => {
    setLoading(true);
    setError(null);
    setEventId(newEventId);
    setDate(newDate);
    setTimeWindow(newTimeWindow);

    try {
      // Fetch event info to get club ID and event details
      const eventInfoData = await fetchEventInfo(newEventId);
      const club = eventInfoData.Clubs?.find((c: any) => c.Name === '630 Volleyball');
      if (club) {
        setClubId(club.ClubId);
      }

      // Store event info for display - try multiple possible field names
      setEventInfo({
        name: eventInfoData.Name || eventInfoData.EventName || eventInfoData.FullName || eventInfoData.Title || 'Event',
        startDate: eventInfoData.StartDate || eventInfoData.StartDateTime || eventInfoData.Start || eventInfoData.StartTime,
        endDate: eventInfoData.EndDate || eventInfoData.EndDateTime || eventInfoData.End || eventInfoData.EndTime,
      });

      const data = await fetchCourtSchedule(newEventId, newDate, newTimeWindow);
      const filteredMatches = filterClubMatches(data.CourtSchedules);
      setMatches(filteredMatches);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(matches, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `630-volleyball-matches-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      'Match ID',
      'Division',
      'Short Name',
      'First Team',
      'Second Team',
      'Work Team',
      'Court',
      'Start Time',
      'End Time',
      'Duration',
      'Involved Team',
    ];

    const rows = matches.map((match) => [
      match.MatchId.toString(),
      match.Division.Name,
      match.CompleteShortName,
      match.FirstTeamText,
      match.SecondTeamText,
      match.WorkTeamText,
      match.CourtName,
      new Date(match.ScheduledStartDateTime).toISOString(),
      new Date(match.ScheduledEndDateTime).toISOString(),
      ((match.ScheduledEndDateTime - match.ScheduledStartDateTime) / 60000).toString(),
      match.InvolvedTeam,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `630-volleyball-matches-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const conflictCount = matches.filter((m) => {
    const conflicts = new Map<number, number[]>();
    matches.forEach((match1, i) => {
      matches.slice(i + 1).forEach((match2) => {
        const overlaps =
          match1.ScheduledStartDateTime < match2.ScheduledEndDateTime &&
          match1.ScheduledEndDateTime > match2.ScheduledStartDateTime;
        if (overlaps) {
          if (!conflicts.has(match1.MatchId)) conflicts.set(match1.MatchId, []);
          conflicts.get(match1.MatchId)!.push(match2.MatchId);
        }
      });
    });
    return conflicts.has(m.MatchId);
  }).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#18181b' }}>
      {/* Compact Header - Chrome Budget: ~60px */}
      <header className="border-b sticky top-0 z-10" style={{ borderColor: '#454654', backgroundColor: 'rgba(59, 60, 72, 0.5)' }}>
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: '#f8f8f9' }}>
                  630 Volleyball Coverage
                </h1>
                {matches.length > 0 && (
                  <span className="text-xs whitespace-nowrap hidden sm:inline" style={{ color: '#9fa2ab' }}>
                    {matches.length} matches
                    {conflictCount > 0 && (
                      <span className="ml-2" style={{ color: '#ef4444' }}>• {conflictCount} conflicts</span>
                    )}
                  </span>
                )}
              </div>
              
              {/* Event Name and Date Range */}
              {eventInfo && (eventInfo.name || eventInfo.startDate) && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#9fa2ab' }}>
                  {eventInfo.name && (
                    <span className="font-medium truncate max-w-[200px] sm:max-w-none">
                      {eventInfo.name}
                    </span>
                  )}
                  {(eventInfo.startDate || eventInfo.endDate) && (
                    <span className="hidden sm:inline">
                      {(() => {
                        try {
                          const startDate = eventInfo.startDate ? new Date(eventInfo.startDate).getTime() : null;
                          const endDate = eventInfo.endDate ? new Date(eventInfo.endDate).getTime() : null;
                          
                          if (startDate && endDate && Math.abs(startDate - endDate) > 86400000) {
                            // More than 1 day difference
                            return `${formatMatchDate(startDate)} - ${formatMatchDate(endDate)}`;
                          } else if (startDate) {
                            return formatMatchDate(startDate);
                          } else if (endDate) {
                            return formatMatchDate(endDate);
                          }
                          return null;
                        } catch {
                          return null;
                        }
                      })()}
                    </span>
                  )}
                </div>
              )}
              
              {/* Mobile: Show match count below */}
              {matches.length > 0 && (
                <span className="text-xs sm:hidden" style={{ color: '#9fa2ab' }}>
                  {matches.length} matches
                  {conflictCount > 0 && (
                    <span className="ml-2" style={{ color: '#ef4444' }}>• {conflictCount} conflicts</span>
                  )}
                </span>
              )}
            </div>
            
            {/* Inline Utility Controls - Wrap on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* User Role Selector */}
              <div className="flex items-center gap-1">
                <label className="text-xs hidden sm:inline" style={{ color: '#9fa2ab' }}>Role:</label>
                <select
                  value={userRole.role}
                  onChange={(e) => userRole.setRole(e.target.value as any)}
                  className="px-2 py-2 sm:py-1.5 text-xs rounded-lg transition-colors min-h-[44px] sm:min-h-0"
                  style={{ backgroundColor: '#454654', color: '#c0c2c8', border: '1px solid #525463' }}
                  title="Select your role"
                >
                  <option value="media">Media</option>
                  <option value="spectator">Spectator</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
              
              {matches.length > 0 && (
                <>
                  {/* View Mode Pills */}
                  {/* View Mode Toggle - Hide for Coach role */}
                  {!userRole.isCoach && (
                    <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: '#454654' }}>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                          viewMode === 'list'
                            ? 'text-[#18181b]'
                            : 'hover:text-[#f8f8f9]'
                        }`}
                        style={viewMode === 'list' ? { backgroundColor: '#eab308' } : { color: '#c0c2c8' }}
                      >
                        List
                      </button>
                      <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${
                          viewMode === 'timeline'
                            ? 'text-[#18181b]'
                            : 'hover:text-[#f8f8f9]'
                        }`}
                        style={viewMode === 'timeline' ? { backgroundColor: '#eab308' } : { color: '#c0c2c8' }}
                      >
                        Timeline
                      </button>
                    </div>
                  )}

                  {/* Coverage Plan Toggle - Only show for Media role */}
                  {userRole.isMedia && coveragePlan.getSelectedCount() > 0 && (
                    <button
                      onClick={() => setShowCoveragePlan(!showCoveragePlan)}
                      className={`px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0 ${
                        showCoveragePlan ? 'text-[#18181b]' : ''
                      }`}
                      style={showCoveragePlan ? { backgroundColor: '#eab308' } : { backgroundColor: '#454654', color: '#c0c2c8' }}
                    >
                      Plan ({coveragePlan.getSelectedCount()})
                    </button>
                  )}

                  {/* Export Pills */}
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[#f8f8f9] min-h-[44px] sm:min-h-0"
                    style={{ backgroundColor: '#454654', color: '#c0c2c8' }}
                    title="Export JSON"
                  >
                    JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[#f8f8f9] min-h-[44px] sm:min-h-0"
                    style={{ backgroundColor: '#454654', color: '#c0c2c8' }}
                    title="Export CSV"
                  >
                    CSV
                  </button>
                </>
              )}
              
              {/* Config Toggle */}
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0 ${
                  showConfig ? 'text-[#18181b]' : ''
                }`}
                style={showConfig ? { backgroundColor: '#eab308' } : { backgroundColor: '#454654', color: '#c0c2c8' }}
              >
                {showConfig ? 'Hide' : 'Config'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progressive Disclosure: Config Panel */}
      {showConfig && (
        <div className="border-b" style={{ borderColor: '#454654', backgroundColor: 'rgba(59, 60, 72, 0.3)' }}>
          <div className="container mx-auto px-3 sm:px-4 py-4">
            <EventInput
              eventId={eventId}
              date={date}
              timeWindow={timeWindow}
              onLoad={handleLoad}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Main Content - ≥60% of viewport */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-pulse" style={{ color: '#9fa2ab' }}>
              Loading matches...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg mb-6 px-4 py-3 border" style={{ backgroundColor: 'rgba(127, 29, 29, 0.5)', borderColor: '#991b1b', color: '#fca5a5' }}>
            <div className="text-xs font-medium mb-1">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        {!loading && matches.length === 0 && !error && (
          <div className="text-center py-12" style={{ color: '#9fa2ab' }}>
            <div className="text-sm">No matches found for 630 Volleyball</div>
            <div className="text-xs mt-2" style={{ color: '#808593' }}>
              Click "Config" to change event parameters
            </div>
          </div>
        )}

        {userRole.isCoach ? (
          <CoachView
            matches={matches}
            eventId={eventId}
            clubId={clubId}
          />
        ) : viewMode === 'list' ? (
          <MatchList 
            matches={matches} 
            eventId={eventId} 
            clubId={clubId}
            coveragePlan={coveragePlan}
            userRole={userRole}
          />
        ) : (
          <TimelineView 
            matches={matches}
            coveragePlan={coveragePlan}
            userRole={userRole}
            eventId={eventId}
          />
        )}

        {selectedTeam && (
          <TeamDetailPanel
            match={selectedTeam}
            eventId={eventId}
            clubId={clubId}
            matches={matches}
            onClose={() => setSelectedTeam(null)}
          />
        )}

        {showCoveragePlan && (
          <CoveragePlanPanel
            matches={matches}
            coveragePlan={coveragePlan}
            onClose={() => setShowCoveragePlan(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
