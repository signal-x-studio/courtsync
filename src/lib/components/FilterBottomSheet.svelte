<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { filters, updateFilter, resetFilters, getUniqueDivisions, getUniqueTeams } from '$lib/stores/filters';
	import { userRole } from '$lib/stores/userRole';
	import { createSwipeHandler } from '$lib/utils/gestures';
	
	export let matches: any[];
	export let divisions: string[];
	export let teams: string[];
	export let open: boolean = false;
	export let onClose: () => void;
	
	let sheetElement: HTMLDivElement;
	let swipeHandler: ReturnType<typeof createSwipeHandler> | null = null;
	let swipeOffset = 0;
	let isSwiping = false;
	
	function getActiveFilterCount(): number {
		let count = 0;
		if ($filters.wave !== 'all') count++;
		if ($filters.division) count++;
		if ($filters.teams.length > 0) count++;
		if ($filters.timeRange.start || $filters.timeRange.end) count++;
		if ($filters.priority && $filters.priority !== 'all') count++;
		if ($filters.coverageStatus && $filters.coverageStatus !== 'all') count++;
		if ($filters.conflictsOnly) count++;
		if ($filters.myTeamsOnly) count++;
		return count;
	}
	
	$: activeFilterCount = getActiveFilterCount();
	
	onMount(() => {
		if (!sheetElement) return;
		
		swipeHandler = createSwipeHandler(
			(gesture) => {
				// Swipe down to dismiss
				if (gesture.direction === 'down' && gesture.distance > 100) {
					onClose();
				}
				// Reset swipe state
				swipeOffset = 0;
				isSwiping = false;
			},
			{
				onMove: (distance, direction) => {
					if (direction === 'down') {
						isSwiping = true;
						swipeOffset = Math.min(distance, 200); // Max 200px swipe
					}
				},
				onCancel: () => {
					swipeOffset = 0;
					isSwiping = false;
				}
			}
		);
		
		sheetElement.addEventListener('touchstart', swipeHandler.handleTouchStart, { passive: true });
		sheetElement.addEventListener('touchmove', swipeHandler.handleTouchMove, { passive: true });
		sheetElement.addEventListener('touchend', swipeHandler.handleTouchEnd, { passive: true });
		sheetElement.addEventListener('touchcancel', swipeHandler.handleTouchCancel, { passive: true });
		
		return () => {
			if (swipeHandler) {
				sheetElement.removeEventListener('touchstart', swipeHandler.handleTouchStart);
				sheetElement.removeEventListener('touchmove', swipeHandler.handleTouchMove);
				sheetElement.removeEventListener('touchend', swipeHandler.handleTouchEnd);
				sheetElement.removeEventListener('touchcancel', swipeHandler.handleTouchCancel);
				swipeHandler.destroy();
			}
		};
	});
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
		onclick={onClose}
		role="dialog"
		aria-modal="true"
		aria-label="Filter matches"
	>
		<!-- Bottom Sheet -->
		<div
			bind:this={sheetElement}
			class="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-charcoal-950 rounded-t-lg border-t border-charcoal-900 overflow-y-auto transform transition-transform backdrop-blur-sm"
			style="backdrop-filter: blur(8px); transform: translateY({swipeOffset}px);"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header with Drag Handle -->
			<div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-900 px-4 py-3 flex items-center justify-between z-10">
				<!-- Drag Handle -->
				<div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full"></div>
				<h2 class="text-lg font-semibold text-charcoal-50 ml-auto">Filters</h2>
				<div class="flex items-center gap-2 ml-auto">
					{#if activeFilterCount > 0}
						<span class="px-2 py-1 rounded-full bg-gold-500 text-charcoal-950 text-xs font-medium">
							{activeFilterCount}
						</span>
					{/if}
					<button
						type="button"
						onclick={onClose}
						class="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-900 transition-colors min-h-[44px]"
						aria-label="Close filters"
					>
						×
					</button>
				</div>
			</div>
			
			<!-- Filter Content -->
			<div class="p-4 space-y-4">
			<!-- Wave Filter -->
			<div>
				<label for="wave-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
					Wave
				</label>
				<div class="flex gap-2">
						<button
							onclick={() => updateFilter('wave', 'all')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.wave === 'all' ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							All
						</button>
						<button
							onclick={() => updateFilter('wave', 'morning')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.wave === 'morning' ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Morning
						</button>
						<button
							onclick={() => updateFilter('wave', 'afternoon')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.wave === 'afternoon' ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Afternoon
						</button>
					</div>
				</div>
				
				<!-- Division Filter -->
				<div>
					<label for="division-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Division
					</label>
					<select
						id="division-filter"
						value={$filters.division || ''}
						onchange={(e) => updateFilter('division', e.target.value || null)}
						class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
					>
						<option value="">All Divisions</option>
						{#each divisions as division}
							<option value={division}>{division}</option>
						{/each}
					</select>
				</div>
				
				<!-- Team Filter -->
				<div>
					<label for="team-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Team
					</label>
					<select
						id="team-filter"
						value={$filters.teams[0] || ''}
						onchange={(e) => updateFilter('teams', e.target.value ? [e.target.value] : [])}
						class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
					>
						<option value="">All Teams</option>
						{#each teams as team}
							<option value={team}>{team}</option>
						{/each}
					</select>
				</div>
				
			<!-- Time Range Filter -->
			<div>
				<label for="time-range-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
					Time Range
				</label>
				<div class="grid grid-cols-2 gap-2">
						<div>
							<label for="time-start" class="block text-xs text-charcoal-500 mb-1">Start</label>
						<input
							id="time-start"
							type="time"
							value={$filters.timeRange.start || ''}
							onchange={(e) => updateFilter('timeRange', { ...$filters.timeRange, start: e.target.value || null })}
							class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
						/>
						</div>
						<div>
							<label for="time-end" class="block text-xs text-charcoal-500 mb-1">End</label>
						<input
							id="time-end"
							type="time"
							value={$filters.timeRange.end || ''}
							onchange={(e) => updateFilter('timeRange', { ...$filters.timeRange, end: e.target.value || null })}
							class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
						/>
						</div>
					</div>
				</div>
				
			<!-- Priority Filter (Media Only) -->
			{#if $userRole === 'media'}
				<div>
					<label for="priority-filter-sheet" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Priority
					</label>
					<select
						id="priority-filter-sheet"
							value={$filters.priority || 'all'}
							onchange={(e) => updateFilter('priority', e.target.value === 'all' ? null : e.target.value)}
							class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
						>
							<option value="all">All Priorities</option>
							<option value="must-cover">Must Cover</option>
							<option value="priority">Priority</option>
							<option value="optional">Optional</option>
						</select>
					</div>
				{/if}
				
			<!-- Coverage Status Filter (Media Only) -->
			{#if $userRole === 'media'}
				<div>
					<label for="coverage-status-filter-sheet" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Coverage Status
					</label>
					<select
						id="coverage-status-filter-sheet"
							value={$filters.coverageStatus || 'all'}
							onchange={(e) => updateFilter('coverageStatus', e.target.value === 'all' ? null : e.target.value)}
							class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
						>
							<option value="all">All Status</option>
							<option value="uncovered">Uncovered</option>
							<option value="planned">Planned</option>
							<option value="covered">Covered</option>
						</select>
					</div>
				{/if}
				
				<!-- Conflicts Only Filter (Media Only) -->
				{#if $userRole === 'media'}
					<div>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={$filters.conflictsOnly}
								onchange={(e) => updateFilter('conflictsOnly', e.currentTarget.checked)}
								class="w-5 h-5 rounded border-charcoal-600 bg-charcoal-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-charcoal-950"
							/>
							<span class="text-sm text-charcoal-50">Show conflicts only</span>
						</label>
					</div>
				{/if}
			</div>
			
			<!-- Footer Actions -->
			<div class="sticky bottom-0 bg-charcoal-950 border-t border-charcoal-900 px-4 py-3 flex gap-3">
				<button
					onclick={() => { resetFilters(); }}
					class="flex-1 px-4 py-2 rounded-lg bg-charcoal-800 text-charcoal-50 border border-charcoal-700 font-medium transition-colors hover:bg-charcoal-700 min-h-[44px]"
				>
					Clear Filters
				</button>
				<button
					onclick={onClose}
					class="flex-1 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium transition-colors hover:bg-brand-600 min-h-[44px]"
				>
					Apply Filters
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Smooth slide-up animation */
	:global(.bottom-sheet-enter) {
		animation: slideUp 0.3s ease-out;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>

