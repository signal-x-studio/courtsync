import { useEffect, useState } from 'react';
import { getScoreBroadcastChannel, type ScoreUpdateMessage } from '../utils/scoreSync';
import type { MatchScore } from '../types';

interface UseScoreSyncOptions {
  eventId: string;
  onScoreUpdate?: (matchId: number, score: MatchScore | null) => void;
}

/**
 * Hook for real-time score synchronization across tabs using BroadcastChannel API
 */
export const useScoreSync = ({ eventId, onScoreUpdate }: UseScoreSyncOptions) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [updatesReceived, setUpdatesReceived] = useState<number>(0);

  // Listen for score updates from other tabs
  useEffect(() => {
    const channel = getScoreBroadcastChannel();

    const handleMessage = (event: MessageEvent<ScoreUpdateMessage>) => {
      const message = event.data;

      // Only process messages for the current event
      if (message.eventId !== eventId) {
        return;
      }

      // Call the update callback
      if (onScoreUpdate) {
        onScoreUpdate(message.matchId, message.score || null);
      }

      setLastUpdateTime(Date.now());
      setUpdatesReceived(prev => prev + 1);
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, [eventId, onScoreUpdate]);

  return {
    lastUpdateTime,
    updatesReceived,
  };
};

