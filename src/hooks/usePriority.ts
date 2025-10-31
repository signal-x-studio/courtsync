import { useState, useEffect, useCallback } from 'react';

export type Priority = 'must-cover' | 'priority' | 'optional' | null;

const STORAGE_KEY = 'matchPriorities';

export interface MatchPriorities {
  [matchId: number]: Priority;
}

export const usePriority = () => {
  const [priorities, setPriorities] = useState<MatchPriorities>({});

  // Load priorities from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPriorities(parsed);
      }
    } catch (error) {
      console.error('Failed to load priorities:', error);
    }
  }, []);

  // Save priorities to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(priorities));
    } catch (error) {
      console.error('Failed to save priorities:', error);
    }
  }, [priorities]);

  const setPriority = useCallback((matchId: number, priority: Priority) => {
    setPriorities(prev => {
      if (priority === null) {
        const next = { ...prev };
        delete next[matchId];
        return next;
      }
      return { ...prev, [matchId]: priority };
    });
  }, []);

  const getPriority = useCallback((matchId: number): Priority => {
    return priorities[matchId] || null;
  }, [priorities]);

  const clearAllPriorities = useCallback(() => {
    setPriorities({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    priorities,
    setPriority,
    getPriority,
    clearAllPriorities,
  };
};

