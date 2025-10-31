import { useState, useEffect, useCallback } from 'react';

export interface CoveragePlan {
  selectedMatches: number[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'coveragePlan';

export const useCoveragePlan = () => {
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const plan: CoveragePlan = JSON.parse(stored);
        setSelectedMatches(new Set(plan.selectedMatches));
      }
    } catch (error) {
      console.error('Failed to load coverage plan:', error);
    }
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    try {
      const plan: CoveragePlan = {
        selectedMatches: Array.from(selectedMatches),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch (error) {
      console.error('Failed to save coverage plan:', error);
    }
  }, [selectedMatches]);

  const toggleMatch = useCallback((matchId: number) => {
    setSelectedMatches(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  }, []);

  const selectMatch = useCallback((matchId: number) => {
    setSelectedMatches(prev => new Set(prev).add(matchId));
  }, []);

  const deselectMatch = useCallback((matchId: number) => {
    setSelectedMatches(prev => {
      const next = new Set(prev);
      next.delete(matchId);
      return next;
    });
  }, []);

  const clearPlan = useCallback(() => {
    setSelectedMatches(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isSelected = useCallback((matchId: number) => {
    return selectedMatches.has(matchId);
  }, [selectedMatches]);

  const getSelectedCount = useCallback(() => {
    return selectedMatches.size;
  }, [selectedMatches]);

  return {
    selectedMatches,
    toggleMatch,
    selectMatch,
    deselectMatch,
    clearPlan,
    isSelected,
    getSelectedCount,
  };
};

