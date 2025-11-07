<!-- Reference: https://svelte.dev/docs/kit/load -->
<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: Club hub page showing all matches with filtering and time blocks -->
<!-- Note: Uses URL params for eventId and clubId, integrates filters and coverage -->

<script lang="ts">
	import { navigating } from '$app/stores';
	import { filters } from '$lib/stores/filters';
	import { coveragePlan } from '$lib/stores/coverage';
	import { persona } from '$lib/stores/persona';
	import { applyFilters, groupByTime, detectConflicts } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import MatchListSkeleton from '$lib/components/ui/MatchListSkeleton.svelte';
	import type { Match } from '$lib/types/aes';
	import type { PageData } from './$types';

	// Get data from load function
	let { data }: { data: PageData } = $props();

	// Use matches from server-side load
	let allMatches = $derived(data.allMatches);

	// Show loading state during navigation
	let isNavigating = $derived($navigating !== null);

	// Wave filter state (all, am, pm)
	let waveFilter = $state<'all' | 'am' | 'pm'>('all');

	// Derived reactive values
	let filteredMatches = $derived(applyFilters(allMatches, $filters));
	let timeBlocks = $derived(groupByTime(filteredMatches));

	// Filter time blocks by wave
	let visibleTimeBlocks = $derived.by(() => {
		if (waveFilter === 'all') return timeBlocks;

		return timeBlocks.filter((block) => {
			// Parse the time to determine if it's AM or PM
			const timeStr = block.time.toLowerCase();
			const isAM = timeStr.includes('am');
			const isPM = timeStr.includes('pm');

			if (waveFilter === 'am') return isAM;
			if (waveFilter === 'pm') return isPM;
			return true;
		});
	});

	let conflicts = $derived(
		$persona === 'media'
			? detectConflicts(
					$coveragePlan
						.map((id) => allMatches.find((m) => m.MatchId === id))
						.filter((m): m is Match => m !== undefined)
				)
			: new Set<number>()
	);

	// Helper to determine if a time block is AM or PM
	function getTimeWave(timeStr: string): 'am' | 'pm' {
		return timeStr.toLowerCase().includes('am') ? 'am' : 'pm';
	}
</script>

<div class="max-w-screen-xl mx-auto p-4">
	<div class="mb-6">
		<div class="flex justify-between items-start">
			<div>
				<h2 class="text-2xl font-bold text-court-gold mb-2">All Matches</h2>
				<p class="text-gray-400">
					Showing {filteredMatches.length} of {allMatches.length} matches
					{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
						(filtered)
					{/if}
				</p>
			</div>

			<!-- Wave Filter -->
			<div class="flex gap-1 bg-court-charcoal rounded-lg p-1" role="group" aria-label="Wave filter">
				<button
					onclick={() => (waveFilter = 'all')}
					class="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
					class:bg-court-gold={waveFilter === 'all'}
					class:text-court-dark={waveFilter === 'all'}
					class:text-gray-400={waveFilter !== 'all'}
					class:hover:text-white={waveFilter !== 'all'}
					aria-pressed={waveFilter === 'all'}
					aria-label="Show all waves"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					<span>All</span>
				</button>
				<button
					onclick={() => (waveFilter = 'am')}
					class="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
					class:bg-amber-500={waveFilter === 'am'}
					class:text-court-dark={waveFilter === 'am'}
					class:text-gray-400={waveFilter !== 'am'}
					class:hover:text-white={waveFilter !== 'am'}
					aria-pressed={waveFilter === 'am'}
					aria-label="Show AM wave only"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
					<span>AM</span>
				</button>
				<button
					onclick={() => (waveFilter = 'pm')}
					class="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
					class:bg-indigo-500={waveFilter === 'pm'}
					class:text-white={waveFilter === 'pm'}
					class:text-gray-400={waveFilter !== 'pm'}
					class:hover:text-white={waveFilter !== 'pm'}
					aria-pressed={waveFilter === 'pm'}
					aria-label="Show PM wave only"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
						/>
					</svg>
					<span>PM</span>
				</button>
			</div>
		</div>
	</div>

	{#if isNavigating}
		<MatchListSkeleton count={6} />
	{:else if visibleTimeBlocks.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-400 text-lg">No matches found</p>
			{#if waveFilter !== 'all'}
				<button
					onclick={() => (waveFilter = 'all')}
					class="mt-4 text-court-gold hover:underline"
				>
					Show all waves
				</button>
			{:else if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
				<button onclick={() => filters.clear()} class="mt-4 text-court-gold hover:underline">
					Clear filters
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			{#each visibleTimeBlocks as block (block.time)}
				<TimeBlock {block} {conflicts} showCoverageToggle={$persona === 'media'} wave={getTimeWave(block.time)} />
			{/each}
		</div>
	{/if}
</div>
