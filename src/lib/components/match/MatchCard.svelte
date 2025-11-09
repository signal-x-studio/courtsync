<!-- Reference: https://svelte.dev/docs/svelte/what-are-runes -->
<!-- Reference: https://date-fns.org/docs/format -->
<!-- Purpose: Compact horizontal match card optimized for scannability -->
<!-- Note: Distinguishes club teams from opponents via gold color and size -->

<script lang="ts">
	import type { Match } from '$lib/types/aes';
	import { coveragePlan } from '$lib/stores/coverage';
	import { favoriteTeams } from '$lib/stores/favorites';
	import { persona } from '$lib/stores/persona';
	import { eventId } from '$lib/stores/event';
	import { getMatchStatus } from '$lib/utils/filterMatches';
	import { toast } from '$lib/stores/toast';

	interface Props {
		match: Match;
		showCoverageToggle?: boolean;
		isConflict?: boolean;
		clubTeamIds?: number[]; // Team IDs belonging to the viewing club
	}

	let { match, showCoverageToggle = false, isConflict = false, clubTeamIds = [] }: Props = $props();

	// Use $derived for Svelte 5 reactivity
	let isInCoverage = $derived($coveragePlan.includes(match.MatchId));
	let isTeam1Favorite = $derived(
		match.FirstTeamId ? $favoriteTeams.includes(match.FirstTeamId) : false
	);
	let isTeam2Favorite = $derived(
		match.SecondTeamId ? $favoriteTeams.includes(match.SecondTeamId) : false
	);
	let status = $derived(getMatchStatus(match));

	// Determine which team belongs to the club (if any)
	let team1IsClub = $derived(match.FirstTeamId ? clubTeamIds.includes(match.FirstTeamId) : false);
	let team2IsClub = $derived(match.SecondTeamId ? clubTeamIds.includes(match.SecondTeamId) : false);

	function toggleCoverage() {
		if (isInCoverage) {
			coveragePlan.removeMatch(match.MatchId);
			toast.info('Removed from coverage plan');
		} else {
			coveragePlan.addMatch(match.MatchId);
			toast.success('Added to coverage plan');
		}
	}

	function toggleFavoriteTeam(teamId: number | null | undefined, event: MouseEvent) {
		event.preventDefault(); // Prevent navigation to match detail
		event.stopPropagation();
		if (!teamId) return;

		const isFavorite = $favoriteTeams.includes(teamId);
		favoriteTeams.toggleTeam(teamId);

		// Find team name for the toast
		const teamName = teamId === match.FirstTeamId ? match.FirstTeamText : match.SecondTeamText;

		if (isFavorite) {
			toast.info(`Removed ${teamName} from favorites`);
		} else {
			toast.success(`Added ${teamName} to favorites`);
		}
	}

	function navigateToTeam(teamId: number | null | undefined, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!teamId) return;

		window.location.href = `/team/${$eventId}/${match.Division.DivisionId}/${teamId}`;
	}
</script>

<a
	href="/match/{match.MatchId}?eventId={$eventId}&divisionId={match.Division.DivisionId}&teamId={match.FirstTeamId || match.SecondTeamId || 0}"
	data-testid="match-card"
	class="match-card block card-interactive min-w-0 max-w-full overflow-hidden"
	class:border-error-500={isConflict}
	class:border-primary-500={isInCoverage && !isConflict}
	aria-label="View match details for {match.FirstTeamText} vs {match.SecondTeamText} at {match.CourtName}"
>
	<!-- Header: Court + Status + Actions -->
	<div class="flex items-center justify-between mb-2">
		<div class="flex items-center gap-2">
			{#if match.CourtName}
				<span class="text-lg font-bold">{match.CourtName}</span>
			{/if}
			{#if status === 'live'}
				<span class="badge badge-error">🔴 LIVE</span>
			{/if}
		</div>
		{#if showCoverageToggle && $persona === 'media'}
			<button
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					toggleCoverage();
				}}
				class="btn btn-sm"
				class:btn-primary={isInCoverage}
				class:btn-outline={!isInCoverage}
				aria-label={isInCoverage ? 'Remove from coverage plan' : 'Add to coverage plan'}
			>
				{isInCoverage ? '✓ Coverage' : '+ Coverage'}
			</button>
		{/if}
	</div>

	<!-- Teams: Horizontal layout with vs -->
	<div class="flex items-center gap-1 min-w-0">
		<!-- Team 1 -->
		<div class="flex items-center gap-0.5 flex-1 min-w-0">
			<button
				onclick={(e) => toggleFavoriteTeam(match.FirstTeamId, e)}
				class="p-1.5 text-base hover:scale-110 transition-transform shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ring-offset-(--bg)"
				class:text-accent-500={isTeam1Favorite}
				class:text-muted={!isTeam1Favorite}
				aria-label={isTeam1Favorite ? 'Remove from favorites' : 'Add to favorites'}
				title={isTeam1Favorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				{isTeam1Favorite ? '★' : '☆'}
			</button>
			<button
				onclick={(e) => navigateToTeam(match.FirstTeamId, e)}
				class="font-semibold truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ring-offset-(--bg) rounded px-1 min-w-0"
				class:text-base={team1IsClub}
				class:text-primary-600={team1IsClub}
				class:dark:text-primary-400={team1IsClub}
				class:text-sm={!team1IsClub}
				aria-label="View {match.FirstTeamText} team details"
			>
				{match.FirstTeamText}
			</button>
		</div>

		<!-- VS separator -->
		<span class="text-xs text-muted font-medium shrink-0 px-0.5">vs</span>

		<!-- Team 2 -->
		<div class="flex items-center gap-0.5 flex-1 min-w-0 justify-end">
			<button
				onclick={(e) => navigateToTeam(match.SecondTeamId, e)}
				class="font-semibold truncate text-right hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ring-offset-(--bg) rounded px-1 min-w-0"
				class:text-base={team2IsClub}
				class:text-primary-600={team2IsClub}
				class:dark:text-primary-400={team2IsClub}
				class:text-sm={!team2IsClub}
				aria-label="View {match.SecondTeamText} team details"
			>
				{match.SecondTeamText}
			</button>
			<button
				onclick={(e) => toggleFavoriteTeam(match.SecondTeamId, e)}
				class="p-1.5 text-base hover:scale-110 transition-transform shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ring-offset-(--bg)"
				class:text-accent-500={isTeam2Favorite}
				class:text-muted={!isTeam2Favorite}
				aria-label={isTeam2Favorite ? 'Remove from favorites' : 'Add to favorites'}
				title={isTeam2Favorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				{isTeam2Favorite ? '★' : '☆'}
			</button>
		</div>
	</div>

	<!-- Footer: Division (subtle) -->
	<div class="mt-2 text-xs text-muted">
		{match.Division.Name}
	</div>

	{#if isConflict}
		<div class="mt-2 badge badge-error">⚠️ Conflict with another match</div>
	{/if}
</a>
