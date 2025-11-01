export interface ClaimHistoryEntry {
  matchId: number;
  eventId: string;
  action: 'claimed' | 'released' | 'transferred';
  userId: string;
  timestamp: number;
  transferredTo?: string; // Only present for 'transferred' action
}

const STORAGE_KEY = 'claimHistory';
const MAX_HISTORY_ENTRIES = 1000; // Limit history to prevent localStorage bloat

/**
 * Add a claim history entry
 */
export function addClaimHistory(entry: ClaimHistoryEntry): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const history: ClaimHistoryEntry[] = stored ? JSON.parse(stored) : [];
    
    // Add new entry at the beginning
    history.unshift(entry);
    
    // Keep only the most recent entries
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(MAX_HISTORY_ENTRIES);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save claim history:', error);
  }
}

/**
 * Get claim history for a specific match
 */
export function getClaimHistory(matchId: number, eventId: string): ClaimHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: ClaimHistoryEntry[] = JSON.parse(stored);
    return history.filter(entry => 
      entry.matchId === matchId && entry.eventId === eventId
    ).sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error('Failed to load claim history:', error);
    return [];
  }
}

/**
 * Get all claim history for an event
 */
export function getEventClaimHistory(eventId: string): ClaimHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: ClaimHistoryEntry[] = JSON.parse(stored);
    return history.filter(entry => entry.eventId === eventId)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error('Failed to load claim history:', error);
    return [];
  }
}

/**
 * Get all claim history
 */
export function getAllClaimHistory(): ClaimHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: ClaimHistoryEntry[] = JSON.parse(stored);
    return history.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error('Failed to load claim history:', error);
    return [];
  }
}

/**
 * Clear claim history for a specific event
 */
export function clearEventClaimHistory(eventId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const history: ClaimHistoryEntry[] = JSON.parse(stored);
    const filtered = history.filter(entry => entry.eventId !== eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to clear claim history:', error);
  }
}

/**
 * Clear all claim history
 */
export function clearAllClaimHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear claim history:', error);
  }
}

