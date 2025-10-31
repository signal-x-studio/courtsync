import { useCallback } from 'react';
import type { FilteredMatch } from '../types';
import type { useMatchClaiming } from '../hooks/useMatchClaiming';

interface MatchClaimButtonProps {
  match: FilteredMatch;
  matchClaiming: ReturnType<typeof useMatchClaiming>;
  onClaim: () => void;
  onRelease: () => void;
}

export const MatchClaimButton = ({
  match,
  matchClaiming,
  onClaim,
  onRelease,
}: MatchClaimButtonProps) => {
  const claimStatus = matchClaiming.getClaimStatus(match.MatchId);
  const claimer = matchClaiming.getClaimer(match.MatchId);
  const isOwner = matchClaiming.isClaimOwner(match.MatchId);

  const handleClick = useCallback(() => {
    if (claimStatus === 'available') {
      matchClaiming.claimMatch(match.MatchId, match.ScheduledEndDateTime);
      onClaim();
    } else if (isOwner) {
      matchClaiming.releaseClaim(match.MatchId);
      onRelease();
    }
  }, [match, matchClaiming, claimStatus, isOwner, onClaim, onRelease]);

  if (claimStatus === 'locked') {
    return (
      <div className="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#9fa2ab] border border-[#525463]">
        Claimed by {claimer}
      </div>
    );
  }

  if (claimStatus === 'claimed' && isOwner) {
    return (
      <button
        onClick={handleClick}
        className="px-2 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors border border-[#eab308]"
      >
        Release Claim
      </button>
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

