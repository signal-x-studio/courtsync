import { useState, useEffect, useCallback } from 'react';
import type { FilteredMatch } from '../types';

export interface FilterState {
  division: string | null;
  wave: 'all' | 'morning' | 'afternoon';
  teams: string[]; // Team identifiers (e.g., ["16-1", "17-1"])
  timeRange: {
    start: string | null; // HH:mm format
    end: string | null; // HH:mm format
  };
  conflictsOnly: boolean;
  coverageStatus: 'all' | 'covered' | 'uncovered' | 'planned';
  priority: 'all' | 'must-cover' | 'priority' | 'optional' | null;
}

const DEFAULT_FILTERS: FilterState = {
  division: null,
  wave: 'all',
  teams: [],
  timeRange: {
    start: null,
    end: null,
  },
  conflictsOnly: false,
  coverageStatus: 'all',
  priority: 'all',
};

const STORAGE_KEY = 'matchFilters';

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const savedFilters = JSON.parse(stored);
        setFilters({ ...DEFAULT_FILTERS, ...savedFilters });
      }
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }, [filters]);

  // Extract team identifier from match
  const getTeamIdentifier = useCallback((match: FilteredMatch): string => {
    const teamText = match.InvolvedTeam === 'first' 
      ? match.FirstTeamText 
      : match.SecondTeamText;
    const matchResult = teamText.match(/(\d+-\d+)/);
    return matchResult ? matchResult[1] : '';
  }, []);

  // Apply filters to matches
  const applyFilters = useCallback((matches: FilteredMatch[]): FilteredMatch[] => {
    return matches.filter(match => {
      // Division filter
      if (filters.division && match.Division.CodeAlias !== filters.division) {
        return false;
      }

      // Wave filter (morning = before 2:30 PM, afternoon = 2:30 PM or later)
      if (filters.wave !== 'all') {
        const startTime = new Date(match.ScheduledStartDateTime).getTime();
        const startDate = new Date(startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        const afternoonStartMinutes = 14 * 60 + 30; // 2:30 PM = 14:30
        
        if (filters.wave === 'morning' && totalMinutes >= afternoonStartMinutes) {
          return false;
        }
        if (filters.wave === 'afternoon' && totalMinutes < afternoonStartMinutes) {
          return false;
        }
      }

      // Team filter
      if (filters.teams.length > 0) {
        const teamId = getTeamIdentifier(match);
        if (!teamId || !filters.teams.includes(teamId)) {
          return false;
        }
      }

      // Time range filter
      if (filters.timeRange.start || filters.timeRange.end) {
        const startTime = new Date(match.ScheduledStartDateTime).getTime();
        const startDate = new Date(startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        const matchTimeMinutes = hours * 60 + minutes;

        if (filters.timeRange.start) {
          const [startH, startM] = filters.timeRange.start.split(':').map(Number);
          const startFilterMinutes = startH * 60 + startM;
          if (matchTimeMinutes < startFilterMinutes) {
            return false;
          }
        }

        if (filters.timeRange.end) {
          const [endH, endM] = filters.timeRange.end.split(':').map(Number);
          const endFilterMinutes = endH * 60 + endM;
          if (matchTimeMinutes > endFilterMinutes) {
            return false;
          }
        }
      }

      // Conflicts only filter (will be handled by caller with conflicts map)
      // Coverage status filter (will be handled by caller with coverage status)

      return true;
    });
  }, [filters, getTeamIdentifier]);

  // Get unique divisions from matches
  const getUniqueDivisions = useCallback((matches: FilteredMatch[]): string[] => {
    const divSet = new Set(matches.map(m => m.Division.CodeAlias));
    return Array.from(divSet).sort();
  }, []);

  // Get unique divisions filtered by wave (for division dropdown)
  const getFilteredDivisions = useCallback((matches: FilteredMatch[], waveFilter: 'all' | 'morning' | 'afternoon'): string[] => {
    let filtered = matches;
    
    // Apply wave filter to determine which divisions are available
    if (waveFilter !== 'all') {
      filtered = filtered.filter(m => {
        const startTime = new Date(m.ScheduledStartDateTime).getTime();
        const startDate = new Date(startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        const afternoonStartMinutes = 14 * 60 + 30; // 2:30 PM = 14:30
        
        if (waveFilter === 'morning') {
          return totalMinutes < afternoonStartMinutes;
        } else {
          return totalMinutes >= afternoonStartMinutes;
        }
      });
    }
    
    const divSet = new Set(filtered.map(m => m.Division.CodeAlias));
    return Array.from(divSet).sort();
  }, []);

  // Get unique teams from matches
  const getUniqueTeams = useCallback((matches: FilteredMatch[]): string[] => {
    const teamSet = new Set<string>();
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (teamId) {
        teamSet.add(teamId);
      }
    });
    return Array.from(teamSet).sort();
  }, [getTeamIdentifier]);

  // Update filter
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Set time range preset
  const setTimeRangePreset = useCallback((preset: 'morning' | 'afternoon' | 'custom') => {
    if (preset === 'morning') {
      setFilters(prev => ({
        ...prev,
        timeRange: { start: '08:00', end: '14:30' },
      }));
    } else if (preset === 'afternoon') {
      setFilters(prev => ({
        ...prev,
        timeRange: { start: '14:30', end: '23:59' },
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        timeRange: { start: null, end: null },
      }));
    }
  }, []);

  return {
    filters,
    applyFilters,
    updateFilter,
    resetFilters,
    setTimeRangePreset,
    getUniqueDivisions,
    getFilteredDivisions,
    getUniqueTeams,
    getTeamIdentifier,
  };
};

