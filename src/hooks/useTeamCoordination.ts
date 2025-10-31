import { useState, useEffect, useCallback } from 'react';
import type { CoverageStatus } from './useCoverageStatus';

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface TeamAssignment {
  teamId: string;
  memberId: string;
  assignedAt: number;
}

const STORAGE_KEY_MEMBERS = 'teamMembers';
const STORAGE_KEY_ASSIGNMENTS = 'teamAssignments';

export const useTeamCoordination = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map()); // teamId -> memberId
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  // Available colors for team members
  const AVAILABLE_COLORS = [
    '#eab308', // Gold
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Red-Orange
  ];

  // Load members and assignments from localStorage on mount
  useEffect(() => {
    try {
      const storedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (storedMembers) {
        const parsed = JSON.parse(storedMembers);
        setMembers(parsed);
        
        // Set current member to first member if available
        if (parsed.length > 0 && !currentMemberId) {
          setCurrentMemberId(parsed[0].id);
        }
      } else {
        // Create default "You" member if none exist
        const defaultMember: TeamMember = {
          id: 'you',
          name: 'You',
          color: AVAILABLE_COLORS[0],
          createdAt: Date.now(),
        };
        setMembers([defaultMember]);
        setCurrentMemberId('you');
      }

      const storedAssignments = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (storedAssignments) {
        const parsed = JSON.parse(storedAssignments);
        setAssignments(new Map(Object.entries(parsed)));
      }
    } catch (error) {
      console.error('Failed to load team coordination data:', error);
    }
  }, []);

  // Save members to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    } catch (error) {
      console.error('Failed to save team members:', error);
    }
  }, [members]);

  // Save assignments to localStorage whenever they change
  useEffect(() => {
    try {
      const assignmentsObj = Object.fromEntries(assignments);
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignmentsObj));
    } catch (error) {
      console.error('Failed to save team assignments:', error);
    }
  }, [assignments]);

  const addMember = useCallback((name: string) => {
    const usedColors = new Set(members.map(m => m.color));
    const availableColor = AVAILABLE_COLORS.find(c => !usedColors.has(c)) || AVAILABLE_COLORS[0];
    
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name,
      color: availableColor,
      createdAt: Date.now(),
    };
    
    setMembers(prev => [...prev, newMember]);
    setCurrentMemberId(newMember.id);
    
    return newMember.id;
  }, [members]);

  const removeMember = useCallback((memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    
    // Remove assignments for this member
    setAssignments(prev => {
      const next = new Map(prev);
      Array.from(next.entries()).forEach(([teamId, assignedMemberId]) => {
        if (assignedMemberId === memberId) {
          next.delete(teamId);
        }
      });
      return next;
    });
    
    // Switch to first available member if current member was removed
    if (currentMemberId === memberId) {
      setMembers(prev => {
        if (prev.length > 0) {
          setCurrentMemberId(prev[0].id);
        }
        return prev;
      });
    }
  }, [currentMemberId]);

  const updateMember = useCallback((memberId: string, updates: Partial<TeamMember>) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, ...updates } : m
    ));
  }, []);

  const assignTeam = useCallback((teamId: string, memberId: string) => {
    setAssignments(prev => new Map(prev).set(teamId, memberId));
  }, []);

  const unassignTeam = useCallback((teamId: string) => {
    setAssignments(prev => {
      const next = new Map(prev);
      next.delete(teamId);
      return next;
    });
  }, []);

  const getTeamAssignment = useCallback((teamId: string): string | null => {
    return assignments.get(teamId) || null;
  }, [assignments]);

  const getMember = useCallback((memberId: string): TeamMember | null => {
    return members.find(m => m.id === memberId) || null;
  }, [members]);

  const getCurrentMember = useCallback((): TeamMember | null => {
    if (!currentMemberId) return null;
    return getMember(currentMemberId);
  }, [currentMemberId, getMember]);

  // Export coverage status for sharing
  const exportCoverageStatus = useCallback((
    coverageStatus: Map<string, CoverageStatus>,
    memberId?: string
  ): string => {
    const memberToExport = memberId || currentMemberId;
    if (!memberToExport) return JSON.stringify({});

    const member = getMember(memberToExport);
    const memberAssignments = Array.from(assignments.entries())
      .filter(([_, assignedMemberId]) => assignedMemberId === memberToExport)
      .map(([teamId]) => teamId);

    const memberCoverageStatus: Record<string, CoverageStatus> = {};
    Array.from(coverageStatus.entries()).forEach(([teamId, status]) => {
      if (memberAssignments.includes(teamId)) {
        memberCoverageStatus[teamId] = status;
      }
    });

    const data = {
      memberId: memberToExport,
      memberName: member?.name || 'Unknown',
      exportedAt: new Date().toISOString(),
      assignments: memberAssignments.map(teamId => ({ teamId })),
      coverageStatus: memberCoverageStatus,
    };

    return JSON.stringify(data, null, 2);
  }, [assignments, currentMemberId, getMember]);

  // Import coverage status from JSON
  const importCoverageStatus = useCallback((
    jsonData: string,
    mergeStrategy: 'replace' | 'merge' = 'merge'
  ): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.coverageStatus || !data.memberId) {
        return { success: false, error: 'Invalid data format: missing coverageStatus or memberId' };
      }

      // Merge assignments if needed
      if (mergeStrategy === 'merge' && data.assignments) {
        const newAssignments = new Map(assignments);
        data.assignments.forEach((assignment: { teamId: string }) => {
          newAssignments.set(assignment.teamId, data.memberId);
        });
        setAssignments(newAssignments);
      }

      // Import coverage status - this would need to be integrated with useCoverageStatus
      // For now, we'll return success and the caller can handle the status import
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [assignments]);

  // Merge coverage statuses from multiple members
  const mergeCoverageStatuses = useCallback((
    statuses: Array<{ memberId: string; coverageStatus: Record<string, CoverageStatus> }>
  ): Map<string, CoverageStatus> => {
    const merged = new Map<string, CoverageStatus>();
    
    statuses.forEach(({ coverageStatus }) => {
      Object.entries(coverageStatus).forEach(([teamId, status]) => {
        // If team already has status, prefer 'covered' > 'partially-covered' > 'planned' > 'not-covered'
        const currentStatus = merged.get(teamId);
        if (!currentStatus) {
          merged.set(teamId, status);
        } else {
          const priority: Record<CoverageStatus, number> = {
            'covered': 3,
            'partially-covered': 2,
            'planned': 1,
            'not-covered': 0,
          };
          if (priority[status] > priority[currentStatus]) {
            merged.set(teamId, status);
          }
        }
      });
    });
    
    return merged;
  }, []);

  return {
    members,
    assignments,
    currentMemberId,
    setCurrentMemberId,
    addMember,
    removeMember,
    updateMember,
    assignTeam,
    unassignTeam,
    getTeamAssignment,
    getMember,
    getCurrentMember,
    exportCoverageStatus,
    importCoverageStatus,
    mergeCoverageStatuses,
  };
};

