<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { priority } from '$lib/stores/priority';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import PrioritySelector from '$lib/components/PrioritySelector.svelte';
	import CoverageStatusSelector from '$lib/components/CoverageStatusSelector.svelte';
	import { get } from 'svelte/store';
	import { Star, ClipboardList, Check, AlertTriangle, Plus, X } from 'lucide-svelte';
	
	export let match: FilteredMatch;
	export let eventId: string;
	export let matches: FilteredMatch[] = [];
	
	let showPriorityMenu = false;
	let showStatusMenu = false;
	let priorityMenuElement: HTMLDivElement;
	let statusMenuElement: HTMLDivElement;
	
	$: teamId = getTeamIdentifier(match);
	$: currentPriority = priority.getPriority(match.MatchId);
	$: teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered';
	$: isInPlan = get(coveragePlan).has(match.MatchId);
	
	// Check for conflicts with other matches in plan
	$: planConflicts = (() => {
		const conflicts = new Map<number, number[]>();
		const selectedMatches = get(coveragePlan);
		
		// Only check conflicts if match is in plan
		if (!selectedMatches.has(match.MatchId)) {
			return conflicts;
		}
		
		// Find conflicts with other matches in the plan
		const otherPlanMatches = matches.filter(m => 
			m.MatchId !== match.MatchId && selectedMatches.has(m.MatchId)
		);
		
		for (const otherMatch of otherPlanMatches) {
			const overlaps =
				match.ScheduledStartDateTime < otherMatch.ScheduledEndDateTime &&
				match.ScheduledEndDateTime > otherMatch.ScheduledStartDateTime;
			
			const differentCourts = match.CourtId !== otherMatch.CourtId;
			
			if (overlaps && differentCourts) {
				const existing = conflicts.get(match.MatchId) || [];
				conflicts.set(match.MatchId, [...existing, otherMatch.MatchId]);
			}
		}
		
		return conflicts;
	})();
	$: hasConflict = planConflicts.has(match.MatchId);
	
	function handlePriorityChange(matchId: number, newPriority: typeof currentPriority) {
		priority.setPriority(matchId, newPriority);
		showPriorityMenu = false;
	}
	
	function handleStatusChange(teamId: string, newStatus: typeof teamCoverageStatus) {
		coverageStatus.setTeamStatus(teamId, newStatus);
		showStatusMenu = false;
	}
	
	function handleTogglePlan() {
		coveragePlan.toggleMatch(match.MatchId);
		if (!isInPlan) {
			// Auto-mark as planned when added to plan
			if (teamId) {
				coverageStatus.setTeamStatus(teamId, 'planned');
			}
		}
	}
	
	// Close menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (priorityMenuElement && !priorityMenuElement.contains(event.target as Node)) {
			showPriorityMenu = false;
		}
		if (statusMenuElement && !statusMenuElement.contains(event.target as Node)) {
			showStatusMenu = false;
		}
	}
	
	$: if (typeof window !== 'undefined') {
		if (showPriorityMenu || showStatusMenu) {
			window.addEventListener('click', handleClickOutside);
		} else {
			window.removeEventListener('click', handleClickOutside);
		}
	}
</script>

<div class="space-y-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-charcoal-50">Photographer Tools</h2>
	</div>
	
	<!-- Priority Management -->
	<div>
		<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
			Set Priority
		</div>
		<div class="relative">
			<button
				type="button"
				onclick={() => { showPriorityMenu = !showPriorityMenu; showStatusMenu = false; }}
				class="w-full px-4 py-3 rounded-lg border transition-colors min-h-[44px] flex items-center justify-between {currentPriority === 'must-cover' ? 'border-gold-500 bg-gold-500/10' : currentPriority === 'priority' ? 'border-amber-500 bg-amber-500/10' : 'border-charcoal-700 bg-charcoal-800'}"
			>
				<div class="flex items-center gap-2">
					{#if currentPriority === 'must-cover'}
						<Star size={18} class="text-gold-500 fill-current" />
						<span class="font-medium text-charcoal-50">Must Cover</span>
					{:else if currentPriority === 'priority'}
						<Star size={18} class="text-amber-500" />
						<span class="font-medium text-charcoal-50">Priority</span>
					{:else}
						<Star size={18} class="text-charcoal-400" />
						<span class="text-charcoal-300">No Priority</span>
					{/if}
				</div>
				<svg class="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			
			{#if showPriorityMenu}
				<div bind:this={priorityMenuElement} class="absolute top-full left-0 right-0 mt-2 z-20">
					<PrioritySelector
						matchId={match.MatchId}
						{currentPriority}
						onPriorityChange={handlePriorityChange}
						onClose={() => showPriorityMenu = false}
					/>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Coverage Planning -->
	<div>
		<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
			Coverage Planning
		</div>
		<div class="space-y-2">
			<!-- Add to Plan Button -->
			<button
				type="button"
				onclick={handleTogglePlan}
				class="w-full px-4 py-3 rounded-lg border transition-colors min-h-[44px] flex items-center justify-center gap-2 {isInPlan ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-charcoal-700 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-50'}"
			>
				{#if isInPlan}
					<X size={18} />
					<span class="font-medium">Remove from Plan</span>
				{:else}
					<Plus size={18} />
					<span class="font-medium">Add to Coverage Plan</span>
				{/if}
			</button>
			
			<!-- Coverage Status -->
			{#if teamId}
				<div class="relative">
					<button
						type="button"
						onclick={() => { showStatusMenu = !showStatusMenu; showPriorityMenu = false; }}
						class="w-full px-4 py-3 rounded-lg border transition-colors min-h-[44px] flex items-center justify-between {teamCoverageStatus === 'covered' ? 'border-green-500 bg-green-500/10' : teamCoverageStatus === 'planned' ? 'border-gold-500 bg-gold-500/10' : teamCoverageStatus === 'partially-covered' ? 'border-amber-500 bg-amber-500/10' : 'border-charcoal-700 bg-charcoal-800'}"
					>
						<div class="flex items-center gap-2">
							{#if teamCoverageStatus === 'covered'}
								<Check size={18} class="text-green-400" />
								<span class="font-medium text-charcoal-50">Covered</span>
							{:else if teamCoverageStatus === 'planned'}
								<ClipboardList size={18} class="text-gold-400" />
								<span class="font-medium text-charcoal-50">Planned</span>
							{:else if teamCoverageStatus === 'partially-covered'}
								<AlertTriangle size={18} class="text-amber-400" />
								<span class="font-medium text-charcoal-50">Partially Covered</span>
							{:else}
								<ClipboardList size={18} class="text-charcoal-400" />
								<span class="text-charcoal-300">Not Covered</span>
							{/if}
						</div>
						<svg class="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					
					{#if showStatusMenu}
						<div bind:this={statusMenuElement} class="absolute top-full left-0 right-0 mt-2 z-20">
							<CoverageStatusSelector
								{teamId}
								currentStatus={teamCoverageStatus}
								onStatusChange={handleStatusChange}
								onClose={() => showStatusMenu = false}
							/>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Conflict Warning -->
	{#if hasConflict}
		<div class="px-4 py-3 rounded-lg border border-warning-500 bg-warning-500/10">
			<div class="flex items-start gap-2">
				<AlertTriangle size={18} class="text-warning-500 flex-shrink-0 mt-0.5" />
				<div class="flex-1">
					<div class="text-sm font-medium text-warning-400 mb-1">Schedule Conflict</div>
					<div class="text-xs text-charcoal-300">
						This match conflicts with other matches in your coverage plan.
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

