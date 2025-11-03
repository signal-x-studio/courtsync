<!-- Reference: https://svelte.dev/docs/kit/load -->
<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: Club hub page showing all matches with filtering and time blocks -->
<!-- Note: Uses URL params for eventId and clubId, integrates filters and coverage -->

<script lang="ts">
	import { filters } from '$lib/stores/filters';
	import { coveragePlan } from '$lib/stores/coverage';
	import { persona } from '$lib/stores/persona';
	import { applyFilters, groupByTime, detectConflicts } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import type { Match } from '$lib/types/aes';
	import type { PageData } from './$types';

	// Get data from load function
	let { data }: { data: PageData } = $props();

	// Use matches from server-side load
	let allMatches = $derived(data.allMatches);

	// Derived reactive values
	let filteredMatches = $derived(applyFilters(allMatches, $filters));
	let timeBlocks = $derived(groupByTime(filteredMatches));
	let conflicts = $derived(
		$persona === 'media'
			? detectConflicts(
					$coveragePlan
						.map((id) => allMatches.find((m) => m.MatchId === id))
						.filter((m): m is Match => m !== undefined)
				)
			: new Set<number>()
	);
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

	{#if timeBlocks.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-400 text-lg">No matches found</p>
			{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
				<button onclick={() => filters.clear()} class="mt-4 text-court-gold hover:underline">
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
</div>
