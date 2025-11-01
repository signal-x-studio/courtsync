<script lang="ts">
	import { onMount } from 'svelte';
	import { getClaimHistory, getEventClaimHistory } from '$lib/utils/claimHistory';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import type { FilteredMatch } from '$lib/types';
	
	export let matchId: number | undefined = undefined;
	export let eventId: string;
	export let matches: FilteredMatch[];
	export let onClose: () => void;
	
	let history: any[] = [];
	let filter: 'all' | 'match' = 'match';
	
	$: {
		if (filter === 'match' && matchId) {
			history = getClaimHistory(matchId, eventId);
		} else {
			history = getEventClaimHistory(eventId);
		}
	}
	
	function getMatchInfo(matchId: number): FilteredMatch | undefined {
		return matches.find(m => m.MatchId === matchId);
	}
	
	function formatTimestamp(timestamp: number): string {
		return `${formatMatchDate(timestamp)} ${formatMatchTime(timestamp)}`;
	}
	
	function getActionLabel(entry: any): string {
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
	}
	
	function getActionColor(action: string): string {
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
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
	<div class="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-[#454654] bg-[#454654]/50">
			<div>
				<h3 class="text-lg font-semibold text-[#f8f8f9]">Claim History</h3>
				<p class="text-xs text-[#9fa2ab] mt-0.5">
					{filter === 'match' && matchId ? 'Match history' : 'All claims for this event'}
				</p>
			</div>
			<div class="flex items-center gap-2">
				{#if matchId}
					<select
						bind:value={filter}
						class="px-2 py-1 text-xs rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
					>
						<option value="match">This Match</option>
						<option value="all">All Matches</option>
					</select>
				{/if}
				<button
					onclick={onClose}
					class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
					aria-label="Close"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if history.length === 0}
				<div class="text-center py-12 text-[#9fa2ab] text-sm">
					No claim history found
				</div>
			{:else}
				<div class="space-y-2">
					{#each history as entry, index}
						{@const match = getMatchInfo(entry.matchId)}
						<div class="px-3 py-2 rounded-lg border border-[#454654] bg-[#454654]/30">
							<div class="flex items-start justify-between mb-1">
								<div class="flex-1">
									{#if match}
										<div class="text-sm font-semibold text-[#f8f8f9]">
											{formatMatchTime(match.ScheduledStartDateTime)} • {match.CourtName}
										</div>
									{/if}
									<div class="text-xs text-[#9fa2ab] mt-0.5">
										{match ? `${match.FirstTeamText} vs ${match.SecondTeamText}` : `Match ${entry.matchId}`}
									</div>
								</div>
								<div class="text-xs font-medium {getActionColor(entry.action)}">
									{getActionLabel(entry)}
								</div>
							</div>
							<div class="flex items-center justify-between mt-2 text-xs text-[#808593]">
								<span>By: {entry.userId}</span>
								<span>{formatTimestamp(entry.timestamp)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

