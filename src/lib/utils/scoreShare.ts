/**
 * Utility functions for score sharing (export/import and URL encoding)
 */

import type { MatchScore } from '../types';

const STORAGE_KEY_SCORES = 'matchScores';

/**
 * Export all scores for an event as JSON
 */
export const exportScoresToJSON = (eventId: string): string => {
  try {
    const scoresData = localStorage.getItem(STORAGE_KEY_SCORES);
    if (!scoresData) {
      return JSON.stringify({ eventId, scores: [] }, null, 2);
    }

    const parsed = JSON.parse(scoresData) as Record<string, MatchScore>;
    const eventScores: MatchScore[] = [];
    
    Object.values(parsed).forEach(score => {
      if (score.eventId === eventId) {
        eventScores.push(score);
      }
    });

    return JSON.stringify({ eventId, scores: eventScores, exportedAt: Date.now() }, null, 2);
  } catch (error) {
    console.error('Failed to export scores:', error);
    return JSON.stringify({ eventId, scores: [], error: 'Export failed' }, null, 2);
  }
};

/**
 * Import scores from JSON
 */
export const importScoresFromJSON = (jsonData: string): { success: boolean; imported: number; errors: string[] } => {
  const errors: string[] = [];
  let imported = 0;

  try {
    const data = JSON.parse(jsonData);
    
    if (!data.scores || !Array.isArray(data.scores)) {
      errors.push('Invalid JSON format: missing scores array');
      return { success: false, imported: 0, errors };
    }

    const existingScoresData = localStorage.getItem(STORAGE_KEY_SCORES);
    const existingScores: Record<string, MatchScore> = existingScoresData
      ? JSON.parse(existingScoresData)
      : {};

    data.scores.forEach((score: MatchScore) => {
      try {
        // Validate score structure
        if (!score.matchId || !score.eventId || !score.sets || !Array.isArray(score.sets)) {
          errors.push(`Invalid score for match ${score.matchId}: missing required fields`);
          return;
        }

        const scoreKey = score.matchId.toString();
        const existingScore = existingScores[scoreKey];

        // Merge strategy: keep newer score if timestamps are available
        if (existingScore && existingScore.lastUpdated && score.lastUpdated) {
          if (score.lastUpdated > existingScore.lastUpdated) {
            existingScores[scoreKey] = score;
            imported++;
          } else {
            // Existing score is newer, skip
            return;
          }
        } else {
          // No timestamp info, use imported score
          existingScores[scoreKey] = score;
          imported++;
        }
      } catch (error) {
        errors.push(`Failed to import score for match ${score.matchId}: ${error}`);
      }
    });

    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(existingScores));

    return { success: errors.length === 0, imported, errors };
  } catch (error) {
    errors.push(`Failed to parse JSON: ${error}`);
    return { success: false, imported: 0, errors };
  }
};

/**
 * Generate a shareable URL with scores encoded in the hash
 */
export const generateScoreShareUrl = (eventId: string): string => {
  try {
    const scoresData = localStorage.getItem(STORAGE_KEY_SCORES);
    if (!scoresData) {
      return window.location.href.split('#')[0];
    }

    const parsed = JSON.parse(scoresData) as Record<string, MatchScore>;
    const eventScores: MatchScore[] = [];
    
    Object.values(parsed).forEach(score => {
      if (score.eventId === eventId) {
        eventScores.push(score);
      }
    });

    if (eventScores.length === 0) {
      return window.location.href.split('#')[0];
    }

    const shareData = {
      eventId,
      scores: eventScores,
      exportedAt: Date.now(),
    };

    // Encode to base64
    const jsonString = JSON.stringify(shareData);
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    
    // Warn if URL is too long
    const url = `${window.location.href.split('#')[0]}#scores=${encoded}`;
    if (url.length > 2000) {
      console.warn('Shareable URL exceeds 2000 characters. Consider using export/import instead.');
    }

    return url;
  } catch (error) {
    console.error('Failed to generate shareable URL:', error);
    return window.location.href.split('#')[0];
  }
};

/**
 * Extract scores from URL hash
 */
export const extractScoresFromUrl = (): { eventId: string; scores: MatchScore[] } | null => {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#scores=')) {
      return null;
    }

    const encoded = hash.substring(8); // Remove '#scores='
    const jsonString = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(jsonString);

    if (!data.scores || !Array.isArray(data.scores)) {
      return null;
    }

    return {
      eventId: data.eventId || '',
      scores: data.scores,
    };
  } catch (error) {
    console.error('Failed to extract scores from URL:', error);
    return null;
  }
};

/**
 * Check if URL contains shareable scores
 */
export const hasShareableScoresInUrl = (): boolean => {
  const hash = window.location.hash;
  return hash !== null && hash.startsWith('#scores=');
};

/**
 * Clear scores from URL hash (cleanup)
 */
export const clearScoresFromUrl = (): void => {
  if (hasShareableScoresInUrl()) {
    window.history.replaceState(null, '', window.location.href.split('#')[0]);
  }
};

