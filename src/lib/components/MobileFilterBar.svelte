<script lang="ts">
	import { filters, updateFilter, resetFilters } from '$lib/stores/filters';
	import { userRole } from '$lib/stores/userRole';
	
	export let onOpenFullFilters: () => void;
	
	function getActiveFilters(): Array<{ key: string; label: string; value: string }> {
		const active: Array<{ key: string; label: string; value: string }> = [];
		
		if ($filters.wave !== 'all') {
			active.push({
				key: 'wave',
				label: 'Wave',
				value: $filters.wave === 'morning' ? 'Morning' : 'Afternoon'
			});
		}
		
		if ($filters.division) {
			active.push({
				key: 'division',
				label: 'Division',
				value: $filters.division
			});
		}
		
		if ($filters.teams.length > 0) {
			$filters.teams.forEach(team => {
				active.push({
					key: 'team',
					label: 'Team',
					value: team
				});
			});
		}
		
		if ($filters.priority && $filters.priority !== 'all') {
			active.push({
				key: 'priority',
				label: 'Priority',
				value: $filters.priority === 'must-cover' ? 'Must Cover' : $filters.priority === 'priority' ? 'Priority' : 'Optional'
			});
		}
		
		if ($filters.coverageStatus && $filters.coverageStatus !== 'all') {
			active.push({
				key: 'coverageStatus',
				label: 'Status',
				value: $filters.coverageStatus === 'uncovered' ? 'Uncovered' : $filters.coverageStatus === 'planned' ? 'Planned' : 'Covered'
			});
		}
		
		if ($filters.conflictsOnly) {
			active.push({
				key: 'conflictsOnly',
				label: 'Conflicts',
				value: 'Only'
			});
		}
		
		return active;
	}
	
	$: activeFilters = getActiveFilters();
	$: isMediaValue = $userRole === 'media';
	
	function removeFilter(key: string, value?: string) {
		if (key === 'wave') {
			updateFilter('wave', 'all');
		} else if (key === 'division') {
			updateFilter('division', null);
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
		}
	}
	
	function clearAllFilters() {
		resetFilters();
	}
</script>

<div class="sticky top-0 z-30 bg-charcoal-950 border-b border-charcoal-700 py-2 px-3">
	<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
		<!-- Quick Filter Buttons -->
		<div class="flex items-center gap-2 flex-shrink-0">
			<!-- Wave Quick Filters -->
			<button
				type="button"
				onclick={() => updateFilter('wave', $filters.wave === 'morning' ? 'all' : 'morning')}
				class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center"
				class:bg-gold-500={$filters.wave === 'morning'}
				class:text-charcoal-950={$filters.wave === 'morning'}
				class:bg-charcoal-800={$filters.wave !== 'morning'}
				class:text-charcoal-300={$filters.wave !== 'morning'}
				class:hover:bg-charcoal-700={$filters.wave !== 'morning'}
			>
				AM
			</button>
			<button
				type="button"
				onclick={() => updateFilter('wave', $filters.wave === 'afternoon' ? 'all' : 'afternoon')}
				class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center"
				class:bg-gold-500={$filters.wave === 'afternoon'}
				class:text-charcoal-950={$filters.wave === 'afternoon'}
				class:bg-charcoal-800={$filters.wave !== 'afternoon'}
				class:text-charcoal-300={$filters.wave !== 'afternoon'}
				class:hover:bg-charcoal-700={$filters.wave !== 'afternoon'}
			>
				PM
			</button>
			
			{#if isMediaValue}
				<!-- Priority Quick Filter -->
				<button
					type="button"
					onclick={() => updateFilter('priority', $filters.priority === 'must-cover' ? null : 'must-cover')}
					class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1"
					class:bg-gold-500={$filters.priority === 'must-cover'}
					class:text-charcoal-950={$filters.priority === 'must-cover'}
					class:bg-charcoal-800={$filters.priority !== 'must-cover'}
					class:text-charcoal-300={$filters.priority !== 'must-cover'}
					class:hover:bg-charcoal-700={$filters.priority !== 'must-cover'}
				>
					⭐ Must Cover
				</button>
				
				<!-- Conflicts Only Filter -->
				<button
					type="button"
					onclick={() => updateFilter('conflictsOnly', !$filters.conflictsOnly)}
					class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1"
					class:bg-warning-500={$filters.conflictsOnly}
					class:text-charcoal-950={$filters.conflictsOnly}
					class:bg-charcoal-800={!$filters.conflictsOnly}
					class:text-charcoal-300={!$filters.conflictsOnly}
					class:hover:bg-charcoal-700={!$filters.conflictsOnly}
				>
					⚠️ Conflicts
				</button>
			{/if}
		</div>
		
		<!-- Active Filter Chips -->
		{#if activeFilters.length > 0}
			<div class="flex items-center gap-2 flex-shrink-0">
				{#each activeFilters as filter}
					<button
						type="button"
						onclick={() => removeFilter(filter.key, filter.key === 'team' ? filter.value : undefined)}
						class="group px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1.5 bg-gold-500/20 text-gold-400 border border-gold-500/50 hover:bg-gold-500/30"
					>
						<span>{filter.label}: {filter.value}</span>
						<span class="text-gold-500 group-hover:text-gold-300">×</span>
					</button>
				{/each}
			</div>
		{/if}
		
		<!-- More Filters Button -->
		<button
			type="button"
			onclick={onOpenFullFilters}
			class="ml-auto px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1.5 flex-shrink-0 bg-charcoal-800 text-charcoal-300 border border-charcoal-700 hover:bg-charcoal-700 hover:text-charcoal-200"
		>
			🔍 More
		</button>
	</div>
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

