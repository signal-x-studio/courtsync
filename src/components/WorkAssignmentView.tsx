import { useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { formatMatchTime, formatMatchDate } from '../utils/dateUtils';
import { useFilters } from '../hooks/useFilters';

interface WorkAssignmentViewProps {
  matches: FilteredMatch[];
  teamId: string;
  teamName: string;
}

/**
 * Component for displaying work assignments for a team (coach view)
 */
export const WorkAssignmentView = ({ matches, teamId, teamName }: WorkAssignmentViewProps) => {
  const { getTeamIdentifier } = useFilters();

  // Filter matches where this team is the "working team"
  const workAssignments = useMemo(() => {
    return matches.filter(match => {
      // Check if this team is assigned to work (not playing)
      // Work assignments are matches where the team is NOT involved as first or second team
      // but may be assigned as a working team
      const matchTeamId = getTeamIdentifier(match);
      
      // If team is playing, it's not a work assignment
      if (matchTeamId === teamId) {
        return false;
      }

      // For now, we'll check if the match involves this team in a work capacity
      // This logic may need adjustment based on how work assignments are identified in the API
      // For now, we'll return false since we don't have explicit work assignment data
      // This is a placeholder for future work assignment integration
      return false;
    }).sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
  }, [matches, teamId, getTeamIdentifier]);

  // Separate assignments by date
  const assignmentsByDate = useMemo(() => {
    const grouped: Record<string, FilteredMatch[]> = {};
    workAssignments.forEach(match => {
      const date = formatMatchDate(match.ScheduledStartDateTime);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(match);
    });
    return grouped;
  }, [workAssignments]);

  const dates = useMemo(() => {
    return Object.keys(assignmentsByDate).sort();
  }, [assignmentsByDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#454654] pb-4">
        <h2 className="text-xl font-bold text-[#f8f8f9]">Work Assignments</h2>
        <div className="text-sm text-[#9fa2ab] mt-1">
          {teamName} • {workAssignments.length} assignment{workAssignments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Work Assignments */}
      {workAssignments.length > 0 ? (
        <div className="space-y-4">
          {dates.map(date => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-[#9fa2ab] mb-2 uppercase tracking-wider">
                {date}
              </h3>
              <div className="space-y-2">
                {assignmentsByDate[date].map(match => (
                  <div
                    key={match.MatchId}
                    className="px-4 py-3 rounded-lg border border-[#525463] bg-[#454654]/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-[#f8f8f9]">
                        {formatMatchTime(match.ScheduledStartDateTime)}
                      </div>
                      <div className="text-xs font-medium text-[#9fa2ab]">
                        {match.CourtName}
                      </div>
                    </div>
                    <div className="text-sm text-[#c0c2c8]">
                      {match.FirstTeamText} vs {match.SecondTeamText}
                    </div>
                    <div className="text-xs text-[#9fa2ab] mt-1">
                      {match.Division.CodeAlias} • Work Assignment
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#9fa2ab] text-sm">
          No work assignments found for {teamName}
          <div className="text-xs text-[#808593] mt-2">
            Work assignments will appear here when assigned by tournament officials.
          </div>
        </div>
      )}
    </div>
  );
};

