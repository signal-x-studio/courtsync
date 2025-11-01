<script lang="ts">
	import { filters, updateFilter, resetFilters } from '$lib/stores/filters';
	import { sort } from '$lib/stores/sort';
	import { userRole } from '$lib/stores/userRole';
	import { followedTeams } from '$lib/stores/followedTeams';
	import { Clock, Flag, Search, ArrowUp, Star } from 'lucide-svelte';
	
	$: isMediaValue = $userRole === 'media';
	$: isSpectatorValue = $userRole === 'spectator';
	$: followedTeamsCount = $followedTeams?.length || 0;
	$: hasSearchQuery = !!($filters.searchQuery);
	
	// Auto-disable myTeamsOnly filter if no teams are favorited
	$: if ($filters.myTeamsOnly && followedTeamsCount === 0) {
		updateFilter('myTeamsOnly', false);
	}
	
	export let onOpenFullFilters: () => void;
	
	// Reactive computation for active filters - ensures proper reactivity tracking
	$: activeFilters = (() => {
		const active: Array<{ key: string; label: string; value: string }> = [];
		
		// Access stores directly for proper reactivity
		const currentFilters = $filters;
		const currentFollowedTeamsCount = $followedTeams?.length || 0;
		
		// Note: Wave filter is not included here - its state is shown directly on the button
		
		if (currentFilters.searchQuery) {
			active.push({
				key: 'searchQuery',
				label: 'Search',
				value: currentFilters.searchQuery
			});
		}
		
		if (currentFilters.division) {
			active.push({
				key: 'division',
				label: 'Division',
				value: currentFilters.division
			});
		}
		
		if (currentFilters.court) {
			active.push({
				key: 'court',
				label: 'Court',
				value: currentFilters.court
			});
		}
		
		if (currentFilters.priority && currentFilters.priority !== 'all' && currentFilters.priority !== null) {
			active.push({
				key: 'priority',
				label: 'Priority',
				value: currentFilters.priority === 'must-cover' ? 'Must Cover' : currentFilters.priority === 'priority' ? 'Priority' : 'Optional'
			});
		}
		
		if (currentFilters.teams.length > 0) {
			currentFilters.teams.forEach(team => {
				active.push({
					key: 'team',
					label: 'Team',
					value: team
				});
			});
		}
		
		if (currentFilters.coverageStatus && currentFilters.coverageStatus !== 'all') {
			active.push({
				key: 'coverageStatus',
				label: 'Status',
				value: currentFilters.coverageStatus === 'uncovered' ? 'Uncovered' : currentFilters.coverageStatus === 'planned' ? 'Planned' : 'Covered'
			});
		}
		
		if (currentFilters.conflictsOnly) {
			active.push({
				key: 'conflictsOnly',
				label: 'Conflicts',
				value: 'Only'
			});
		}
		
		// Only show myTeamsOnly filter tag if filter is actually enabled AND there are favorited teams
		if (currentFilters.myTeamsOnly === true && currentFollowedTeamsCount > 0) {
			active.push({
				key: 'myTeamsOnly',
				label: 'My Teams',
				value: 'Only'
			});
		}
		
		return active;
	})();
	
	function removeFilter(key: string, value?: string) {
		if (key === 'searchQuery') {
			updateFilter('searchQuery', '');
		} else if (key === 'division') {
			updateFilter('division', null);
		} else if (key === 'court') {
			updateFilter('court', null);
		} else if (key === 'team') {
			if (value) {
				const newTeams = $filters.teams.filter(t => t !== value);
				updateFilter('teams', newTeams);
			} else {
				updateFilter('teams', []);
			}
		} else if (key === 'priority') {
			updateFilter('priority', null);
		} else if (key === 'coverageStatus') {
			updateFilter('coverageStatus', 'all');
		} else if (key === 'conflictsOnly') {
			updateFilter('conflictsOnly', false);
		} else if (key === 'myTeamsOnly') {
			updateFilter('myTeamsOnly', false);
		}
	}
	
	function clearAllFilters() {
		resetFilters();
	}
</script>

<div class="sticky top-0 z-30 bg-charcoal-950 border-b border-charcoal-700">
	<!-- Quick Filters & Sort -->
	<div class="px-4 py-2.5">
		<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
			<!-- Wave Filter -->
			<div class="relative flex-shrink-0">
				<button
					type="button"
					onclick={() => {
						if ($filters.wave === 'all') {
							updateFilter('wave', 'morning');
						} else if ($filters.wave === 'morning') {
							updateFilter('wave', 'afternoon');
						} else {
							updateFilter('wave', 'all');
						}
					}}
					class="px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-h-[40px] flex items-center justify-center border shadow-sm"
					class:bg-warning-500={$filters.wave === 'morning'}
					class:text-charcoal-950={$filters.wave === 'morning'}
					class:border-warning-500={$filters.wave === 'morning'}
					class:bg-brand-500={$filters.wave === 'afternoon'}
					class:text-white={$filters.wave === 'afternoon'}
					class:border-brand-500={$filters.wave === 'afternoon'}
					class:bg-charcoal-800={$filters.wave === 'all'}
					class:text-charcoal-300={$filters.wave === 'all'}
					class:border-charcoal-600={$filters.wave === 'all'}
					class:hover:bg-charcoal-700={$filters.wave === 'all'}
					class:hover:text-charcoal-50={$filters.wave === 'all'}
					aria-label={$filters.wave === 'all' ? 'Filter by wave' : $filters.wave === 'morning' ? 'Wave: Morning (AM)' : 'Wave: Afternoon (PM)'}
					title={$filters.wave === 'all' ? 'Filter by wave' : $filters.wave === 'morning' ? 'Wave: Morning (AM)' : 'Wave: Afternoon (PM)'}
				>
					<Clock size={16} />
				</button>
			</div>

			{#if isMediaValue}
				<!-- Priority Filter -->
				<div class="relative flex-shrink-0">
					<button
						type="button"
						onclick={() => updateFilter('priority', $filters.priority === 'must-cover' ? null : 'must-cover')}
						class="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-[40px] flex items-center gap-1.5 border shadow-sm"
						class:bg-brand-500={$filters.priority === 'must-cover'}
						class:text-white={$filters.priority === 'must-cover'}
						class:border-brand-500={$filters.priority === 'must-cover'}
						class:bg-charcoal-800={$filters.priority !== 'must-cover'}
						class:text-charcoal-300={$filters.priority !== 'must-cover'}
						class:border-charcoal-600={$filters.priority !== 'must-cover'}
						class:hover:bg-charcoal-700={$filters.priority !== 'must-cover'}
						class:hover:text-charcoal-50={$filters.priority !== 'must-cover'}
						aria-label="Filter by priority"
					>
						<Flag size={14} />
						<span>Priority</span>
					</button>
				</div>
			{/if}

			{#if isSpectatorValue && followedTeamsCount > 0}
				<!-- My Teams Filter -->
				<div class="relative flex-shrink-0">
					<button
						type="button"
						onclick={() => updateFilter('myTeamsOnly', !$filters.myTeamsOnly)}
						class="px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-h-[40px] flex items-center justify-center border shadow-sm"
						class:bg-brand-500={$filters.myTeamsOnly}
						class:text-white={$filters.myTeamsOnly}
						class:border-brand-500={$filters.myTeamsOnly}
						class:bg-charcoal-800={!$filters.myTeamsOnly}
						class:text-charcoal-300={!$filters.myTeamsOnly}
						class:border-charcoal-600={!$filters.myTeamsOnly}
						class:hover:bg-charcoal-700={!$filters.myTeamsOnly}
						class:hover:text-charcoal-50={!$filters.myTeamsOnly}
						aria-label={$filters.myTeamsOnly ? 'Filter to my teams only (active)' : 'Filter to my teams only'}
						title={$filters.myTeamsOnly ? 'Filter to my teams only (active)' : 'Filter to my teams only'}
					>
						<Star size={16} class={$filters.myTeamsOnly ? 'fill-current' : ''} />
					</button>
				</div>
			{/if}

			<!-- Sort Separator -->
			<div class="flex-shrink-0 h-6 w-px bg-charcoal-700 mx-1"></div>

			<!-- Sort: Team -->
			<button
				type="button"
				onclick={() => sort.setSortMode('team')}
				class="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-[40px] flex items-center gap-1.5 border shadow-sm"
				class:bg-gold-500={$sort === 'team'}
				class:text-charcoal-950={$sort === 'team'}
				class:border-gold-500={$sort === 'team'}
				class:bg-charcoal-800={$sort !== 'team'}
				class:text-charcoal-300={$sort !== 'team'}
				class:border-charcoal-600={$sort !== 'team'}
				class:hover:bg-charcoal-700={$sort !== 'team'}
				class:hover:text-charcoal-50={$sort !== 'team'}
				aria-label="Sort by team"
			>
				<span>Team</span>
				<ArrowUp size={14} />
			</button>

			<!-- Sort: Court -->
			<button
				type="button"
				onclick={() => sort.setSortMode('court')}
				class="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-[40px] flex items-center gap-1.5 border shadow-sm"
				class:bg-gold-500={$sort === 'court'}
				class:text-charcoal-950={$sort === 'court'}
				class:border-gold-500={$sort === 'court'}
				class:bg-charcoal-800={$sort !== 'court'}
				class:text-charcoal-300={$sort !== 'court'}
				class:border-charcoal-600={$sort !== 'court'}
				class:hover:bg-charcoal-700={$sort !== 'court'}
				class:hover:text-charcoal-50={$sort !== 'court'}
				aria-label="Sort by court"
			>
				<span>Court</span>
				<ArrowUp size={14} />
			</button>

			<!-- Search & Filters Button -->
			<button
				type="button"
				onclick={onOpenFullFilters}
				class="ml-auto px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-h-[40px] flex items-center justify-center flex-shrink-0 border shadow-sm"
				class:bg-brand-500={hasSearchQuery}
				class:text-white={hasSearchQuery}
				class:border-brand-500={hasSearchQuery}
				class:bg-charcoal-800={!hasSearchQuery}
				class:text-charcoal-300={!hasSearchQuery}
				class:border-charcoal-600={!hasSearchQuery}
				class:hover:bg-charcoal-700={!hasSearchQuery}
				class:hover:text-charcoal-50={!hasSearchQuery}
				aria-label={hasSearchQuery ? 'Search' : 'More filters'}
				title={hasSearchQuery ? 'Search' : 'More filters'}
			>
				<Search size={16} />
			</button>
		</div>
	</div>
	
	<!-- Active Filter Tags -->
	{#if activeFilters.length > 0}
		<div class="px-4 pb-2.5">
			<div class="flex items-center gap-2 flex-wrap">
				{#each activeFilters as filter}
					<button
						type="button"
						onclick={() => removeFilter(filter.key, filter.key === 'team' ? filter.value : undefined)}
						class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1.5 bg-gold-500/20 text-gold-400 border border-gold-500/50 hover:bg-gold-500/30"
						aria-label={`Remove ${filter.label} filter`}
					>
						<span>{filter.label}: {filter.value}</span>
						<span class="text-gold-500">×</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>

