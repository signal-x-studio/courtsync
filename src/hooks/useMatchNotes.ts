import { useState, useEffect, useCallback } from 'react';

export interface MatchNote {
  matchId: number;
  eventId: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'matchNotes';

interface UseMatchNotesOptions {
  eventId: string;
}

export const useMatchNotes = ({ eventId }: UseMatchNotesOptions) => {
  const [notes, setNotes] = useState<Map<number, MatchNote>>(new Map());

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, MatchNote>;
        const notesMap = new Map<number, MatchNote>();
        Object.values(parsed).forEach(note => {
          // Only load notes for current event
          if (note.eventId === eventId) {
            notesMap.set(note.matchId, note);
          }
        });
        setNotes(notesMap);
      }
    } catch (error) {
      console.error('Failed to load match notes:', error);
    }
  }, [eventId]);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    try {
      // Load existing notes from other events
      const existing = localStorage.getItem(STORAGE_KEY);
      const allNotes: Record<string, MatchNote> = existing ? JSON.parse(existing) : {};
      
      // Update notes for current event
      notes.forEach(note => {
        allNotes[`${eventId}-${note.matchId}`] = note;
      });
      
      // Remove notes for current event that are no longer in state
      Object.keys(allNotes).forEach(key => {
        if (key.startsWith(`${eventId}-`)) {
          const matchId = parseInt(key.split('-').pop() || '0');
          if (!notes.has(matchId)) {
            delete allNotes[key];
          }
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));
    } catch (error) {
      console.error('Failed to save match notes:', error);
    }
  }, [notes, eventId]);

  const setNote = useCallback((matchId: number, note: string) => {
    const now = Date.now();
    setNotes(prev => {
      const next = new Map(prev);
      const existing = next.get(matchId);
      
      if (note.trim()) {
        next.set(matchId, {
          matchId,
          eventId,
          note: note.trim(),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        });
      } else {
        // Remove note if empty
        next.delete(matchId);
      }
      
      return next;
    });
  }, [eventId]);

  const getNote = useCallback((matchId: number): string => {
    return notes.get(matchId)?.note || '';
  }, [notes]);

  const deleteNote = useCallback((matchId: number) => {
    setNotes(prev => {
      const next = new Map(prev);
      next.delete(matchId);
      return next;
    });
  }, []);

  const hasNote = useCallback((matchId: number): boolean => {
    const note = notes.get(matchId);
    return note !== undefined && note.note.trim().length > 0;
  }, [notes]);

  return {
    setNote,
    getNote,
    deleteNote,
    hasNote,
  };
};

