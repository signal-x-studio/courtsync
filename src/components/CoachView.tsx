import { useState, useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { useFilters } from '../hooks/useFilters';
import { TeamMatchView } from './TeamMatchView';
import { WorkAssignmentView } from './WorkAssignmentView';
import { TeamDetailPanel } from './TeamDetailPanel';

interface CoachViewProps {
  matches: FilteredMatch[];
  eventId: string;
  clubId: number;
}

/**
 * Component for coach view - team-centric match display
 */
export const CoachView = ({ matches, eventId, clubId }: CoachViewProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<FilteredMatch | null>(null);
  const [viewMode, setViewMode] = useState<'matches' | 'work'>('matches');
  const { getUniqueTeams, getTeamIdentifier } = useFilters();

  // Get unique teams from matches
  const teams = useMemo(() => {
    return getUniqueTeams(matches);
  }, [matches, getUniqueTeams]);

  // Group matches by team
  const matchesByTeam = useMemo(() => {
    const grouped: Record<string, FilteredMatch[]> = {};
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (teamId) {
        if (!grouped[teamId]) {
          grouped[teamId] = [];
        }
        grouped[teamId].push(match);
      }
    });
    return grouped;
  }, [matches, getTeamIdentifier]);

  // Get selected team's matches
  const selectedTeamMatches = useMemo(() => {
    if (!selectedTeam) return [];
    return matchesByTeam[selectedTeam] || [];
  }, [selectedTeam, matchesByTeam]);

  // Sort teams by number of matches (most active teams first)
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const matchesA = matchesByTeam[a]?.length || 0;
      const matchesB = matchesByTeam[b]?.length || 0;
      return matchesB - matchesA;
    });
  }, [teams, matchesByTeam]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#f8f8f9]">Coach View</h1>
          <p className="text-sm text-[#9fa2ab] mt-1">
            View matches and work assignments by team
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-[#454654] rounded-lg p-1">
          <button
            onClick={() => setViewMode('matches')}
            className={`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${
              viewMode === 'matches'
                ? 'bg-[#eab308] text-[#18181b]'
                : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setViewMode('work')}
            className={`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${
              viewMode === 'work'
                ? 'bg-[#eab308] text-[#18181b]'
                : 'text-[#c0c2c8] hover:text-[#f8f8f9]'
            }`}
          >
            Work Assignments
          </button>
        </div>
      </div>

      {/* Team Selector */}
      {teams.length > 0 && (
        <div className="border-b border-[#454654] pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Select Team:</span>
            {sortedTeams.map(teamId => (
              <button
                key={teamId}
                onClick={() => {
                  setSelectedTeam(teamId);
                  // Find first match for this team to open detail panel
                  const firstMatch = matchesByTeam[teamId]?.[0];
                  if (firstMatch) {
                    setSelectedMatch(firstMatch);
                  }
                }}
                className={`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${
                  selectedTeam === teamId
                    ? 'bg-[#eab308] text-[#18181b]'
                    : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]'
                }`}
              >
                {teamId}
                {matchesByTeam[teamId] && (
                  <span className="ml-2 text-[10px] opacity-75">
                    ({matchesByTeam[teamId].length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team Content */}
      {selectedTeam ? (
        viewMode === 'matches' ? (
          <TeamMatchView
            matches={selectedTeamMatches}
            teamId={selectedTeam}
            teamName={selectedTeam}
          />
        ) : (
          <WorkAssignmentView
            matches={matches}
            teamId={selectedTeam}
            teamName={selectedTeam}
          />
        )
      ) : (
        <div className="text-center py-12 text-[#9fa2ab] text-sm">
          Select a team to view matches and work assignments
        </div>
      )}

      {/* Team Detail Panel */}
      {selectedMatch && (
        <TeamDetailPanel
          match={selectedMatch}
          eventId={eventId}
          clubId={clubId}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};

