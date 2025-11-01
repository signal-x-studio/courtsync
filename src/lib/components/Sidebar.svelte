<script lang="ts">
	import { filters, updateFilter, resetFilters, getUniqueDivisions, getUniqueTeams } from '$lib/stores/filters';
	import { userRole } from '$lib/stores/userRole';
	import type { FilteredMatch } from '$lib/types';
	
	export let matches: FilteredMatch[];
	export let collapsed: boolean = false;
	export let onToggle: () => void;
	
	// Get unique divisions and teams
	$: divisions = getUniqueDivisions(matches);
	$: teams = getUniqueTeams(matches);
	
	// Calculate quick stats
	$: conflictCount = (() => {
		const conflicts = new Map<number, number[]>();
		matches.forEach((match1, i) => {
			matches.slice(i + 1).forEach((match2) => {
				const overlaps =
					match1.ScheduledStartDateTime < match2.ScheduledEndDateTime &&
					match1.ScheduledEndDateTime > match2.ScheduledStartDateTime;
				if (overlaps) {
					if (!conflicts.has(match1.MatchId)) conflicts.set(match1.MatchId, []);
					conflicts.get(match1.MatchId)!.push(match2.MatchId);
				}
			});
		});
		return matches.filter(m => conflicts.has(m.MatchId)).length;
	})();
	
	$: activeFilterCount = (() => {
		let count = 0;
		if ($filters.wave !== 'all') count++;
		if ($filters.division) count++;
		if ($filters.teams.length > 0) count++;
		if ($filters.timeRange.start || $filters.timeRange.end) count++;
		if ($filters.priority && $filters.priority !== 'all') count++;
		if ($filters.coverageStatus && $filters.coverageStatus !== 'all') count++;
		return count;
	})();
</script>

<aside
	class="hidden lg:flex flex-col h-[calc(100vh-64px)] border-r transition-all duration-300 overflow-hidden bg-surface-100 border-charcoal-900"
	class:w-64={!collapsed}
	class:w-16={collapsed}
	style="max-width: 250px;"
>
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-charcoal-900">
		{#if !collapsed}
			<h2 class="text-sm font-semibold uppercase tracking-wider text-charcoal-50">Filters</h2>
		{:else}
			<div class="w-6 h-6 flex items-center justify-center">
				<span class="text-lg">🎯</span>
			</div>
		{/if}
		<button
			onclick={onToggle}
			class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-surface-200"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				→
			{:else}
				←
			{/if}
		</button>
	</div>
	
	<!-- Filters Section -->
	{#if !collapsed}
		<div class="flex-1 overflow-y-auto p-4 space-y-3">
			<!-- Wave Filter -->
			<div class="pb-3 border-b border-charcoal-900">
				<label class="block text-xs font-medium uppercase tracking-wider mb-2 text-left text-charcoal-300">Wave</label>
				<div class="flex gap-2">
					<button
						onclick={() => updateFilter('wave', 'all')}
						class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {$filters.wave === 'all' ? 'bg-gold-500 text-charcoal-950' : 'bg-surface-200 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-900'}"
					>
						All
					</button>
					<button
						onclick={() => updateFilter('wave', 'morning')}
						class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {$filters.wave === 'morning' ? 'bg-gold-500 text-charcoal-950' : 'bg-surface-200 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-900'}"
					>
						AM
					</button>
					<button
						onclick={() => updateFilter('wave', 'afternoon')}
						class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {$filters.wave === 'afternoon' ? 'bg-gold-500 text-charcoal-950' : 'bg-surface-200 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-900'}"
					>
						PM
					</button>
				</div>
			</div>
			
			<!-- Division Filter -->
			<div class="pb-3 border-b border-charcoal-900">
				<label for="sidebar-division" class="block text-xs font-medium uppercase tracking-wider mb-2 text-left text-charcoal-300">Division</label>
				<select
					id="sidebar-division"
					value={$filters.division || ''}
					onchange={(e) => updateFilter('division', e.target.value || null)}
					class="w-full px-3 py-2 rounded-lg text-sm focus:border-brand-500 focus:outline-none text-left bg-surface-200 text-charcoal-50 border border-charcoal-900"
				>
					<option value="">All Divisions</option>
					{#each divisions as division}
						<option value={division}>{division}</option>
					{/each}
				</select>
			</div>

			<!-- Team Filter -->
			<div class="pb-3 border-b border-charcoal-900">
				<label for="sidebar-team" class="block text-xs font-medium uppercase tracking-wider mb-2 text-left text-charcoal-300">Team</label>
				<select
					id="sidebar-team"
					value={$filters.teams[0] || ''}
					onchange={(e) => updateFilter('teams', e.target.value ? [e.target.value] : [])}
					class="w-full px-3 py-2 rounded-lg text-sm focus:border-brand-500 focus:outline-none text-left bg-surface-200 text-charcoal-50 border border-charcoal-900"
				>
					<option value="">All Teams</option>
					{#each teams as team}
						<option value={team}>{team}</option>
					{/each}
				</select>
			</div>

			<!-- Time Range Filter -->
			<div class="pb-3 border-b border-charcoal-900">
				<label class="block text-xs font-medium uppercase tracking-wider mb-2 text-left text-charcoal-300">Time Range</label>
				<div class="space-y-2">
					<div>
						<label for="sidebar-time-start" class="block text-xs mb-1 text-charcoal-500">Start</label>
						<input
							id="sidebar-time-start"
							type="time"
							value={$filters.timeRange.start || ''}
							onchange={(e) => updateFilter('timeRange', { ...$filters.timeRange, start: e.target.value || null })}
							class="w-full px-3 py-2 rounded-lg text-sm focus:border-brand-500 focus:outline-none bg-surface-200 text-charcoal-50 border border-charcoal-900"
						/>
					</div>
					<div>
						<label for="sidebar-time-end" class="block text-xs mb-1" style="color: #6e6e73;">End</label>
						<input
							id="sidebar-time-end"
							type="time"
							value={$filters.timeRange.end || ''}
							onchange={(e) => updateFilter('timeRange', { ...$filters.timeRange, end: e.target.value || null })}
							class="w-full px-3 py-2 rounded-lg text-sm focus:border-[#eab308] focus:outline-none"
							style="background-color: #252529; color: #f5f5f7; border: 1px solid #2a2a2f;"
						/>
					</div>
				</div>
			</div>
			
			<!-- Clear Filters Button -->
			{#if activeFilterCount > 0}
				<button
					onclick={() => resetFilters()}
					class="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
					style="background-color: #252529; color: #a1a1a6; border: 1px solid #2a2a2f;"
				>
					Clear Filters ({activeFilterCount})
				</button>
			{/if}
		</div>
	{:else}
		<!-- Collapsed: Show icons only -->
		<div class="flex-1 overflow-y-auto p-2 space-y-2">
			<button
				onclick={() => updateFilter('wave', $filters.wave === 'morning' ? 'afternoon' : 'morning')}
				class="w-12 h-12 flex items-center justify-center rounded-lg transition-colors"
				style="background-color: #252529; color: #a1a1a6;"
				title="Toggle Wave"
			>
				🌊
			</button>
			{#if activeFilterCount > 0}
				<div class="w-12 h-12 flex items-center justify-center rounded-lg" style="background-color: #252529;">
					<span class="text-xs font-medium" style="color: #eab308;">{activeFilterCount}</span>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Quick Stats Section -->
	<div class="p-4 border-t" style="border-color: #2a2a2f;">
		{#if !collapsed}
			<h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: #a1a1a6;">Quick Stats</h3>
			<div class="space-y-3">
				<div class="p-3 rounded-lg border" style="background-color: #252529; border-color: #2a2a2f;">
					<div class="text-xs mb-1" style="color: #6e6e73;">Total Matches</div>
					<div class="text-xl font-bold" style="color: #f5f5f7;">{matches.length}</div>
				</div>
				{#if conflictCount > 0}
					<div class="p-3 rounded-lg border" style="background-color: #252529; border-color: #2a2a2f;">
						<div class="text-xs mb-1" style="color: #6e6e73;">Conflicts</div>
						<div class="text-xl font-bold" style="color: #ef4444;">{conflictCount}</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Collapsed: Stats icons -->
			<div class="space-y-2">
				<div class="w-12 h-12 flex flex-col items-center justify-center rounded-lg" style="background-color: #252529;">
					<span class="text-xs font-medium" style="color: #f5f5f7;">{matches.length}</span>
					<span class="text-xs" style="color: #6e6e73;">📊</span>
				</div>
				{#if conflictCount > 0}
					<div class="w-12 h-12 flex flex-col items-center justify-center rounded-lg" style="background-color: #252529;">
						<span class="text-xs font-medium" style="color: #ef4444;">{conflictCount}</span>
						<span class="text-xs" style="color: #6e6e73;">⚠️</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</aside>

<style>
	.w-70 {
		width: 17.5rem; /* 280px */
	}
</style>

