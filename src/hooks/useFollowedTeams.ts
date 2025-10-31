import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_FOLLOWED_TEAMS = 'followedTeams';
const STORAGE_KEY_TEAM_COLORS = 'teamColors';

export interface FollowedTeam {
  teamId: string;
  teamName: string;
  followedAt: number;
  color?: string;
}

/**
 * Hook for managing followed teams (My Teams functionality)
 */
export const useFollowedTeams = () => {
  const [followedTeams, setFollowedTeams] = useState<FollowedTeam[]>([]);
  const [teamColors, setTeamColors] = useState<Map<string, string>>(new Map());

  // Load followed teams from localStorage
  useEffect(() => {
    try {
      const followedData = localStorage.getItem(STORAGE_KEY_FOLLOWED_TEAMS);
      if (followedData) {
        setFollowedTeams(JSON.parse(followedData));
      }
    } catch (error) {
      console.error('Failed to load followed teams:', error);
    }

    try {
      const colorsData = localStorage.getItem(STORAGE_KEY_TEAM_COLORS);
      if (colorsData) {
        const parsed = JSON.parse(colorsData) as Record<string, string>;
        setTeamColors(new Map(Object.entries(parsed)));
      }
    } catch (error) {
      console.error('Failed to load team colors:', error);
    }
  }, []);

  // Save followed teams to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLLOWED_TEAMS, JSON.stringify(followedTeams));
    } catch (error) {
      console.error('Failed to save followed teams:', error);
    }
  }, [followedTeams]);

  // Save team colors to localStorage
  useEffect(() => {
    try {
      const colorsObj: Record<string, string> = {};
      teamColors.forEach((color, teamId) => {
        colorsObj[teamId] = color;
      });
      localStorage.setItem(STORAGE_KEY_TEAM_COLORS, JSON.stringify(colorsObj));
    } catch (error) {
      console.error('Failed to save team colors:', error);
    }
  }, [teamColors]);

  // Follow a team
  const followTeam = useCallback((teamId: string, teamName: string) => {
    setFollowedTeams(prev => {
      if (prev.some(t => t.teamId === teamId)) {
        return prev; // Already following
      }
      return [...prev, { teamId, teamName, followedAt: Date.now() }];
    });
  }, []);

  // Unfollow a team
  const unfollowTeam = useCallback((teamId: string) => {
    setFollowedTeams(prev => prev.filter(t => t.teamId !== teamId));
    // Also remove color if set
    setTeamColors(prev => {
      const next = new Map(prev);
      next.delete(teamId);
      return next;
    });
  }, []);

  // Check if team is followed
  const isFollowing = useCallback((teamId: string): boolean => {
    return followedTeams.some(t => t.teamId === teamId);
  }, [followedTeams]);

  // Set team color
  const setTeamColor = useCallback((teamId: string, color: string) => {
    setTeamColors(prev => {
      const next = new Map(prev);
      next.set(teamId, color);
      return next;
    });
  }, []);

  // Get team color
  const getTeamColor = useCallback((teamId: string): string | null => {
    return teamColors.get(teamId) || null;
  }, [teamColors]);

  // Reorder teams (pin to top)
  const reorderTeams = useCallback((teamId: string, direction: 'up' | 'down' | 'top') => {
    setFollowedTeams(prev => {
      const index = prev.findIndex(t => t.teamId === teamId);
      if (index === -1) return prev;

      const newTeams = [...prev];
      const team = newTeams[index];

      if (direction === 'top') {
        newTeams.splice(index, 1);
        newTeams.unshift(team);
      } else if (direction === 'up' && index > 0) {
        [newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];
      } else if (direction === 'down' && index < newTeams.length - 1) {
        [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
      }

      return newTeams;
    });
  }, []);

  return {
    followedTeams,
    followTeam,
    unfollowTeam,
    isFollowing,
    setTeamColor,
    getTeamColor,
    reorderTeams,
  };
};

