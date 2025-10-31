import { useState, useEffect, useCallback } from 'react';

export type CoverageStatus = 'not-covered' | 'covered' | 'partially-covered' | 'planned';

const STORAGE_KEY = 'teamCoverageStatus';

export interface TeamCoverageStatus {
  [teamId: string]: CoverageStatus;
}

export const useCoverageStatus = () => {
  const [coverageStatus, setCoverageStatus] = useState<TeamCoverageStatus>({});

  // Load coverage status from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCoverageStatus(parsed);
      }
    } catch (error) {
      console.error('Failed to load coverage status:', error);
    }
  }, []);

  // Save coverage status to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(coverageStatus).length === 0) {
      // Don't save empty object
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coverageStatus));
    } catch (error) {
      console.error('Failed to save coverage status:', error);
    }
  }, [coverageStatus]);

  const setTeamStatus = useCallback((teamId: string, status: CoverageStatus) => {
    setCoverageStatus(prev => {
      if (status === 'not-covered') {
        // Remove entry if setting back to default
        const next = { ...prev };
        delete next[teamId];
        return next;
      }
      return { ...prev, [teamId]: status };
    });
  }, []);

  const getTeamStatus = useCallback((teamId: string): CoverageStatus => {
    return coverageStatus[teamId] || 'not-covered';
  }, [coverageStatus]);

  const clearAllStatus = useCallback(() => {
    setCoverageStatus({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Auto-update status based on coverage plan
  const updateFromPlan = useCallback((teamId: string, matchesInPlan: number, totalMatches: number) => {
    if (totalMatches === 0) return;
    
    // Determine what status should be
    let newStatus: CoverageStatus;
    if (matchesInPlan === 0) {
      newStatus = 'not-covered';
    } else if (matchesInPlan === totalMatches) {
      newStatus = 'covered';
    } else {
      newStatus = 'partially-covered';
    }
    
    // Only update if status would change
    const currentStatus = coverageStatus[teamId] || 'not-covered';
    if (currentStatus !== newStatus) {
      setTeamStatus(teamId, newStatus);
    }
  }, [coverageStatus, setTeamStatus]);

  return {
    coverageStatus,
    setTeamStatus,
    getTeamStatus,
    clearAllStatus,
    updateFromPlan,
  };
};

