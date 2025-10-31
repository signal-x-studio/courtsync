import { useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime } from '../utils/dateUtils';
import { useMatchClaiming } from '../hooks/useMatchClaiming';
import { LiveScoreIndicator } from './LiveScoreIndicator';
import type { SetScore } from '../types';

interface LiveMatchDashboardProps {
  matches: FilteredMatch[];
  eventId: string;
  userId?: string;
  onMatchClick?: (match: FilteredMatch) => void;
}

/**
 * Component for displaying live/currently playing matches
 */
export const LiveMatchDashboard = ({ matches, eventId, userId, onMatchClick }: LiveMatchDashboardProps) => {
  const matchClaiming = useMatchClaiming({ eventId, userId: userId || 'anonymous' });

  // Find matches that are currently in progress
  const liveMatches = useMemo(() => {
    const now = Date.now();
    return matches.filter(match => {
      const matchStart = match.ScheduledStartDateTime;
      const matchEnd = match.ScheduledEndDateTime || matchStart + (90 * 60 * 1000); // Default 90 minutes if no end time
      const score = matchClaiming.getScore(match.MatchId);
      
      // Consider a match "live" if:
      // 1. It has a score with status 'in-progress', OR
      // 2. Current time is between start and end time
      return (score && score.status === 'in-progress') || (now >= matchStart && now <= matchEnd);
    });
  }, [matches, matchClaiming]);

  if (liveMatches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#f8f8f9] flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Live Now
        </h2>
        <span className="text-xs text-[#9fa2ab]">
          {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} in progress
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveMatches.map(match => {
          const score = matchClaiming.getScore(match.MatchId);
          const currentSet = score?.sets.find((s: SetScore) => s.completedAt === 0) || score?.sets[score.sets.length - 1];
          const completedSets = score?.sets.filter((s: SetScore) => s.completedAt > 0) || [];
          const team1Wins = completedSets.filter((s: SetScore) => s.team1Score > s.team2Score).length;
          const team2Wins = completedSets.filter((s: SetScore) => s.team2Score > s.team1Score).length;

          return (
            <div
              key={match.MatchId}
              onClick={() => onMatchClick?.(match)}
              className="px-4 py-3 rounded-lg border border-[#525463] bg-[#454654] hover:border-[#eab308] transition-colors cursor-pointer"
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#facc15]">
                    {match.CourtName}
                  </span>
                  <LiveScoreIndicator
                    isLive={score?.status === 'in-progress' || false}
                    lastUpdated={score?.lastUpdated}
                  />
                </div>
                <div className="text-xs text-[#9fa2ab]">
                  {formatMatchTime(match.ScheduledStartDateTime)}
                </div>
              </div>

              {/* Teams */}
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[#f8f8f9]">
                  {match.FirstTeamText}
                </div>
                <div className="text-xs text-[#9fa2ab]">vs</div>
                <div className="text-sm font-semibold text-[#f8f8f9]">
                  {match.SecondTeamText}
                </div>
              </div>

              {/* Score Display */}
              {score && score.status !== 'not-started' && currentSet && (
                <div className="mt-3 pt-3 border-t border-[#525463]">
                  <div className="flex items-center justify-between">
                    {completedSets.length > 0 && (
                      <div className="text-xs text-[#9fa2ab]">
                        Sets: {team1Wins}-{team2Wins}
                      </div>
                    )}
                    <div className="text-lg font-bold text-[#facc15]">
                      {currentSet.team1Score}-{currentSet.team2Score}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

