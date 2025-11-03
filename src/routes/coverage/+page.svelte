<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: Coverage plan page for media persona with conflict detection -->
<!-- Note: Shows coverage statistics, timeline view, and conflict warnings -->

<script lang="ts">
	import { fetchCourtSchedule, flattenCourtScheduleMatches } from '$lib/services/aes';
	import { eventId } from '$lib/stores/event';
	import { coveragePlan } from '$lib/stores/coverage';
	import { persona } from '$lib/stores/persona';
	import { groupByTime, detectConflicts } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import MatchCardSkeleton from '$lib/components/ui/MatchCardSkeleton.svelte';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import type { Match } from '$lib/types/aes';
	import type { CoverageStats } from '$lib/types/app';

	let loading = $state(true);
	let error = $state('');
	let allMatches = $state<Match[]>([]);

	// Derived reactive values
	let coverageMatches = $derived(
		allMatches.filter((match) => $coveragePlan.includes(match.MatchId))
	);
	let timeBlocks = $derived(groupByTime(coverageMatches));
	let conflicts = $derived(detectConflicts(coverageMatches));
	let stats = $derived<CoverageStats>({
		totalMatches: coverageMatches.length,
		conflicts: conflicts.size,
		divisions: new Set(coverageMatches.map((m) => m.Division.DivisionId)).size,
		courts: new Set(coverageMatches.map((m) => m.CourtName).filter((c): c is string => !!c))
			.size
	});

	async function loadMatches() {
		if (!$eventId) {
			error = 'Please select an event first';
			loading = false;
			return;
		}

		loading = true;
		error = '';

		try {
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0];
			if (!dateStr) {
				throw new Error('Invalid date format');
			}

			const schedule = await fetchCourtSchedule($eventId, dateStr, 1440);
			allMatches = flattenCourtScheduleMatches(schedule);
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
		<h2 class="text-2xl font-bold text-court-gold mb-2">Coverage Plan</h2>
		{#if $persona !== 'media'}
			<div
				class="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 text-yellow-400"
				role="alert"
			>
				⚠️ Coverage planning is only available in Media mode. Switch your persona in Settings.
			</div>
		{/if}
	</div>

	<ErrorBoundary {error} retry={loadMatches}>
		{#if loading}
			<div class="space-y-4">
				{#each Array(3) as _}
					<MatchCardSkeleton />
				{/each}
			</div>
		{:else}
			<!-- Coverage Stats -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
					<div class="text-2xl font-bold text-court-gold">{stats.totalMatches}</div>
					<div class="text-sm text-gray-400">Matches</div>
				</div>
				<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
					<div
						class="text-2xl font-bold"
						class:text-red-400={stats.conflicts > 0}
						class:text-green-400={stats.conflicts === 0}
					>
						{stats.conflicts}
					</div>
					<div class="text-sm text-gray-400">Conflicts</div>
				</div>
				<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
					<div class="text-2xl font-bold text-court-gold">{stats.divisions}</div>
					<div class="text-sm text-gray-400">Divisions</div>
				</div>
				<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
					<div class="text-2xl font-bold text-court-gold">{stats.courts}</div>
					<div class="text-sm text-gray-400">Courts</div>
				</div>
			</div>

			{#if stats.conflicts > 0}
				<div
					class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6 text-red-400"
					role="alert"
				>
					⚠️ You have {stats.conflicts} scheduling conflict{stats.conflicts !== 1
						? 's'
						: ''}. Review your coverage plan to resolve overlapping matches.
				</div>
			{/if}

			<!-- Coverage Timeline -->
			{#if timeBlocks.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-400 text-lg mb-4">No matches in your coverage plan</p>
					<a
						href="/club"
						class="inline-block px-6 py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark transition-colors"
					>
						Browse All Matches
					</a>
				</div>
			{:else}
				<div>
					<h3 class="text-lg font-semibold mb-4">Coverage Timeline</h3>
					<div class="space-y-4">
						{#each timeBlocks as block (block.time)}
							<TimeBlock {block} {conflicts} showCoverageToggle={true} />
						{/each}
					</div>
				</div>
			{/if}

			<!-- Clear Coverage Button -->
			{#if coverageMatches.length > 0}
				<div class="mt-6 pt-6 border-t border-gray-800">
					<button
						onclick={() => {
							if (
								confirm(
									`Are you sure you want to clear all ${coverageMatches.length} matches from your coverage plan?`
								)
							) {
								coveragePlan.clear();
							}
						}}
						class="px-4 py-2 bg-red-900 text-red-400 border border-red-700 rounded-lg hover:bg-red-800 transition-colors"
					>
						Clear All Coverage
					</button>
				</div>
			{/if}
		{/if}
	</ErrorBoundary>
</div>
