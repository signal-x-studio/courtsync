import { useState, useEffect } from 'react';
import type { MatchScore } from '../types';
import { getScoreHistory, type ScoreHistoryEntry } from '../utils/scoreStats';

interface ScoreHistoryProps {
  matchId: number;
  currentScore: MatchScore | null;
}

/**
 * Component for displaying score history/timeline for a match
 */
export const ScoreHistory = ({ matchId }: ScoreHistoryProps) => {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      const h = getScoreHistory(matchId);
      setHistory(h);
    };

    loadHistory();
    
    // Refresh history periodically
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-[#9fa2ab] text-sm">
        No score history available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#f8f8f9] mb-3">Score History</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.slice().reverse().map((entry, index) => {
          const completedSets = entry.sets.filter(s => s.completedAt > 0);
          const team1SetsWon = completedSets.filter(s => s.team1Score > s.team2Score).length;
          const team2SetsWon = completedSets.filter(s => s.team2Score > s.team1Score).length;
          const currentSet = entry.sets.find(s => s.completedAt === 0) || entry.sets[entry.sets.length - 1];

          return (
            <div
              key={`${entry.timestamp}-${index}`}
              className="px-3 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-[#9fa2ab]">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  entry.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : entry.status === 'in-progress'
                    ? 'bg-[#eab308]/20 text-[#facc15]'
                    : 'bg-[#454654] text-[#9fa2ab]'
                }`}>
                  {entry.status}
                </div>
              </div>
              
              {completedSets.length > 0 && (
                <div className="text-[#c0c2c8] mb-1">
                  Sets: {team1SetsWon}-{team2SetsWon}
                </div>
              )}
              
              <div className="text-[#f8f8f9] font-semibold">
                Current: {currentSet.team1Score}-{currentSet.team2Score}
              </div>
              
              <div className="text-[10px] text-[#808593] mt-1">
                Updated by {entry.updatedBy}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

