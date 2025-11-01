import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import type { FilteredMatch } from '$lib/types';
import { buildBallerTVEventUrl, fetchBallerTVEventScores } from '$lib/services/ballertvEvent';
import { convertBallerTVSetsToSetScores } from '$lib/services/ballertv';
import type { createMatchClaiming } from './matchClaiming';
import { getTeamDelay, removeTeamDelay, setAutoTeamDelay, getTeamDelayEntry } from './teamDelays';
import { getTeamIdentifier } from '../stores/filters';
import { tournamentDelay } from './tournamentDelay';
import { matchesStore } from './matches';

interface BallerTVScoreSyncOptions {
  eventId: string;
  eventName: string;
  matches: FilteredMatch[];
  matchClaiming: ReturnType<typeof createMatchClaiming>;
  clubFilter?: string; // Default: '630'
  tournamentDelayMinutes?: number; // Tournament delay in minutes (default: 0)
}

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds

/**
 * Create a BallerTV score sync service that polls event page for all live matches
 */
export function createBallerTVScoreSync({
  eventId,
  eventName,
  matches,
  matchClaiming,
  clubFilter = '630',
  tournamentDelayMinutes = 0
}: BallerTVScoreSyncOptions) {
  const { subscribe, set, update } = writable<Map<number, { lastPollTime: number; errorCount: number }>>(new Map());
  
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let isPolling = false;
  let currentMatches = matches;
  let currentEventName = eventName;
  let currentDelayMinutes = tournamentDelayMinutes;
  
  // Build event URL dynamically
  function getEventUrl(): string | null {
    if (!currentEventName) return null;
    return buildBallerTVEventUrl(currentEventName, clubFilter);
  }

  // Get delay for a match (team-specific or global)
  function getDelayForMatch(match: FilteredMatch): number {
    const teamId = getTeamIdentifier(match);
    const teamDelay = teamId ? getTeamDelay(teamId, match.ScheduledStartDateTime) : null;
    const globalDelay = get(tournamentDelay);
    
    // Use team-specific delay if set, otherwise global delay
    return teamDelay !== null ? teamDelay : currentDelayMinutes;
  }

  // Poll event page for all live match scores
  async function pollEventPage(): Promise<void> {
    if (!browser || isPolling) return;
    
    isPolling = true;
    
    try {
      const now = Date.now();
      
      // Get live matches (matches currently in progress, accounting for team-specific or global delay)
      // A match is considered live if the current time has passed the adjusted start time (start + delay)
      // AND the current time hasn't passed the end time
      const liveMatches = currentMatches.filter(match => {
        const delay = getDelayForMatch(match);
        const delayMs = delay * 60 * 1000;
        const adjustedStartTime = match.ScheduledStartDateTime + delayMs;
        return now >= adjustedStartTime && now <= match.ScheduledEndDateTime;
      });
      
      if (liveMatches.length === 0) {
        return; // No live matches, skip silently
      }
      
      const eventUrl = getEventUrl();
      if (!eventUrl) {
        return; // No event name, skip silently
      }
      
      // Fetch event page HTML
      const eventMatchData = await fetchBallerTVEventScores(eventUrl, liveMatches);
      
      if (eventMatchData.size === 0) {
        console.log(`⚠️ BallerTV: No matches found in event page (checking ${liveMatches.length} expected live match[es])`);
        return;
      }
      
      console.log(`✅ BallerTV: Found ${eventMatchData.size} of ${liveMatches.length} expected live match(es)`);
      
      // Find matches that should be live (based on scheduled time) but weren't found in BallerTV
      // These are matches that have passed their scheduled start time but aren't showing as live
      const foundMatchIds = new Set(eventMatchData.keys());
      
      // Get matches that should be live based on scheduled time (not accounting for delays)
      const scheduledLiveMatches = currentMatches.filter(match => {
        return now >= match.ScheduledStartDateTime && now <= match.ScheduledEndDateTime;
      });
      
      const missingMatches = scheduledLiveMatches.filter(match => !foundMatchIds.has(match.MatchId));
      
      if (missingMatches.length > 0) {
        console.log(`⏱️ BallerTV: ${missingMatches.length} match(es) scheduled as live but not found → detecting delays`);
        
        missingMatches.forEach(match => {
          const teamId = getTeamIdentifier(match);
          if (!teamId) return;
          
          // Check if there's already a manual delay set - don't override it
          const existingDelayEntry = getTeamDelayEntry(teamId, match.ScheduledStartDateTime);
          if (existingDelayEntry && existingDelayEntry.source === 'manual') {
            return; // Skip silently if manual delay exists
          }
          
          // Calculate delay: how many minutes have passed since scheduled start?
          const scheduledStart = match.ScheduledStartDateTime;
          const timeElapsedMs = now - scheduledStart;
          
          if (timeElapsedMs > 0) {
            // Round up to nearest 15 minutes
            const delayMinutes = Math.ceil(timeElapsedMs / (15 * 60 * 1000)) * 15;
            
            // Only set delay if it's significant (at least 15 minutes)
            if (delayMinutes >= 15) {
              const elapsedMins = Math.round(timeElapsedMs / 60000);
              console.log(`   🔄 Auto-delay: ${teamId} → ${delayMinutes}min (${elapsedMins}min elapsed)`);
              setAutoTeamDelay(teamId, match.ScheduledStartDateTime, delayMinutes);
            }
          }
        });
      }
      
      // Update scores for all matches found
      eventMatchData.forEach((ballerTVMatch, matchId) => {
        const ourMatch = liveMatches.find(m => m.MatchId === matchId);
        if (!ourMatch) return;
        
        // If BallerTV shows this match as live, reset any team-specific delay
        if (ballerTVMatch.status === 'in-progress' && ballerTVMatch.actualStartTime) {
          const teamId = getTeamIdentifier(ourMatch);
          if (teamId) {
            const currentDelay = getTeamDelay(teamId, ourMatch.ScheduledStartDateTime);
            if (currentDelay !== null && currentDelay > 0) {
              console.log(`🔄 Live match detected: ${teamId} → delay reset`);
              removeTeamDelay(teamId, ourMatch.ScheduledStartDateTime);
            }
          }
        }
        
        // Convert sets to our format
        const sets = convertBallerTVSetsToSetScores(
          ballerTVMatch.sets.map((set, index) => ({
            FirstTeamScore: set.team1Score,
            SecondTeamScore: set.team2Score,
            setNumber: set.setNumber,
            completed: set.completedAt > 0
          })),
          ballerTVMatch.sets.findIndex(set => set.completedAt === 0)
        );
        
        // Update score in matchClaiming store
        matchClaiming.updateScore(matchId, sets, ballerTVMatch.status, 'ballertv');
        
        // Store actual start time in match if available
        if (ballerTVMatch.actualStartTime) {
          // Update the match in the store
          const currentMatchesFromStore = get(matchesStore);
          const matchIndex = currentMatchesFromStore.findIndex(m => m.MatchId === matchId);
          if (matchIndex !== -1) {
            const updatedMatches = [...currentMatchesFromStore];
            updatedMatches[matchIndex] = {
              ...updatedMatches[matchIndex],
              BallerTVActualStartTime: ballerTVMatch.actualStartTime
            };
            matchesStore.set(updatedMatches);
            
            // Also update local copy
            const localMatchIndex = currentMatches.findIndex(m => m.MatchId === matchId);
            if (localMatchIndex !== -1) {
              currentMatches[localMatchIndex] = {
                ...currentMatches[localMatchIndex],
                BallerTVActualStartTime: ballerTVMatch.actualStartTime
              };
            }
          }
        }
        
        // Log match update in a concise format
        const setsStr = sets.length > 0 
          ? sets.map(s => `${s.team1Score}-${s.team2Score}`).join(', ')
          : 'no scores';
        const startTimeStr = ballerTVMatch.actualStartTime
          ? ` (started ${new Date(ballerTVMatch.actualStartTime).toLocaleTimeString()})`
          : '';
        console.log(`   ✓ ${ourMatch.FirstTeamText} vs ${ourMatch.SecondTeamText}: ${ballerTVMatch.status} | ${setsStr}${startTimeStr}`);
        
        // Update poll time
        update(current => {
          const next = new Map(current);
          next.set(matchId, {
            lastPollTime: Date.now(),
            errorCount: 0
          });
          return next;
        });
      });
      
    } catch (error) {
      console.error(`Error polling BallerTV event page:`, error);
    } finally {
      isPolling = false;
    }
  }

  function startPolling() {
    if (!browser || pollInterval) return;
    
    // Initial poll
    pollEventPage();
    
    // Set up interval
    pollInterval = setInterval(() => {
      pollEventPage();
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  return {
    subscribe,
    startPolling,
    stopPolling,
    refresh: pollEventPage,
    updateMatches: (newMatches: FilteredMatch[]) => {
      currentMatches = newMatches;
    },
    updateEventName: (newEventName: string) => {
      currentEventName = newEventName;
    },
    updateDelay: (delayMinutes: number) => {
      currentDelayMinutes = delayMinutes;
    }
  };
}

