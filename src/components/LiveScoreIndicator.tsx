import { useState, useEffect } from 'react';

interface LiveScoreIndicatorProps {
  isLive: boolean;
  lastUpdated?: number;
  className?: string;
}

/**
 * Component for displaying a live score indicator with pulse animation
 */
export const LiveScoreIndicator = ({ isLive, lastUpdated, className = '' }: LiveScoreIndicatorProps) => {
  const [hasUpdate, setHasUpdate] = useState(false);

  // Flash animation when score updates
  useEffect(() => {
    if (lastUpdated) {
      setHasUpdate(true);
      const timer = setTimeout(() => setHasUpdate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated]);

  if (!isLive) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span
        className={`px-1.5 py-0.5 text-[10px] font-medium rounded border transition-all ${
          hasUpdate
            ? 'bg-green-500/30 text-green-300 border-green-500/50 animate-pulse'
            : 'bg-green-500/20 text-green-400 border-green-500/30'
        }`}
      >
        LIVE
      </span>
      {lastUpdated && (
        <span className="text-[9px] text-[#9fa2ab] opacity-75">
          {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};

