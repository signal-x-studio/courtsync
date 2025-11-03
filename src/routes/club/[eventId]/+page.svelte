<!-- Reference: https://svelte.dev/docs/kit/load -->
<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: Club hub page showing all matches with filtering and time blocks -->
<!-- Note: Uses URL params for eventId and clubId, integrates filters and coverage -->

<script lang="ts">
	import { page } from '$app/stores';
	import { aesClient } from '$lib/api/aesClient';
	import { filters } from '$lib/stores/filters';
	import { coveragePlan } from '$lib/stores/coverage';
	import { persona } from '$lib/stores/persona';
	import { applyFilters, groupByTime, detectConflicts } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import MatchCardSkeleton from '$lib/components/ui/MatchCardSkeleton.svelte';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import type { Match } from '$lib/types/aes';

	let eventId = $derived($page.params.eventId);
	let clubId = $derived(Number($page.url.searchParams.get('clubId')));

	let loading = $state(true);
	let error = $state('');
	let allMatches = $state<Match[]>([]);

	// Derived reactive values
	let filteredMatches = $derived(applyFilters(allMatches, $filters));
	let timeBlocks = $derived(groupByTime(filteredMatches));
	let conflicts = $derived(
		$persona === 'media' ? detectConflicts($coveragePlan.map((id) => allMatches.find((m) => m.MatchId === id)).filter((m): m is Match => m !== undefined)) : new Set<number>()
	);

	async function loadMatches() {
		if (!eventId) {
			error = 'Event ID is required';
			loading = false;
			return;
		}

		loading = true;
		error = '';

		try {
			// Get current date in YYYY-MM-DD format
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0];
			if (!dateStr) {
				throw new Error('Invalid date format');
			}

			// Load court schedule for the event
			const schedule = await aesClient.getCourtSchedule(eventId, dateStr, 1440);

			// Filter matches for this club
			const clubMatches = schedule.Matches.filter((match) => {
				// Check if either team belongs to this club
				const team1Assignment = schedule.TeamAssignments.find(
					(ta) => ta.TeamId === match.FirstTeamId
				);
				const team2Assignment = schedule.TeamAssignments.find(
					(ta) => ta.TeamId === match.SecondTeamId
				);

				return (
					team1Assignment?.ClubId === clubId ||
					team2Assignment?.ClubId === clubId
				);
			});

			allMatches = clubMatches;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load matches';
			allMatches = [];
		} finally {
			loading = false;
		}
	}

	// Load matches when component mounts
	$effect(() => {
		loadMatches();
	});
</script>

<div class="max-w-screen-xl mx-auto p-4">
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-court-gold mb-2">All Matches</h2>
		<p class="text-gray-400">
			Showing {filteredMatches.length} of {allMatches.length} matches
			{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
				(filtered)
			{/if}
		</p>
	</div>

	<ErrorBoundary {error} retry={loadMatches}>
		{#if loading}
			<div class="space-y-4">
				{#each Array(5) as _}
					<MatchCardSkeleton />
				{/each}
			</div>
		{:else if timeBlocks.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg">No matches found</p>
				{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
					<button
						onclick={() => filters.clear()}
						class="mt-4 text-court-gold hover:underline"
					>
						Clear filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="space-y-4">
				{#each timeBlocks as block (block.time)}
					<TimeBlock {block} {conflicts} showCoverageToggle={$persona === 'media'} />
				{/each}
			</div>
		{/if}
	</ErrorBoundary>
</div>
