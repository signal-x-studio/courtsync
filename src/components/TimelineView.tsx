import type { FilteredMatch } from '../types';
import { formatMatchTime } from '../utils/dateUtils';
import { detectConflicts } from '../utils/matchFilters';

interface TimelineViewProps {
  matches: FilteredMatch[];
}

export const TimelineView = ({ matches }: TimelineViewProps) => {
  const conflicts = detectConflicts(matches);

  if (matches.length === 0) {
    return null;
  }

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

  // Calculate timeline bounds
  const earliestTime = Math.min(...matches.map((m) => m.ScheduledStartDateTime));
  const latestTime = Math.max(...matches.map((m) => m.ScheduledEndDateTime));
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
  const matchesByCourt = matches.reduce((acc, match) => {
    if (!acc[match.CourtName]) {
      acc[match.CourtName] = [];
    }
    acc[match.CourtName].push(match);
    return acc;
  }, {} as Record<string, FilteredMatch[]>);

  const courts = Object.keys(matchesByCourt).sort();

  return (
    <div className="space-y-4">
      {/* Timeline Header - Compact per style guide */}
      <div className="text-xs text-[#9fa2ab]">
        Timeline: {formatMatchTime(earliestTime)} - {formatMatchTime(latestTime)}
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
                  {courtMatches.map((match) => {
                    const hasConflict = conflicts.has(match.MatchId);
                    const left = getPosition(match.ScheduledStartDateTime);
                    const width = Math.max(
                      getWidth(match.ScheduledStartDateTime, match.ScheduledEndDateTime),
                      2
                    );
                    const teamId = getTeamIdentifier(match);
                    const opponent = getOpponent(match);

                    return (
                      <div
                        key={match.MatchId}
                        className="group absolute h-16 rounded-md px-2 py-1.5 text-white shadow-sm border-2 flex flex-col justify-center transition-all active:scale-95 sm:hover:z-20 sm:hover:shadow-lg touch-manipulation"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: hasConflict ? '#dc2626' : match.Division.ColorHex,
                          borderColor: hasConflict ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                          minWidth: '100px',
                          zIndex: hasConflict ? 10 : 1,
                        }}
                        title={`${match.CompleteShortName}: ${match.FirstTeamText} vs ${match.SecondTeamText} - ${formatMatchTime(match.ScheduledStartDateTime)}`}
                      >
                        {/* Team Identifier - Primary content */}
                        <div className="text-xs sm:text-sm font-bold truncate leading-tight">
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

                        {/* Hover tooltip - Progressive disclosure (desktop only) */}
                        <div className="hidden sm:block absolute bottom-full left-0 mb-2 px-2 py-1 bg-[#18181b] border border-[#454654] rounded text-xs text-[#f8f8f9] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30">
                          <div className="font-semibold">{match.CompleteShortName}</div>
                          <div className="text-[10px] text-[#9fa2ab] mt-0.5">
                            {match.FirstTeamText} vs {match.SecondTeamText}
                          </div>
                          {hasConflict && (
                            <div className="text-[10px] text-red-400 mt-0.5">
                              Conflict: {conflicts.get(match.MatchId)?.length || 0} other match{conflicts.get(match.MatchId)?.length !== 1 ? 'es' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
