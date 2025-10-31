import { useState, useEffect } from 'react';
import { getClaimHistory, getEventClaimHistory } from '../utils/claimHistory';
import { formatMatchTime, formatMatchDate } from '../utils/dateUtils';
import type { FilteredMatch } from '../types';

interface ClaimHistoryPanelProps {
  matchId?: number;
  eventId: string;
  matches: FilteredMatch[];
  onClose: () => void;
}

export const ClaimHistoryPanel = ({ matchId, eventId, matches, onClose }: ClaimHistoryPanelProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'match'>('match');

  useEffect(() => {
    if (filter === 'match' && matchId) {
      setHistory(getClaimHistory(matchId, eventId));
    } else {
      setHistory(getEventClaimHistory(eventId));
    }
  }, [matchId, eventId, filter]);

  const getMatchInfo = (matchId: number): FilteredMatch | undefined => {
    return matches.find(m => m.MatchId === matchId);
  };

  const formatTimestamp = (timestamp: number): string => {
    return `${formatMatchDate(timestamp)} ${formatMatchTime(timestamp)}`;
  };

  const getActionLabel = (entry: any): string => {
    switch (entry.action) {
      case 'claimed':
        return 'Claimed';
      case 'released':
        return 'Released';
      case 'transferred':
        return `Transferred to ${entry.transferredTo}`;
      default:
        return entry.action;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'claimed':
        return 'text-[#eab308]';
      case 'released':
        return 'text-[#9fa2ab]';
      case 'transferred':
        return 'text-[#facc15]';
      default:
        return 'text-[#c0c2c8]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#454654] bg-[#454654]/50">
          <div>
            <h3 className="text-lg font-semibold text-[#f8f8f9]">Claim History</h3>
            <p className="text-xs text-[#9fa2ab] mt-0.5">
              {filter === 'match' && matchId ? 'Match history' : 'All claims for this event'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {matchId && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'match')}
                className="px-2 py-1 text-xs rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
              >
                <option value="match">This Match</option>
                <option value="all">All Matches</option>
              </select>
            )}
            <button
              onClick={onClose}
              className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-[#9fa2ab] text-sm">
              No claim history found
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, index) => {
                const match = getMatchInfo(entry.matchId);
                return (
                  <div
                    key={index}
                    className="px-3 py-2 rounded-lg border border-[#454654] bg-[#454654]/30"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        {match && (
                          <div className="text-sm font-semibold text-[#f8f8f9]">
                            {formatMatchTime(match.ScheduledStartDateTime)} • {match.CourtName}
                          </div>
                        )}
                        <div className="text-xs text-[#9fa2ab] mt-0.5">
                          {match ? `${match.FirstTeamText} vs ${match.SecondTeamText}` : `Match ${entry.matchId}`}
                        </div>
                      </div>
                      <div className={`text-xs font-medium ${getActionColor(entry.action)}`}>
                        {getActionLabel(entry)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-[#808593]">
                      <span>By: {entry.userId}</span>
                      <span>{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

