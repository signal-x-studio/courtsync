<!-- Reference: https://svelte.dev/docs/svelte/what-are-runes -->
<!-- Reference: https://date-fns.org/docs/format -->
<!-- Purpose: Match card component showing team info, time, and status -->
<!-- Note: Uses Svelte 5 $derived runes for reactive computed values -->

<script lang="ts">
	import type { Match } from '$lib/types/aes';
	import { coveragePlan } from '$lib/stores/coverage';
	import { favoriteTeams } from '$lib/stores/favorites';
	import { persona } from '$lib/stores/persona';
	import { getMatchStatus } from '$lib/utils/filterMatches';
	import { format } from 'date-fns';

	interface Props {
		match: Match;
		showCoverageToggle?: boolean;
		isConflict?: boolean;
	}

	let { match, showCoverageToggle = false, isConflict = false }: Props = $props();

	// Use $derived for Svelte 5 reactivity
	let isInCoverage = $derived($coveragePlan.includes(match.MatchId));
	let isTeam1Favorite = $derived(
		match.FirstTeamId ? $favoriteTeams.includes(match.FirstTeamId) : false
	);
	let isTeam2Favorite = $derived(
		match.SecondTeamId ? $favoriteTeams.includes(match.SecondTeamId) : false
	);
	let status = $derived(getMatchStatus(match));

	function toggleCoverage() {
		if (isInCoverage) {
			coveragePlan.removeMatch(match.MatchId);
		} else {
			coveragePlan.addMatch(match.MatchId);
		}
	}

	function formatTime(timestamp: number): string {
		return format(timestamp, 'h:mm a');
	}
</script>

<div
	class="match-card bg-court-charcoal rounded-lg p-4 border-2 transition-colors"
	class:border-red-500={isConflict}
	class:border-court-gold={isInCoverage && !isConflict}
	class:border-gray-700={!isConflict && !isInCoverage}
>
	<div class="flex justify-between items-start mb-2">
		<div class="text-sm text-gray-400">
			{formatTime(match.ScheduledStartDateTime)}
			{#if match.CourtName}
				• {match.CourtName}
			{/if}
			{#if status === 'live'}
				<span class="ml-2 text-red-400 font-semibold">🔴 LIVE</span>
			{/if}
		</div>
		{#if showCoverageToggle && $persona === 'media'}
			<button
				onclick={toggleCoverage}
				class="text-xs px-2 py-1 rounded transition-colors"
				class:bg-court-gold={isInCoverage}
				class:text-court-dark={isInCoverage}
				class:bg-gray-700={!isInCoverage}
				class:text-gray-300={!isInCoverage}
				aria-label={isInCoverage ? 'Remove from coverage plan' : 'Add to coverage plan'}
			>
				{isInCoverage ? '✓ Coverage' : '+ Coverage'}
			</button>
		{/if}
	</div>

	<a
		href="/match/{match.MatchId}?divisionId={match.Division.DivisionId}&teamId={match.FirstTeamId || match.SecondTeamId || 0}"
		class="block hover:opacity-80 transition-opacity"
		aria-label="View match details for {match.FirstTeamText} vs {match.SecondTeamText}"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				{#if isTeam1Favorite}
					<span class="text-court-gold" aria-label="Favorited team">★</span>
				{/if}
				<span class="font-semibold">{match.FirstTeamText}</span>
			</div>
			<div class="text-gray-400 text-sm">vs</div>
			<div class="flex items-center gap-2">
				{#if isTeam2Favorite}
					<span class="text-court-gold" aria-label="Favorited team">★</span>
				{/if}
				<span class="font-semibold">{match.SecondTeamText}</span>
			</div>
		</div>

		<div class="mt-2 text-xs text-gray-500">
			{match.Division.Name}
		</div>
	</a>

	{#if isConflict}
		<div class="mt-2 text-xs text-red-400">⚠️ Conflict with another match</div>
	{/if}
</div>
