<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: My Teams page showing matches for favorited teams -->
<!-- Note: Allows users to add/remove favorite teams and see their schedules -->

<script lang="ts">
	import { navigating } from '$app/stores';
	import { favoriteTeams } from '$lib/stores/favorites';
	import { filters } from '$lib/stores/filters';
	import { eventId } from '$lib/stores/event';
	import { applyFilters, groupByTime } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import MatchListSkeleton from '$lib/components/ui/MatchListSkeleton.svelte';
	import type { PageData } from './$types';

	// Get data from load function
	let { data }: { data: PageData } = $props();

	let showTeamSelector = $state(false);

	// Use data from server-side load
	let allMatches = $derived(data.allMatches);
	let availableTeams = $derived(data.availableTeams);

	// Show loading state during navigation
	let isNavigating = $derived($navigating !== null);

	// Derived reactive values
	let favoriteMatches = $derived(
		allMatches.filter(
			(match) =>
				(match.FirstTeamId && $favoriteTeams.includes(match.FirstTeamId)) ||
				(match.SecondTeamId && $favoriteTeams.includes(match.SecondTeamId))
		)
	);
	let filteredMatches = $derived(applyFilters(favoriteMatches, $filters));
	let timeBlocks = $derived(groupByTime(filteredMatches));

	// Get favorite teams with their division info
	let favoriteTeamDetails = $derived(
		availableTeams.filter((team) => team.TeamId && $favoriteTeams.includes(team.TeamId))
	);

	function toggleFavorite(teamId: number) {
		if ($favoriteTeams.includes(teamId)) {
			favoriteTeams.removeTeam(teamId);
		} else {
			favoriteTeams.addTeam(teamId);
		}
	}

	function navigateToTeam(teamId: number, divisionId: number) {
		window.location.href = `/team/${$eventId}/${divisionId}/${teamId}`;
	}
</script>

<div class="max-w-screen-xl mx-auto p-4">
	<div class="mb-6 flex justify-between items-start">
		<div>
			<h2 class="text-2xl font-bold text-court-gold mb-2">My Teams</h2>
			<p class="text-gray-400">
				{$favoriteTeams.length} favorite team{$favoriteTeams.length !== 1 ? 's' : ''}
				• {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
			</p>
		</div>
		<button
			onclick={() => (showTeamSelector = !showTeamSelector)}
			class="px-4 py-2 bg-court-charcoal border border-gray-700 rounded-lg hover:border-court-gold transition-colors"
		>
			{showTeamSelector ? 'Hide' : 'Manage'} Teams
		</button>
	</div>

	{#if $favoriteTeams.length > 0}
		<div class="mb-6 bg-court-charcoal border border-gray-700 rounded-lg p-4">
			<h3 class="text-lg font-semibold mb-3">Your Teams</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each favoriteTeamDetails as team (team.TeamId)}
					<div
						class="flex items-center justify-between p-3 rounded border border-court-gold bg-court-gold bg-opacity-5"
					>
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<span class="text-lg text-court-gold">★</span>
							<div class="min-w-0">
								<div class="font-medium truncate">{team.TeamName}</div>
								<div class="text-sm text-gray-400">{team.DivisionName}</div>
							</div>
						</div>
						<button
							onclick={() => team.TeamId && team.DivisionId && navigateToTeam(team.TeamId, team.DivisionId)}
							class="px-3 py-1.5 bg-court-gold text-court-dark text-sm font-semibold rounded hover:bg-yellow-500 transition-colors shrink-0 ml-2"
							aria-label="View {team.TeamName} full schedule and details"
						>
							View Team
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if showTeamSelector}
		<div class="mb-6 bg-court-charcoal border border-gray-700 rounded-lg p-4">
			<h3 class="text-lg font-semibold mb-3">Select Your Teams</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
				{#each availableTeams as team (team.TeamId)}
					<button
						onclick={() => team.TeamId && toggleFavorite(team.TeamId)}
						class="text-left px-3 py-2 rounded border transition-colors {team.TeamId &&
						$favoriteTeams.includes(team.TeamId)
							? 'border-court-gold bg-court-gold bg-opacity-10'
							: 'border-gray-700'}"
					>
						<div class="flex items-center gap-2">
							<span
								class="text-lg"
								class:text-court-gold={team.TeamId && $favoriteTeams.includes(team.TeamId)}
							>
								{team.TeamId && $favoriteTeams.includes(team.TeamId) ? '★' : '☆'}
							</span>
							<div>
								<div class="font-medium">{team.TeamName}</div>
								<div class="text-sm text-gray-400">{team.DivisionName}</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if isNavigating}
		<MatchListSkeleton count={6} />
	{:else if $favoriteTeams.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-400 text-lg mb-4">No favorite teams selected</p>
			<button
				onclick={() => (showTeamSelector = true)}
				class="px-6 py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark transition-colors"
			>
				Select Your Teams
			</button>
		</div>
	{:else if timeBlocks.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-400 text-lg">No matches found for your teams</p>
			{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
				<button onclick={() => filters.clear()} class="mt-4 text-court-gold hover:underline">
					Clear filters
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			{#each timeBlocks as block (block.time)}
				<TimeBlock {block} conflicts={new Set()} showCoverageToggle={false} />
			{/each}
		</div>
	{/if}
</div>
