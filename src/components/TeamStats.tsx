import { useMemo } from 'react';
import type { FilteredMatch, MatchScore } from '../types';
import { useMatchClaiming } from '../hooks/useMatchClaiming';
import { calculateTeamStats } from '../utils/scoreStats';

interface TeamStatsProps {
  matches: FilteredMatch[];
  eventId: string;
  teamId: string;
  teamName: string;
}

/**
 * Component for displaying team statistics
 */
export const TeamStatsView = ({ matches, eventId, teamId, teamName }: TeamStatsProps) => {
  const matchClaiming = useMatchClaiming({ eventId, userId: 'anonymous' });

  // Get all scores
  const scores = useMemo(() => {
    const scoreMap = new Map<number, MatchScore>();
    matches.forEach(match => {
      const score = matchClaiming.getScore(match.MatchId);
      if (score) {
        scoreMap.set(match.MatchId, score);
      }
    });
    return scoreMap;
  }, [matches, matchClaiming]);

  // Calculate team statistics
  const stats = useMemo(() => {
    return calculateTeamStats(teamId, teamName, matches, scores);
  }, [teamId, teamName, matches, scores]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#f8f8f9]">Team Statistics</h3>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Record</div>
          <div className="text-lg font-bold text-[#f8f8f9]">
            {stats.wins}-{stats.losses}
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Win %</div>
          <div className="text-lg font-bold text-[#facc15]">
            {stats.winPercentage.toFixed(1)}%
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Sets</div>
          <div className="text-lg font-bold text-[#f8f8f9]">
            {stats.setsWon}-{stats.setsLost}
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Matches</div>
          <div className="text-lg font-bold text-[#f8f8f9]">
            {stats.completedMatches}/{stats.totalMatches}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="space-y-3">
        <div className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]">
          <div className="text-sm font-semibold text-[#f8f8f9] mb-2">Points</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-[#9fa2ab] mb-1">Scored</div>
              <div className="text-base font-bold text-[#f8f8f9]">
                {stats.pointsScored} ({stats.avgPointsScored.toFixed(1)} avg)
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9fa2ab] mb-1">Allowed</div>
              <div className="text-base font-bold text-[#f8f8f9]">
                {stats.pointsAllowed} ({stats.avgPointsAllowed.toFixed(1)} avg)
              </div>
            </div>
          </div>
        </div>

        {/* Win/Loss Breakdown */}
        {stats.completedMatches > 0 && (
          <div className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]">
            <div className="text-sm font-semibold text-[#f8f8f9] mb-2">Win/Loss Breakdown</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9fa2ab]">Wins</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#454654] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${stats.winPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#f8f8f9] w-8 text-right">
                    {stats.wins}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9fa2ab]">Losses</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#454654] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${100 - stats.winPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#f8f8f9] w-8 text-right">
                    {stats.losses}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {stats.completedMatches === 0 && (
        <div className="text-center py-8 text-[#9fa2ab] text-sm">
          No completed matches yet
        </div>
      )}
    </div>
  );
};

