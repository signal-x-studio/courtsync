import { useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime } from '../utils/dateUtils';

interface ConflictDetailsPanelProps {
  match: FilteredMatch;
  conflictingMatches: FilteredMatch[];
  onClose: () => void;
}

export const ConflictDetailsPanel = ({
  match,
  conflictingMatches,
  onClose,
}: ConflictDetailsPanelProps) => {
  // Extract team identifier
  const getTeamIdentifier = (m: FilteredMatch): string => {
    const teamText = m.InvolvedTeam === 'first' 
      ? m.FirstTeamText 
      : m.SecondTeamText;
    const matchResult = teamText.match(/(\d+-\d+)/);
    return matchResult ? matchResult[1] : '';
  };

  // Get opponent
  const getOpponent = (m: FilteredMatch): string => {
    if (m.InvolvedTeam === 'first') return m.SecondTeamText;
    if (m.InvolvedTeam === 'second') return m.FirstTeamText;
    return `${m.FirstTeamText} vs ${m.SecondTeamText}`;
  };

  // Calculate travel time estimate (simplified: assume 5 minutes between courts)
  // In the future, this could use actual court locations
  const estimateTravelTime = (court1: string, court2: string): number => {
    // For now, assume all courts are 5 minutes apart
    // This could be enhanced with actual court location data
    return court1 !== court2 ? 5 : 0;
  };

  // Get current match details
  const currentTeamId = getTeamIdentifier(match);
  const currentOpponent = getOpponent(match);

  // Sort conflicting matches by time
  const sortedConflicts = useMemo(() => {
    return [...conflictingMatches].sort(
      (a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime
    );
  }, [conflictingMatches]);

  return (
    <div className="mt-2 border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-semibold text-[#f8f8f9] truncate pr-2">
            Conflict Details
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

        {/* Current Match */}
        <div className="mb-4 pb-4 border-b border-[#454654]">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">
            Selected Match
          </div>
          <div className="px-3 py-2 rounded border border-[#eab308]/50 bg-[#eab308]/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-[#facc15]">
                {currentTeamId || match.Division.CodeAlias}
              </span>
              <span className="text-xs text-[#808593]">vs</span>
              <span className="text-sm text-[#c0c2c8] truncate">
                {currentOpponent}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-[#facc15] font-medium">{match.CourtName}</span>
              <span className="text-[#9fa2ab]">{formatMatchTime(match.ScheduledStartDateTime)}</span>
              <span className="text-[#9fa2ab]">•</span>
              <span className="text-[#9fa2ab]">{match.Division.CodeAlias}</span>
            </div>
          </div>
        </div>

        {/* Conflicting Matches */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-[#9fa2ab] uppercase tracking-wider">
              Conflicting Matches ({conflictingMatches.length})
            </div>
            <span className="text-xs text-red-400 font-medium">
              Cannot cover simultaneously
            </span>
          </div>
          
          {sortedConflicts.length === 0 ? (
            <div className="text-xs text-[#808593] py-4 text-center">
              No conflicts found
            </div>
          ) : (
            <div className="space-y-2">
              {sortedConflicts.map((conflictMatch) => {
                const conflictTeamId = getTeamIdentifier(conflictMatch);
                const conflictOpponent = getOpponent(conflictMatch);
                const travelTime = estimateTravelTime(match.CourtName, conflictMatch.CourtName);

                return (
                  <div
                    key={conflictMatch.MatchId}
                    className="px-3 py-2.5 rounded border border-[#525463] bg-[#454654]/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#f8f8f9]">
                        {conflictTeamId || conflictMatch.Division.CodeAlias}
                      </span>
                      <span className="text-xs text-[#808593]">vs</span>
                      <span className="text-sm text-[#c0c2c8] truncate">
                        {conflictOpponent}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                      <span className="text-[#facc15] font-medium">{conflictMatch.CourtName}</span>
                      <span className="text-[#9fa2ab]">
                        {formatMatchTime(conflictMatch.ScheduledStartDateTime)}
                      </span>
                      <span className="text-[#9fa2ab]">•</span>
                      <span className="text-[#9fa2ab]">{conflictMatch.Division.CodeAlias}</span>
                      {travelTime > 0 && (
                        <>
                          <span className="text-[#9fa2ab]">•</span>
                          <span className="text-[#808593]">
                            ~{travelTime} min travel from {match.CourtName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-[#454654]">
          <p className="text-xs text-[#808593]">
            These matches overlap in time and are on different courts. You'll need to choose which match to cover.
          </p>
        </div>
      </div>
    </div>
  );
};

