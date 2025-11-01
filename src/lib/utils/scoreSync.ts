/**
 * Utility functions for score synchronization using BroadcastChannel API
 */

export interface ScoreUpdateMessage {
  type: 'score-update' | 'score-delete';
  eventId: string;
  matchId: number;
  score?: any; // MatchScore type
  timestamp: number;
}

const BROADCAST_CHANNEL_NAME = 'courtsync-score-updates';

let broadcastChannel: BroadcastChannel | null = null;

/**
 * Initialize BroadcastChannel for score synchronization
 */
export const initScoreBroadcastChannel = (): BroadcastChannel => {
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch (error) {
      console.error('BroadcastChannel not supported:', error);
      // Fallback: create a mock channel that does nothing
      broadcastChannel = {
        postMessage: () => {},
        close: () => {},
        onmessage: null,
      } as unknown as BroadcastChannel;
    }
  }
  return broadcastChannel;
};

/**
 * Broadcast a score update to all open tabs
 */
export const broadcastScoreUpdate = (
  eventId: string,
  matchId: number,
  score: any | null, // MatchScore | null
): void => {
  const channel = initScoreBroadcastChannel();
  
  const message: ScoreUpdateMessage = {
    type: score ? 'score-update' : 'score-delete',
    eventId,
    matchId,
    score: score || undefined,
    timestamp: Date.now(),
  };

  try {
    channel.postMessage(message);
  } catch (error) {
    console.error('Failed to broadcast score update:', error);
  }
};

/**
 * Get the BroadcastChannel instance
 */
export const getScoreBroadcastChannel = (): BroadcastChannel => {
  return initScoreBroadcastChannel();
};

/**
 * Close the BroadcastChannel (cleanup)
 */
export const closeScoreBroadcastChannel = (): void => {
  if (broadcastChannel) {
    try {
      broadcastChannel.close();
      broadcastChannel = null;
    } catch (error) {
      console.error('Failed to close BroadcastChannel:', error);
    }
  }
};

