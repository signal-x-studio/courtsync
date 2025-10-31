import { useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime, formatMatchDate } from '../utils/dateUtils';
import { useFilters } from '../hooks/useFilters';

interface TeamMatchViewProps {
  matches: FilteredMatch[];
  teamId: string;
  teamName: string;
}

/**
 * Component for displaying all matches for a specific team (coach view)
 */
export const TeamMatchView = ({ matches, teamId, teamName }: TeamMatchViewProps) => {
  const { getTeamIdentifier } = useFilters();

  // Filter matches for this team
  const teamMatches = useMemo(() => {
    return matches.filter(match => {
      const matchTeamId = getTeamIdentifier(match);
      return matchTeamId === teamId;
    }).sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
  }, [matches, teamId, getTeamIdentifier]);

  // Separate matches into past, current, and upcoming
  const now = Date.now();
  const pastMatches = useMemo(() => {
    return teamMatches.filter(m => m.ScheduledEndDateTime < now);
  }, [teamMatches, now]);

  const currentMatches = useMemo(() => {
    return teamMatches.filter(m => 
      m.ScheduledStartDateTime <= now && m.ScheduledEndDateTime >= now
    );
  }, [teamMatches, now]);

  const upcomingMatches = useMemo(() => {
    return teamMatches.filter(m => m.ScheduledStartDateTime > now);
  }, [teamMatches, now]);

  // Get opponent for a match
  const getOpponent = (match: FilteredMatch): string => {
    if (match.InvolvedTeam === 'first') return match.SecondTeamText;
    if (match.InvolvedTeam === 'second') return match.FirstTeamText;
    return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="border-b border-[#454654] pb-4">
        <h2 className="text-xl font-bold text-[#f8f8f9]">{teamName}</h2>
        <div className="text-sm text-[#9fa2ab] mt-1">
          {teamMatches.length} total match{teamMatches.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* Current Matches */}
      {currentMatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#facc15] mb-3 uppercase tracking-wider">
            Live Now
          </h3>
          <div className="space-y-2">
            {currentMatches.map(match => (
              <div
                key={match.MatchId}
                className="px-4 py-3 rounded-lg border-2 border-[#eab308] bg-[#eab308]/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-[#f8f8f9]">
                    {formatMatchTime(match.ScheduledStartDateTime)}
                  </div>
                  <div className="text-xs font-medium text-[#facc15]">
                    {match.CourtName}
                  </div>
                </div>
                <div className="text-base font-bold text-[#f8f8f9]">
                  vs {getOpponent(match)}
                </div>
                <div className="text-xs text-[#9fa2ab] mt-1">
                  {match.Division.CodeAlias}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#f8f8f9] mb-3 uppercase tracking-wider">
            Upcoming Matches
          </h3>
          <div className="space-y-2">
            {upcomingMatches.map(match => (
              <div
                key={match.MatchId}
                className="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48] hover:border-[#525463] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-[#f8f8f9]">
                      {formatMatchDate(match.ScheduledStartDateTime)} • {formatMatchTime(match.ScheduledStartDateTime)}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-[#facc15]">
                    {match.CourtName}
                  </div>
                </div>
                <div className="text-base font-bold text-[#f8f8f9]">
                  vs {getOpponent(match)}
                </div>
                <div className="text-xs text-[#9fa2ab] mt-1">
                  {match.Division.CodeAlias}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Matches */}
      {pastMatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#9fa2ab] mb-3 uppercase tracking-wider">
            Match History
          </h3>
          <div className="space-y-2">
            {pastMatches.map(match => (
              <div
                key={match.MatchId}
                className="px-4 py-2 rounded-lg border border-[#454654] bg-[#3b3c48]/50 opacity-75"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-[#9fa2ab]">
                    {formatMatchDate(match.ScheduledStartDateTime)} • {formatMatchTime(match.ScheduledStartDateTime)}
                  </div>
                  <div className="text-xs text-[#808593]">
                    {match.CourtName}
                  </div>
                </div>
                <div className="text-sm font-medium text-[#c0c2c8]">
                  vs {getOpponent(match)}
                </div>
                <div className="text-xs text-[#808593] mt-0.5">
                  {match.Division.CodeAlias}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamMatches.length === 0 && (
        <div className="text-center py-12 text-[#9fa2ab] text-sm">
          No matches found for {teamName}
        </div>
      )}
    </div>
  );
};

