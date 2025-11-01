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
	<div class="px-2 py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-300 border border-charcoal-600">
		Claimed by {claimer}
	</div>
{:else if claimStatus === 'claimed' && isOwner}
	<div class="flex items-center gap-1">
		<button
			onclick={handleClick}
			class="px-2 py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors border border-charcoal-600"
			title="Release claim"
		>
			Release
		</button>
		<button
			onclick={() => showTransferDialog = true}
			class="px-2 py-1 text-xs font-medium rounded bg-charcoal-600 text-charcoal-200 hover:bg-charcoal-700 transition-colors border border-charcoal-600"
			title="Transfer claim to another scorer"
		>
			Transfer
		</button>
	</div>

	<!-- Transfer Dialog -->
	{#if showTransferDialog}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div class="bg-charcoal-800 rounded-lg border border-charcoal-700 shadow-xl max-w-md w-full p-4">
				<h3 class="text-lg font-semibold text-charcoal-50 mb-3">Transfer Claim</h3>
				<p class="text-sm text-charcoal-300 mb-4">
					Enter the name or identifier of the person who will take over scoring for this match.
				</p>
				<input
					type="text"
					bind:value={transferUserId}
					placeholder="Enter scorer name or ID..."
					class="w-full px-3 py-2 bg-charcoal-700 border border-charcoal-600 rounded text-charcoal-200 focus:border-brand-500 focus:outline-none mb-4"
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
						class="flex-1 px-3 py-2 text-xs font-medium rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Transfer
					</button>
					<button
						onclick={() => {
							showTransferDialog = false;
							transferUserId = '';
						}}
						class="px-3 py-2 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors"
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
		class="px-2 py-1 text-xs font-medium rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
		title="Claim this match for scoring"
	>
		Claim Match
	</button>
{/if}

