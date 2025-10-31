import { useState, useCallback, useEffect, useRef } from 'react';
import type { MatchScore, SetScore } from '../types';
import { ScoreHistory } from './ScoreHistory';

interface ScorekeeperProps {
  matchId: number;
  team1Name: string;
  team2Name: string;
  currentScore: MatchScore | null;
  onScoreUpdate: (sets: SetScore[], status: 'not-started' | 'in-progress' | 'completed') => void;
  onClose: () => void;
}

// Score validation constants
const MIN_SET_SCORE = 0;
const MAX_SET_SCORE = 50; // Reasonable upper limit
const WINNING_SCORE = 25; // Standard volleyball set winning score
const MIN_POINT_DIFFERENCE = 2; // Must win by at least 2 points

/**
 * Validate a set score
 */
const validateSetScore = (team1Score: number, team2Score: number): { valid: boolean; warning?: string } => {
  // Check bounds
  if (team1Score < MIN_SET_SCORE || team1Score > MAX_SET_SCORE) {
    return { valid: false, warning: `Score must be between ${MIN_SET_SCORE} and ${MAX_SET_SCORE}` };
  }
  if (team2Score < MIN_SET_SCORE || team2Score > MAX_SET_SCORE) {
    return { valid: false, warning: `Score must be between ${MIN_SET_SCORE} and ${MAX_SET_SCORE}` };
  }

  // Check if score indicates a completed set
  const maxScore = Math.max(team1Score, team2Score);
  const minScore = Math.min(team1Score, team2Score);
  
  if (maxScore >= WINNING_SCORE) {
    // Must win by at least 2 points
    if (maxScore - minScore < MIN_POINT_DIFFERENCE) {
      return { 
        valid: true, 
        warning: `Set requires winning by at least ${MIN_POINT_DIFFERENCE} points. Current: ${maxScore - minScore}` 
      };
    }
    
    // Check for unusual high scores (e.g., sets going to 30+)
    if (maxScore > WINNING_SCORE + 5) {
      return { 
        valid: true, 
        warning: `High score (${maxScore}). Verify this is correct.` 
      };
    }
  }

  return { valid: true };
};

export const Scorekeeper = ({
  matchId,
  team1Name,
  team2Name,
  currentScore,
  onScoreUpdate,
  onClose,
}: ScorekeeperProps) => {
  const [sets, setSets] = useState<SetScore[]>(currentScore?.sets || []);
  const [status, setStatus] = useState<'not-started' | 'in-progress' | 'completed'>(
    currentScore?.status || 'not-started'
  );
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize sets if not started
  useEffect(() => {
    if (sets.length === 0 && status === 'not-started') {
      // Initialize with empty first set
      setSets([{
        setNumber: 1,
        team1Score: 0,
        team2Score: 0,
        completedAt: 0,
      }]);
    }
  }, [sets.length, status]);

  const handleStartMatch = useCallback(() => {
    const newStatus = 'in-progress';
    setStatus(newStatus);
    
    let newSets = sets;
    if (sets.length === 0) {
      newSets = [{
        setNumber: 1,
        team1Score: 0,
        team2Score: 0,
        completedAt: 0,
      }];
      setSets(newSets);
    }
    
    // Auto-save when starting match
    setIsSaving(true);
    onScoreUpdate(newSets.length > 0 ? newSets : sets, newStatus);
    setTimeout(() => setIsSaving(false), 500);
  }, [sets, onScoreUpdate]);

  const handleAddSet = useCallback(() => {
    const nextSetNumber = sets.length + 1;
    setSets(prev => [...prev, {
      setNumber: nextSetNumber,
      team1Score: 0,
      team2Score: 0,
      completedAt: 0,
    }]);
  }, [sets.length]);

  const handleUpdateSetScore = useCallback((setNumber: number, team1: number, team2: number) => {
    // Validate score
    const validation = validateSetScore(team1, team2);
    setValidationWarning(validation.warning || null);
    
    // If invalid, don't update
    if (!validation.valid) {
      return;
    }
    
    setSets(prev => {
      const updated = prev.map(set => 
        set.setNumber === setNumber
          ? { ...set, team1Score: team1, team2Score: team2 }
          : set
      );
      
      // Auto-save score changes (debounced)
      if (status === 'in-progress') {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          setIsSaving(true);
          onScoreUpdate(updated, status);
          setTimeout(() => setIsSaving(false), 300);
        }, 1000); // Auto-save after 1 second of inactivity
      }
      
      return updated;
    });
  }, [status, onScoreUpdate]);

  const handleCompleteSet = useCallback((setNumber: number) => {
    setSets(prev => {
      const updated = prev.map(set => 
        set.setNumber === setNumber
          ? { ...set, completedAt: Date.now() }
          : set
      );
      
      // Auto-save when completing a set
      if (status === 'in-progress') {
        setIsSaving(true);
        onScoreUpdate(updated, status);
        setTimeout(() => setIsSaving(false), 500);
      }
      
      return updated;
    });
  }, [status, onScoreUpdate]);

  const handleCompleteMatch = useCallback(() => {
    setStatus('completed');
    onScoreUpdate(sets, 'completed');
  }, [sets, onScoreUpdate]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    onScoreUpdate(sets, status);
    setTimeout(() => setIsSaving(false), 500);
  }, [sets, status, onScoreUpdate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const currentSet = sets.find(s => s.completedAt === 0) || sets[sets.length - 1];
  const completedSets = sets.filter(s => s.completedAt > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#3b3c48] border-b border-[#454654] px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#f8f8f9]">Scorekeeper</h2>
            <p className="text-sm text-[#9fa2ab]">{team1Name} vs {team2Name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
            aria-label="Close scorekeeper"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9fa2ab] uppercase tracking-wider">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'not-started' | 'in-progress' | 'completed')}
              className="px-3 py-1 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
            >
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Start Match Button */}
          {status === 'not-started' && (
            <button
              onClick={handleStartMatch}
              className="w-full px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
            >
              Start Match
            </button>
          )}

          {/* Validation Warning */}
          {validationWarning && (
            <div className="px-4 py-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-sm">
              ⚠️ {validationWarning}
            </div>
          )}

          {/* Current Set Score */}
          {status === 'in-progress' && currentSet && (
            <div className="bg-[#454654] rounded-lg border border-[#525463] p-4">
              <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">
                Set {currentSet.setNumber}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-[#9fa2ab] mb-1">{team1Name}</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const newScore = Math.max(0, currentSet.team1Score - 1);
                        handleUpdateSetScore(currentSet.setNumber, newScore, currentSet.team2Score);
                      }}
                      className="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
                    >
                      −
                    </button>
                    <div className="text-3xl font-bold text-[#f8f8f9] w-12 text-center">
                      {currentSet.team1Score}
                    </div>
                    <button
                      onClick={() => {
                        const newScore = currentSet.team1Score + 1;
                        handleUpdateSetScore(currentSet.setNumber, newScore, currentSet.team2Score);
                      }}
                      className="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#9fa2ab] mb-1">{team2Name}</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const newScore = Math.max(0, currentSet.team2Score - 1);
                        handleUpdateSetScore(currentSet.setNumber, currentSet.team1Score, newScore);
                      }}
                      className="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
                    >
                      −
                    </button>
                    <div className="text-3xl font-bold text-[#f8f8f9] w-12 text-center">
                      {currentSet.team2Score}
                    </div>
                    <button
                      onClick={() => {
                        const newScore = currentSet.team2Score + 1;
                        handleUpdateSetScore(currentSet.setNumber, currentSet.team1Score, newScore);
                      }}
                      className="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleCompleteSet(currentSet.setNumber)}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors"
                >
                  Complete Set
                </button>
                {sets.length < 5 && (
                  <button
                    onClick={handleAddSet}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors"
                  >
                    Add Set
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed Sets */}
          {completedSets.length > 0 && (
            <div>
              <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">Completed Sets</div>
              <div className="space-y-2">
                {completedSets.map(set => (
                  <div
                    key={set.setNumber}
                    className="flex items-center justify-between px-3 py-2 bg-[#454654] rounded border border-[#525463]"
                  >
                    <span className="text-sm text-[#9fa2ab]">Set {set.setNumber}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[#f8f8f9]">{team1Name}: {set.team1Score}</span>
                      <span className="text-sm text-[#9fa2ab]">vs</span>
                      <span className="text-sm font-medium text-[#f8f8f9]">{team2Name}: {set.team2Score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Match */}
          {status === 'in-progress' && completedSets.length > 0 && (
            <button
              onClick={handleCompleteMatch}
              className="w-full px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
            >
              Complete Match
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full px-4 py-2 text-sm font-medium rounded transition-colors border ${
              isSaving
                ? 'bg-[#525463] text-[#9fa2ab] cursor-not-allowed'
                : 'bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border-[#525463]'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Score'}
          </button>
          
          {/* Auto-save indicator */}
          {status === 'in-progress' && (
            <div className="text-xs text-[#9fa2ab] text-center">
              {isSaving ? '💾 Saving...' : '✓ Auto-save enabled'}
            </div>
          )}

          {/* Score History */}
          {currentScore && (
            <div className="border-t border-[#454654] pt-4">
              <ScoreHistory matchId={matchId} currentScore={currentScore} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

