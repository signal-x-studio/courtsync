import { useState, useEffect, useCallback } from 'react';
import type { MatchClaim, MatchScore, SetScore } from '../types';
import { broadcastScoreUpdate } from '../utils/scoreSync';
import { addScoreHistory } from '../utils/scoreStats';

const STORAGE_KEY_CLAIMS = 'matchClaims';
const STORAGE_KEY_SCORES = 'matchScores';
const CLAIM_EXPIRATION_BUFFER_MS = 30 * 60 * 1000; // 30 minutes after match ends

interface UseMatchClaimingOptions {
  eventId: string;
  userId?: string;
}

export const useMatchClaiming = ({ eventId, userId = 'anonymous' }: UseMatchClaimingOptions) => {
  const [claims, setClaims] = useState<Map<number, MatchClaim>>(new Map());
  const [scores, setScores] = useState<Map<number, MatchScore>>(new Map());

  // Load claims and scores from localStorage on mount
  useEffect(() => {
    try {
      const claimsData = localStorage.getItem(STORAGE_KEY_CLAIMS);
      if (claimsData) {
        const parsed = JSON.parse(claimsData) as Record<string, MatchClaim>;
        const claimsMap = new Map<number, MatchClaim>();
        Object.values(parsed).forEach(claim => {
          // Only load claims for current event and non-expired claims
          if (claim.eventId === eventId && claim.expiresAt > Date.now()) {
            claimsMap.set(claim.matchId, claim);
          }
        });
        setClaims(claimsMap);
      }
    } catch (error) {
      console.error('Failed to load claims:', error);
    }

    try {
      const scoresData = localStorage.getItem(STORAGE_KEY_SCORES);
      if (scoresData) {
        const parsed = JSON.parse(scoresData) as Record<string, MatchScore>;
        const scoresMap = new Map<number, MatchScore>();
        Object.values(parsed).forEach(score => {
          if (score.eventId === eventId) {
            scoresMap.set(score.matchId, score);
          }
        });
        setScores(scoresMap);
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    }
  }, [eventId]);

  // Save claims to localStorage
  useEffect(() => {
    try {
      const claimsObj: Record<string, MatchClaim> = {};
      claims.forEach(claim => {
        claimsObj[claim.matchId.toString()] = claim;
      });
      localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claimsObj));
    } catch (error) {
      console.error('Failed to save claims:', error);
    }
  }, [claims]);

  // Save scores to localStorage
  useEffect(() => {
    try {
      const scoresObj: Record<string, MatchScore> = {};
      scores.forEach(score => {
        scoresObj[score.matchId.toString()] = score;
      });
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scoresObj));
    } catch (error) {
      console.error('Failed to save scores:', error);
    }
  }, [scores]);

  // Poll localStorage for score updates (fallback for cross-tab sync)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      try {
        const scoresData = localStorage.getItem(STORAGE_KEY_SCORES);
        if (!scoresData) return;

        const parsed = JSON.parse(scoresData) as Record<string, MatchScore>;
        const currentScores = new Map<number, MatchScore>();
        let hasChanges = false;

        Object.values(parsed).forEach(score => {
          if (score.eventId === eventId) {
            currentScores.set(score.matchId, score);
            // Check if this score is newer than what we have
            const existingScore = scores.get(score.matchId);
            if (!existingScore || (score.lastUpdated && score.lastUpdated > existingScore.lastUpdated)) {
              hasChanges = true;
            }
          }
        });

        // Update if there are changes
        if (hasChanges) {
          setScores(prev => {
            const next = new Map(prev);
            currentScores.forEach((score, matchId) => {
              const existing = prev.get(matchId);
              if (!existing || (score.lastUpdated && score.lastUpdated > existing.lastUpdated)) {
                next.set(matchId, score);
              }
            });
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to poll scores:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [eventId, scores]);

  // Claim a match
  const claimMatch = useCallback((matchId: number, matchEndTime: number) => {
    const now = Date.now();
    const expiresAt = matchEndTime + CLAIM_EXPIRATION_BUFFER_MS;

    const claim: MatchClaim = {
      matchId,
      claimedBy: userId,
      claimedAt: now,
      expiresAt,
      eventId,
    };

    setClaims(prev => {
      const next = new Map(prev);
      next.set(matchId, claim);
      return next;
    });
  }, [eventId, userId]);

  // Release a claim
  const releaseClaim = useCallback((matchId: number) => {
    setClaims(prev => {
      const next = new Map(prev);
      next.delete(matchId);
      return next;
    });
  }, []);

  // Check if match is claimed
  const isClaimed = useCallback((matchId: number): boolean => {
    const claim = claims.get(matchId);
    if (!claim) return false;
    if (claim.expiresAt < Date.now()) {
      // Auto-release expired claims
      releaseClaim(matchId);
      return false;
    }
    return true;
  }, [claims, releaseClaim]);

  // Get claim status
  const getClaimStatus = useCallback((matchId: number): 'available' | 'claimed' | 'locked' => {
    if (!isClaimed(matchId)) return 'available';
    const claim = claims.get(matchId);
    if (!claim) return 'available';
    if (claim.claimedBy === userId) return 'claimed';
    return 'locked';
  }, [claims, userId, isClaimed]);

  // Get claimer name
  const getClaimer = useCallback((matchId: number): string | null => {
    const claim = claims.get(matchId);
    if (!claim || claim.expiresAt < Date.now()) return null;
    return claim.claimedBy;
  }, [claims]);

  // Check if user owns the claim
  const isClaimOwner = useCallback((matchId: number): boolean => {
    const claim = claims.get(matchId);
    return claim?.claimedBy === userId && claim.expiresAt > Date.now();
  }, [claims, userId]);

  // Update score
  const updateScore = useCallback((matchId: number, sets: SetScore[], status: 'not-started' | 'in-progress' | 'completed') => {
    const score: MatchScore = {
      matchId,
      eventId,
      sets,
      status,
      lastUpdated: Date.now(),
      lastUpdatedBy: userId,
    };

    setScores(prev => {
      const next = new Map(prev);
      next.set(matchId, score);
      return next;
    });

    // Broadcast score update to all open tabs
    broadcastScoreUpdate(eventId, matchId, score);
    
    // Add to score history
    addScoreHistory(matchId, score, userId);
  }, [eventId, userId]);

  // Get score for a match
  const getScore = useCallback((matchId: number): MatchScore | null => {
    return scores.get(matchId) || null;
  }, [scores]);

  // Clear all claims and scores for current event
  const clearEventData = useCallback(() => {
    setClaims(prev => {
      const next = new Map(prev);
      next.forEach((claim, matchId) => {
        if (claim.eventId === eventId) {
          next.delete(matchId);
        }
      });
      return next;
    });

    setScores(prev => {
      const next = new Map(prev);
      next.forEach((score, matchId) => {
        if (score.eventId === eventId) {
          next.delete(matchId);
        }
      });
      return next;
    });
  }, [eventId]);

  return {
    claimMatch,
    releaseClaim,
    isClaimed,
    getClaimStatus,
    getClaimer,
    isClaimOwner,
    updateScore,
    getScore,
    clearEventData,
    claims, // Expose claims for reactivity
  };
};

