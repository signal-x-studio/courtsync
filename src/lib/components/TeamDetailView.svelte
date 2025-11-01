<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { followedTeams } from '$lib/stores/followedTeams';
	
	import TeamDetailPanel from '$lib/components/TeamDetailPanel.svelte';
	
	export let teamId: string;
	export let teamName: string;
	export let matches: FilteredMatch[] = [];
	export let eventId: string;
	export let clubId: number;
	export let onBack: () => void;
	
	// Only show back button if there's more than one favorited team
	$: followedTeamsCount = $followedTeams?.length || 0;
	$: showBackButton = followedTeamsCount > 1;
	
	// Find a match for this team to use for TeamDetailPanel
	$: teamMatch = (() => {
		for (const match of matches) {
			const matchTeamId = getTeamIdentifier(match);
			if (matchTeamId === teamId) {
				return match;
			}
		}
		return null;
	})();
	
	// If we can't find a match, we'll need to create a minimal one
	$: displayMatch = teamMatch || createPlaceholderMatch();
	
	function createPlaceholderMatch(): FilteredMatch | null {
		if (!teamMatch && matches.length > 0) {
			// Use the first match as a template, but modify the team info
			const firstMatch = matches[0];
			return {
				...firstMatch,
				InvolvedTeam: 'first',
				FirstTeamText: teamName,
				SecondTeamText: ''
			};
		}
		return null;
	}
	
	function handleBackClick(e?: MouseEvent | KeyboardEvent) {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		if (onBack) {
			onBack();
		}
	}
	
	function handleClose() {
		if (onBack) {
			onBack();
		}
	}
</script>

<div class="px-4 py-4 pb-24 lg:px-0 lg:py-0">
	{#if displayMatch}
		{#if showBackButton}
			<div class="mb-4">
				<button
					type="button"
					onclick={handleBackClick}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleBackClick(e);
						}
					}}
					class="flex items-center gap-2 text-sm text-charcoal-300 hover:text-charcoal-50 transition-colors mb-4 min-h-[44px] cursor-pointer"
					aria-label="Back to My Teams"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					<span>Back to My Teams</span>
				</button>
			</div>
		{/if}
		
		<TeamDetailPanel
			match={displayMatch}
			{eventId}
			{clubId}
			onClose={showBackButton ? handleClose : undefined}
			{matches}
		/>
	{:else}
		<div class="text-center py-12">
			<div class="text-charcoal-300 text-sm mb-2">No match data available</div>
			<div class="text-xs text-charcoal-400">
				Unable to load schedule for {teamName}
			</div>
			{#if showBackButton}
				<button
					type="button"
					onclick={handleBackClick}
					class="mt-4 px-4 py-2 rounded-lg bg-charcoal-800 text-charcoal-200 hover:bg-charcoal-700 transition-colors min-h-[44px] cursor-pointer"
					aria-label="Back to My Teams"
				>
					Back
				</button>
			{/if}
		</div>
	{/if}
</div>

