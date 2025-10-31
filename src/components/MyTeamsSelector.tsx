import { useState, useMemo } from 'react';
import type { FilteredMatch } from '../types';
import { useFollowedTeams } from '../hooks/useFollowedTeams';

interface MyTeamsSelectorProps {
  matches: FilteredMatch[];
}

/**
 * Component for selecting and managing followed teams
 */
export const MyTeamsSelector = ({ matches }: MyTeamsSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { followedTeams, followTeam, unfollowTeam, isFollowing, setTeamColor, getTeamColor, reorderTeams } = useFollowedTeams();

  // Get unique teams from matches
  const availableTeams = useMemo(() => {
    const teamMap = new Map<string, string>();
    matches.forEach(match => {
      const teamId = match.FirstTeamText || match.SecondTeamText;
      if (teamId && !teamMap.has(teamId)) {
        teamMap.set(teamId, teamId);
      }
    });
    return Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }));
  }, [matches]);

  // Available colors for team customization
  const AVAILABLE_COLORS = [
    '#eab308', // Gold
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ];

  const handleTeamToggle = (teamId: string, teamName: string) => {
    if (isFollowing(teamId)) {
      unfollowTeam(teamId);
    } else {
      followTeam(teamId, teamName);
    }
  };

  const handleColorChange = (teamId: string, color: string) => {
    setTeamColor(teamId, color);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463] hover:border-[#eab308] transition-colors"
      >
        My Teams ({followedTeams.length})
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-[#3b3c48] border border-[#454654] rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#f8f8f9]">Followed Teams</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Followed Teams List */}
              {followedTeams.length > 0 && (
                <div className="mb-4 space-y-2">
                  {followedTeams.map((team, index) => (
                    <div
                      key={team.teamId}
                      className="flex items-center gap-2 px-3 py-2 rounded bg-[#454654] border border-[#525463]"
                    >
                      {/* Color Picker */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {AVAILABLE_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(team.teamId, color)}
                            className={`w-4 h-4 rounded border-2 transition-all ${
                              getTeamColor(team.teamId) === color
                                ? 'border-white scale-110'
                                : 'border-[#525463] hover:border-[#9fa2ab]'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>

                      {/* Team Name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#f8f8f9] truncate">
                          {team.teamName}
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex-shrink-0 flex flex-col gap-0.5">
                        {index > 0 && (
                          <button
                            onClick={() => reorderTeams(team.teamId, 'up')}
                            className="text-[#9fa2ab] hover:text-[#f8f8f9] text-xs"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index === 0 && (
                          <button
                            onClick={() => reorderTeams(team.teamId, 'top')}
                            className="text-[#eab308] hover:text-[#facc15] text-xs"
                            title="Pinned"
                          >
                            📌
                          </button>
                        )}
                        {index < followedTeams.length - 1 && (
                          <button
                            onClick={() => reorderTeams(team.teamId, 'down')}
                            className="text-[#9fa2ab] hover:text-[#f8f8f9] text-xs"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                      </div>

                      {/* Unfollow Button */}
                      <button
                        onClick={() => handleTeamToggle(team.teamId, team.teamName)}
                        className="flex-shrink-0 text-[#9fa2ab] hover:text-red-400 transition-colors"
                        title="Unfollow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Teams */}
              <div className="border-t border-[#454654] pt-3">
                <h4 className="text-xs font-medium text-[#9fa2ab] mb-2 uppercase tracking-wider">
                  Available Teams
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableTeams
                    .filter(team => !isFollowing(team.id))
                    .map(team => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamToggle(team.id, team.name)}
                        className="w-full px-3 py-2 text-left text-sm text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654] rounded transition-colors"
                      >
                        + {team.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

