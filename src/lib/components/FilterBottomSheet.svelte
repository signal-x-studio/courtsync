<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { filters, updateFilter, resetFilters, getUniqueDivisions, getUniqueCourts, getGroupedDivisions } from '$lib/stores/filters';
	import { userRole } from '$lib/stores/userRole';
	import { createSwipeHandler } from '$lib/utils/gestures';
	import type { FilteredMatch } from '$lib/types';
	
	export let divisions: string[] = [];
	export let teams: string[] = [];
	export let matches: FilteredMatch[] = [];
	export let open: boolean = false;
	export let onClose: () => void;

	$: courts = getUniqueCourts(matches);
	$: groupedDivisions = getGroupedDivisions(matches);
	$: availableAges = (() => {
		const ageSet = new Set<string>();
		groupedDivisions.forEach(group => {
			group.ages.forEach(ageGroup => {
				if (ageGroup.age !== 'Other') {
					ageSet.add(ageGroup.age);
				}
			});
		});
		return Array.from(ageSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
	})();
	
	let sheetElement: HTMLDivElement;
	let swipeHandler: ReturnType<typeof createSwipeHandler> | null = null;
	let swipeOffset = 0;
	let isSwiping = false;
	
	function getActiveFilterCount(): number {
		let count = 0;
		if ($filters.searchQuery) count++;
		if ($filters.wave !== 'all') count++;
		if ($filters.division) count++;
		if ($filters.divisionLevel) count++;
		if ($filters.divisionAge) count++;
		if ($filters.court) count++;
		if ($filters.teams.length > 0) count++;
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
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
		role="dialog"
		aria-modal="true"
		aria-label="Filter matches"
		tabindex="0"
	>
		<!-- Bottom Sheet -->
		<div
			bind:this={sheetElement}
			class="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-charcoal-950 rounded-t-lg border-t border-charcoal-900 overflow-y-auto transform transition-transform backdrop-blur-sm"
			style="backdrop-filter: blur(8px); transform: translateY({swipeOffset}px);"
			onclick={(e) => e.stopPropagation()}
			role="none"
		>
			<!-- Header with Drag Handle -->
			<div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-900 px-4 py-3 flex items-center justify-between z-10">
				<!-- Drag Handle -->
				<div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full"></div>
				<h2 class="text-lg font-semibold text-charcoal-50 ml-auto">Search & Filters</h2>
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
				<!-- Search Filter -->
				<div>
					<label for="search-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Search
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
							<svg class="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							id="search-filter"
							type="text"
							value={$filters.searchQuery || ''}
							oninput={(e) => updateFilter('searchQuery', e.currentTarget.value)}
							placeholder="Search by team or court"
							class="w-full pl-10 pr-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700 placeholder:text-charcoal-400"
							autofocus
						/>
						{#if $filters.searchQuery}
							<button
								type="button"
								onclick={() => updateFilter('searchQuery', '')}
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-charcoal-400 hover:text-charcoal-200 transition-colors"
								aria-label="Clear search"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
				
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
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.wave === 'morning' ? 'bg-warning-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Morning
						</button>
						<button
							onclick={() => updateFilter('wave', 'afternoon')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.wave === 'afternoon' ? 'bg-brand-500 text-white' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Afternoon
						</button>
					</div>
				</div>
				
				<!-- Division Level Filter -->
				<div>
					<label class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Division Level
					</label>
					<div class="flex gap-2">
						<button
							onclick={() => updateFilter('divisionLevel', null)}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {!$filters.divisionLevel ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							All
						</button>
						<button
							onclick={() => updateFilter('divisionLevel', $filters.divisionLevel === 'O' ? null : 'O')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.divisionLevel === 'O' ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Open
						</button>
						<button
							onclick={() => updateFilter('divisionLevel', $filters.divisionLevel === 'C' ? null : 'C')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.divisionLevel === 'C' ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Club
						</button>
						<button
							onclick={() => updateFilter('divisionLevel', $filters.divisionLevel === 'P' ? null : 'P')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.divisionLevel === 'P' ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							Premier
						</button>
					</div>
				</div>
				
				<!-- Division Age Filter -->
				{#if availableAges.length > 0}
					<div>
						<label class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
							Age Group
						</label>
						<div class="flex flex-wrap gap-2">
							<button
								onclick={() => updateFilter('divisionAge', null)}
								class="px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {!$filters.divisionAge ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
							>
								All Ages
							</button>
							{#each availableAges as age}
								<button
									onclick={() => updateFilter('divisionAge', $filters.divisionAge === age ? null : age)}
									class="px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] {$filters.divisionAge === age ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
								>
									U{age}
								</button>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Division Filter (Specific Division) -->
				<div>
					<label for="division-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Specific Division
					</label>
					<select
						id="division-filter"
						value={$filters.division || ''}
						onchange={(e) => updateFilter('division', e.target.value || null)}
						class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
					>
						<option value="">All Divisions</option>
						{#if groupedDivisions.length > 0}
							{#each groupedDivisions as group}
								<optgroup label={group.label}>
									{#each group.ages as ageGroup}
										{#each ageGroup.divisions as division}
											<option value={division}>{division}</option>
										{/each}
									{/each}
								</optgroup>
							{/each}
						{:else}
							{#each divisions as division}
								<option value={division}>{division}</option>
							{/each}
						{/if}
					</select>
				</div>
				
				<!-- Court Filter -->
				<div>
					<label for="court-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
						Court
					</label>
					<select
						id="court-filter"
						value={$filters.court || ''}
						onchange={(e) => updateFilter('court', e.target.value || null)}
						class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
					>
						<option value="">All Courts</option>
						{#each courts as court}
							<option value={court}>{court}</option>
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

