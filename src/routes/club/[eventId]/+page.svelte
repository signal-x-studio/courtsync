<!-- Reference: https://svelte.dev/docs/kit/load -->
<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: Club hub page showing all matches with filtering and time blocks -->
<!-- Note: Uses URL params for eventId and clubId, integrates filters and coverage -->

<script lang="ts">
	import { navigating } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
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

	// Refresh state
	let isRefreshing = $state(false);

	async function handleRefresh() {
		isRefreshing = true;
		try {
			// Add refresh parameter to force cache bypass
			const url = new URL($page.url);
			url.searchParams.set('refresh', 'true');
			await goto(url.toString(), { invalidateAll: true });
			// Remove refresh param after navigation
			url.searchParams.delete('refresh');
			window.history.replaceState({}, '', url.toString());
		} finally {
			isRefreshing = false;
		}
	}

	// Wave filter state (all, am, pm)
	let waveFilter = $state<'all' | 'am' | 'pm'>('all');

	// Sort state
	let sortBy = $state<'time' | 'team' | 'court'>('time');

	// Derived reactive values
	let filteredMatches = $derived(applyFilters(allMatches, $filters));

	// Sort matches based on selected sort option
	let sortedMatches = $derived.by(() => {
		const matches = [...filteredMatches];

		if (sortBy === 'team') {
			return matches.sort((a, b) => {
				const teamA = a.FirstTeamText || a.SecondTeamText || '';
				const teamB = b.FirstTeamText || b.SecondTeamText || '';
				return teamA.localeCompare(teamB);
			});
		}

		if (sortBy === 'court') {
			return matches.sort((a, b) => {
				const courtA = a.CourtName || '';
				const courtB = b.CourtName || '';
				// Alphanumeric sort: extract numbers and sort properly
				return courtA.localeCompare(courtB, undefined, { numeric: true, sensitivity: 'base' });
			});
		}

		// Default: sort by time (already grouped)
		return matches;
	});

	let timeBlocks = $derived(groupByTime(sortedMatches));

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

<div class="max-w-screen-xl mx-auto p-4 overflow-x-hidden">
	<div class="mb-6">
		<div class="flex flex-col gap-4">
			<div class="flex justify-between items-start gap-2">
				<div class="min-w-0 flex-1">
					{#if $persona === 'media'}
						<a
							href="/"
							class="text-sm text-gray-400 hover:text-court-gold transition-colors mb-2 inline-flex items-center gap-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							Switch Club
						</a>
					{/if}
					<h2 class="text-2xl font-bold text-court-gold mb-2">All Matches</h2>
					<p class="text-gray-300 text-sm">
						Showing {filteredMatches.length} of {allMatches.length} matches
						{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
							(filtered)
						{/if}
						{#if data.cached && data.cacheAge !== null}
							<span class="text-xs text-gray-400">• cached {data.cacheAge}s ago</span>
						{/if}
					</p>
				</div>

			<div class="flex gap-2 flex-shrink-0">
				<!-- Refresh Button -->
				<button
					onclick={handleRefresh}
					disabled={isRefreshing}
					class="p-3 rounded-lg bg-court-charcoal hover:bg-gray-800 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-gold focus-visible:ring-offset-2 focus-visible:ring-offset-court-dark"
					aria-label="Refresh match data"
					title="Refresh match data"
				>
					<svg
						class="w-5 h-5 text-gray-300"
						class:animate-spin={isRefreshing}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				</button>

				<!-- Sort by Team -->
				<button
					onclick={() => (sortBy = sortBy === 'team' ? 'time' : 'team')}
					class="p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-gold focus-visible:ring-offset-2 focus-visible:ring-offset-court-dark"
					class:bg-court-gold={sortBy === 'team'}
					class:text-court-dark={sortBy === 'team'}
					class:bg-court-charcoal={sortBy !== 'team'}
					class:text-gray-300={sortBy !== 'team'}
					class:hover:bg-gray-800={sortBy !== 'team'}
					aria-label={sortBy === 'team' ? 'Sort by time' : 'Sort by team name'}
					title={sortBy === 'team' ? 'Sorted by team (click for time)' : 'Sort by team'}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</button>

				<!-- Sort by Court -->
				<button
					onclick={() => (sortBy = sortBy === 'court' ? 'time' : 'court')}
					class="p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-gold focus-visible:ring-offset-2 focus-visible:ring-offset-court-dark"
					class:bg-court-gold={sortBy === 'court'}
					class:text-court-dark={sortBy === 'court'}
					class:bg-court-charcoal={sortBy !== 'court'}
					class:text-gray-300={sortBy !== 'court'}
					class:hover:bg-gray-800={sortBy !== 'court'}
					aria-label={sortBy === 'court' ? 'Sort by time' : 'Sort by court'}
					title={sortBy === 'court' ? 'Sorted by court (click for time)' : 'Sort by court'}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
				</button>

				<!-- Wave Filter (context-aware) -->
				<button
					onclick={() => {
						if (waveFilter === 'all') waveFilter = 'am';
						else if (waveFilter === 'am') waveFilter = 'pm';
						else waveFilter = 'all';
					}}
					class="p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-gold focus-visible:ring-offset-2 focus-visible:ring-offset-court-dark"
					class:bg-amber-500={waveFilter === 'am'}
					class:bg-indigo-500={waveFilter === 'pm'}
					class:bg-court-gold={waveFilter === 'all'}
					class:text-court-dark={waveFilter === 'all' || waveFilter === 'am'}
					class:text-white={waveFilter === 'pm'}
					aria-label="Toggle wave filter: {waveFilter === 'all' ? 'All waves' : waveFilter === 'am' ? 'AM only' : 'PM only'}"
					title={waveFilter === 'all' ? 'All waves (click for AM)' : waveFilter === 'am' ? 'AM only (click for PM)' : 'PM only (click for All)'}
				>
					{#if waveFilter === 'all'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{:else if waveFilter === 'am'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
	</div>

	{#if isNavigating}
		<MatchListSkeleton count={6} />
	{:else if visibleTimeBlocks.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-300 text-lg">No matches found</p>
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
				<TimeBlock {block} {conflicts} showCoverageToggle={$persona === 'media'} wave={getTimeWave(block.time)} clubTeamIds={data.clubTeamIds || []} />
			{/each}
		</div>
	{/if}
</div>
