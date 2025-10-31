import { useCallback, useState } from 'react';
import type { FilteredMatch } from '../types';
import type { useMatchClaiming } from '../hooks/useMatchClaiming';

interface MatchClaimButtonProps {
  match: FilteredMatch;
  matchClaiming: ReturnType<typeof useMatchClaiming>;
  onClaim: (matchId: number) => void;
  onRelease: () => void;
}

export const MatchClaimButton = ({
  match,
  matchClaiming,
  onClaim,
  onRelease,
}: MatchClaimButtonProps) => {
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const claimStatus = matchClaiming.getClaimStatus(match.MatchId);
  const claimer = matchClaiming.getClaimer(match.MatchId);
  const isOwner = matchClaiming.isClaimOwner(match.MatchId);

  const handleClick = useCallback(() => {
    if (claimStatus === 'available') {
      matchClaiming.claimMatch(match.MatchId, match.ScheduledEndDateTime);
      // Call onClaim with matchId after claiming
      setTimeout(() => {
        onClaim(match.MatchId);
      }, 100);
    } else if (isOwner) {
      matchClaiming.releaseClaim(match.MatchId);
      onRelease();
    }
  }, [match, matchClaiming, claimStatus, isOwner, onClaim, onRelease]);

  const handleTransfer = useCallback(() => {
    if (transferUserId.trim()) {
      const success = matchClaiming.transferClaim(match.MatchId, transferUserId.trim());
      if (success) {
        setShowTransferDialog(false);
        setTransferUserId('');
        onRelease(); // Call onRelease to close scorekeeper if open
      }
    }
  }, [match, matchClaiming, transferUserId, onRelease]);

  if (claimStatus === 'locked') {
    return (
      <div className="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#9fa2ab] border border-[#525463]">
        Claimed by {claimer}
      </div>
    );
  }

  if (claimStatus === 'claimed' && isOwner) {
    return (
      <>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClick}
            className="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]"
            title="Release claim"
          >
            Release
          </button>
          <button
            onClick={() => setShowTransferDialog(true)}
            className="px-2 py-1 text-xs font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors border border-[#525463]"
            title="Transfer claim to another scorer"
          >
            Transfer
          </button>
        </div>

        {/* Transfer Dialog */}
        {showTransferDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-md w-full p-4">
              <h3 className="text-lg font-semibold text-[#f8f8f9] mb-3">Transfer Claim</h3>
              <p className="text-sm text-[#9fa2ab] mb-4">
                Enter the name or identifier of the person who will take over scoring for this match.
              </p>
              <input
                type="text"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                placeholder="Enter scorer name or ID..."
                className="w-full px-3 py-2 bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] focus:border-[#eab308] focus:outline-none mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTransfer();
                  } else if (e.key === 'Escape') {
                    setShowTransferDialog(false);
                    setTransferUserId('');
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTransfer}
                  disabled={!transferUserId.trim()}
                  className="px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer
                </button>
                <button
                  onClick={() => {
                    setShowTransferDialog(false);
                    setTransferUserId('');
                  }}
                  className="px-4 py-2 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]"
    >
      Claim Match
    </button>
  );
};

