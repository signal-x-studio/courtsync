<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime } from '$lib/utils/dateUtils';
	import { getTeamIdentifier } from '$lib/stores/filters';
	
	export let match: FilteredMatch;
	export let conflictingMatches: FilteredMatch[];
	export let onClose: () => void;
	
	// Get opponent
	function getOpponent(m: FilteredMatch): string {
		if (m.InvolvedTeam === 'first') return m.SecondTeamText;
		if (m.InvolvedTeam === 'second') return m.FirstTeamText;
		return `${m.FirstTeamText} vs ${m.SecondTeamText}`;
	}
	
	// Calculate travel time estimate (simplified: assume 5 minutes between courts)
	function estimateTravelTime(court1: string, court2: string): number {
		return court1 !== court2 ? 5 : 0;
	}
	
	// Get current match details
	const currentTeamId = getTeamIdentifier(match);
	const currentOpponent = getOpponent(match);
	
	// Sort conflicting matches by time
	$: sortedConflicts = [...conflictingMatches].sort(
		(a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime
	);
</script>

<div class="mt-2 border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
	<div class="p-3 sm:p-4">
		<div class="flex items-center justify-between mb-3 sm:mb-4">
			<h4 class="text-xs sm:text-sm font-semibold text-[#f8f8f9] truncate pr-2">
				Conflict Details
			</h4>
			<button
				onclick={onClose}
				class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
				aria-label="Close panel"
			>
				<svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Current Match -->
		<div class="mb-4 pb-4 border-b border-[#454654]">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">
				Selected Match
			</div>
			<div class="px-3 py-2 rounded border border-[#eab308]/50 bg-[#eab308]/5">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-sm font-bold text-[#facc15]">
						{currentTeamId || match.Division.CodeAlias}
					</span>
					<span class="text-xs text-[#808593]">vs</span>
					<span class="text-sm text-[#c0c2c8] truncate">
						{currentOpponent}
					</span>
				</div>
				<div class="flex items-center gap-3 mt-1 text-xs">
					<span class="text-[#facc15] font-medium">{match.CourtName}</span>
					<span class="text-[#9fa2ab]">{formatMatchTime(match.ScheduledStartDateTime)}</span>
					<span class="text-[#9fa2ab]">•</span>
					<span class="text-[#9fa2ab]">{match.Division.CodeAlias}</span>
				</div>
			</div>
		</div>

		<!-- Conflicting Matches -->
		<div>
			<div class="flex items-center justify-between mb-2">
				<div class="text-xs text-[#9fa2ab] uppercase tracking-wider">
					Conflicting Matches ({conflictingMatches.length})
				</div>
				<span class="text-xs text-red-400 font-medium">
					Cannot cover simultaneously
				</span>
			</div>
			
			{#if sortedConflicts.length === 0}
				<div class="text-xs text-[#808593] py-4 text-center">
					No conflicts found
				</div>
			{:else}
				<div class="space-y-2">
					{#each sortedConflicts as conflictMatch}
						{@const conflictTeamId = getTeamIdentifier(conflictMatch)}
						{@const conflictOpponent = getOpponent(conflictMatch)}
						{@const travelTime = estimateTravelTime(match.CourtName, conflictMatch.CourtName)}
						
						<div class="px-3 py-2.5 rounded border border-[#525463] bg-[#454654]/30">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-sm font-bold text-[#f8f8f9]">
									{conflictTeamId || conflictMatch.Division.CodeAlias}
								</span>
								<span class="text-xs text-[#808593]">vs</span>
								<span class="text-sm text-[#c0c2c8] truncate">
									{conflictOpponent}
								</span>
							</div>
							<div class="flex items-center gap-3 mt-1 text-xs flex-wrap">
								<span class="text-[#facc15] font-medium">{conflictMatch.CourtName}</span>
								<span class="text-[#9fa2ab]">
									{formatMatchTime(conflictMatch.ScheduledStartDateTime)}
								</span>
								<span class="text-[#9fa2ab]">•</span>
								<span class="text-[#9fa2ab]">{conflictMatch.Division.CodeAlias}</span>
								{#if travelTime > 0}
									<span class="text-[#9fa2ab]">•</span>
									<span class="text-[#808593]">
										~{travelTime} min travel from {match.CourtName}
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Help Text -->
		<div class="mt-4 pt-4 border-t border-[#454654]">
			<p class="text-xs text-[#808593]">
				These matches overlap in time and are on different courts. You'll need to choose which match to cover.
			</p>
		</div>
	</div>
</div>

