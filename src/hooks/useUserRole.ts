import { useState, useEffect, useCallback } from 'react';

export type UserRole = 'media' | 'spectator' | 'coach';

const STORAGE_KEY = 'userRole';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>('media');

  // Load role from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['media', 'spectator', 'coach'].includes(stored)) {
        setRole(stored as UserRole);
      }
    } catch (error) {
      console.error('Failed to load user role:', error);
    }
  }, []);

  // Save role to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch (error) {
      console.error('Failed to save user role:', error);
    }
  }, [role]);

  const setUserRole = useCallback((newRole: UserRole) => {
    setRole(newRole);
  }, []);

  return {
    role,
    setRole: setUserRole,
    isMedia: role === 'media',
    isSpectator: role === 'spectator',
    isCoach: role === 'coach',
  };
};

