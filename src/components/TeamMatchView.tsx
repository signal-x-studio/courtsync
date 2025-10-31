import { useMemo, useState } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime, formatMatchDate } from '../utils/dateUtils';
import { useFilters } from '../hooks/useFilters';
import { useMatchNotes } from '../hooks/useMatchNotes';

interface TeamMatchViewProps {
  matches: FilteredMatch[];
  teamId: string;
  teamName: string;
  eventId?: string;
}

/**
 * Component for displaying all matches for a specific team (coach view)
 */
export const TeamMatchView = ({ matches, teamId, teamName, eventId = '' }: TeamMatchViewProps) => {
  const { getTeamIdentifier } = useFilters();
  const matchNotes = useMatchNotes({ eventId });
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

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

  const handleStartEditing = (matchId: number) => {
    setEditingMatchId(matchId);
    setNoteText(matchNotes.getNote(matchId));
  };

  const handleSaveNote = (matchId: number) => {
    matchNotes.setNote(matchId, noteText);
    setEditingMatchId(null);
    setNoteText('');
  };

  const handleCancelEditing = () => {
    setEditingMatchId(null);
    setNoteText('');
  };

  const handleDeleteNote = (matchId: number) => {
    matchNotes.deleteNote(matchId);
    setEditingMatchId(null);
  };

  // Match Card Component with Notes
  const MatchCard = ({ match, isLive = false, isPast = false }: { match: FilteredMatch; isLive?: boolean; isPast?: boolean }) => {
    const hasNote = matchNotes.hasNote(match.MatchId);
    const isEditing = editingMatchId === match.MatchId;
    const note = matchNotes.getNote(match.MatchId);

    return (
      <div className={`px-4 py-3 rounded-lg border ${isLive ? 'border-2 border-[#eab308] bg-[#eab308]/10' : isPast ? 'border border-[#454654] bg-[#3b3c48]/50 opacity-75' : 'border border-[#454654] bg-[#3b3c48] hover:border-[#525463]'} transition-colors`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className={`${isLive ? 'text-sm' : isPast ? 'text-xs' : 'text-sm'} font-semibold text-[#f8f8f9]`}>
                {isPast ? formatMatchDate(match.ScheduledStartDateTime) + ' • ' : ''}
                {formatMatchTime(match.ScheduledStartDateTime)}
              </div>
              <div className={`${isLive ? 'text-xs' : 'text-xs'} font-medium text-[#facc15]`}>
                {match.CourtName}
              </div>
            </div>
            <div className={`${isLive ? 'text-base' : isPast ? 'text-sm' : 'text-base'} font-bold text-[#f8f8f9]`}>
              vs {getOpponent(match)}
            </div>
            <div className={`${isLive ? 'text-xs' : 'text-xs'} text-[#9fa2ab] mt-1`}>
              {match.Division.CodeAlias}
            </div>
          </div>
          
          {/* Notes Button */}
          <button
            onClick={() => isEditing ? handleCancelEditing() : handleStartEditing(match.MatchId)}
            className={`ml-2 px-2 py-1 text-xs rounded transition-colors flex-shrink-0 ${
              hasNote || isEditing
                ? 'bg-[#eab308] text-[#18181b] hover:bg-[#facc15]'
                : 'bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border border-[#525463]'
            }`}
            title={hasNote ? 'Edit note' : 'Add note'}
          >
            {hasNote ? '📝' : '📄'}
          </button>
        </div>

        {/* Note Display/Edit */}
        {isEditing ? (
          <div className="mt-3 pt-3 border-t border-[#454654]">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add notes about this match..."
              className="w-full px-3 py-2 text-sm bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] focus:border-[#eab308] focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleSaveNote(match.MatchId)}
                className="px-3 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
              >
                Save
              </button>
              {hasNote && (
                <button
                  onClick={() => handleDeleteNote(match.MatchId)}
                  className="px-3 py-1 text-xs font-medium rounded bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleCancelEditing}
                className="px-3 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : hasNote ? (
          <div className="mt-3 pt-3 border-t border-[#454654]">
            <div className="text-xs text-[#9fa2ab] mb-1">Note:</div>
            <div className="text-sm text-[#c0c2c8] whitespace-pre-wrap">{note}</div>
          </div>
        ) : null}
      </div>
    );
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
              <MatchCard key={match.MatchId} match={match} isLive />
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
              <MatchCard key={match.MatchId} match={match} />
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
              <MatchCard key={match.MatchId} match={match} isPast />
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

