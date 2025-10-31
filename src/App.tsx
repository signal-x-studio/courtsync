import { useState, useEffect } from 'react';
import { EventInput } from './components/EventInput';
import { MatchList } from './components/MatchList';
import { TimelineView } from './components/TimelineView';
import { fetchCourtSchedule, fetchEventInfo } from './services/api';
import { filterClubMatches } from './utils/matchFilters';
import type { FilteredMatch } from './types';

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
      // Fetch event info to get club ID
      const eventInfo = await fetchEventInfo(newEventId);
      const club = eventInfo.Clubs?.find((c: any) => c.Name === '630 Volleyball');
      if (club) {
        setClubId(club.ClubId);
      }

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
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: '#f8f8f9' }}>
                630 Volleyball Coverage
              </h1>
              {matches.length > 0 && (
                <span className="text-xs whitespace-nowrap" style={{ color: '#9fa2ab' }}>
                  {matches.length} matches
                  {conflictCount > 0 && (
                    <span className="ml-2" style={{ color: '#ef4444' }}>• {conflictCount} conflicts</span>
                  )}
                </span>
              )}
            </div>
            
            {/* Inline Utility Controls - Wrap on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {matches.length > 0 && (
                <>
                  {/* View Mode Pills */}
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

        {viewMode === 'list' ? (
          <MatchList matches={matches} eventId={eventId} clubId={clubId} />
        ) : (
          <TimelineView matches={matches} />
        )}
      </main>
    </div>
  );
}

export default App;
