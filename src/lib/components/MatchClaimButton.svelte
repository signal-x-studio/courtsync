<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	
	export let match: FilteredMatch;
	export let eventId: string;
	export let onClaim: (matchId: number) => void;
	export let onRelease: () => void;
	
	const matchClaiming = createMatchClaiming(eventId);
	
	let showTransferDialog = false;
	let transferUserId = '';
	
	$: claimStatus = matchClaiming.getClaimStatus(match.MatchId);
	$: claimer = matchClaiming.getClaimer(match.MatchId);
	$: isOwner = matchClaiming.isClaimOwner(match.MatchId);
	
	function handleClick() {
		if (claimStatus === 'available') {
			matchClaiming.claimMatch(match.MatchId, match.ScheduledEndDateTime);
			setTimeout(() => {
				onClaim(match.MatchId);
			}, 100);
		} else if (isOwner) {
			matchClaiming.releaseClaim(match.MatchId);
			onRelease();
		}
	}
	
	function handleTransfer() {
		if (transferUserId.trim()) {
			const success = matchClaiming.transferClaim(match.MatchId, transferUserId.trim());
			if (success) {
				showTransferDialog = false;
				transferUserId = '';
				onRelease();
			}
		}
	}
</script>

{#if claimStatus === 'locked'}
	<div class="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#9fa2ab] border border-[#525463]">
		Claimed by {claimer}
	</div>
{:else if claimStatus === 'claimed' && isOwner}
	<div class="flex items-center gap-1">
		<button
			onclick={handleClick}
			class="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]"
			title="Release claim"
		>
			Release
		</button>
		<button
			onclick={() => showTransferDialog = true}
			class="px-2 py-1 text-xs font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors border border-[#525463]"
			title="Transfer claim to another scorer"
		>
			Transfer
		</button>
	</div>

	<!-- Transfer Dialog -->
	{#if showTransferDialog}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div class="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-md w-full p-4">
				<h3 class="text-lg font-semibold text-[#f8f8f9] mb-3">Transfer Claim</h3>
				<p class="text-sm text-[#9fa2ab] mb-4">
					Enter the name or identifier of the person who will take over scoring for this match.
				</p>
				<input
					type="text"
					bind:value={transferUserId}
					placeholder="Enter scorer name or ID..."
					class="w-full px-3 py-2 bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] focus:border-[#eab308] focus:outline-none mb-4"
					autofocus
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleTransfer();
						} else if (e.key === 'Escape') {
							showTransferDialog = false;
							transferUserId = '';
						}
					}}
				/>
				<div class="flex items-center gap-2">
					<button
						onclick={handleTransfer}
						disabled={!transferUserId.trim()}
						class="flex-1 px-3 py-2 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Transfer
					</button>
					<button
						onclick={() => {
							showTransferDialog = false;
							transferUserId = '';
						}}
						class="px-3 py-2 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
{:else if claimStatus === 'available'}
	<button
		onclick={handleClick}
		class="px-2 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
		title="Claim this match for scoring"
	>
		Claim Match
	</button>
{/if}

