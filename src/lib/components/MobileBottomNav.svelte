<script lang="ts">
	import { userRole, isMedia, isCoach } from '$lib/stores/userRole';
	import { selectedCount } from '$lib/stores/coveragePlan';
	import { filters } from '$lib/stores/filters';
	import { followedTeams } from '$lib/stores/followedTeams';
	import { ClipboardList, Calendar, CalendarDays, Search, Settings, Star } from 'lucide-svelte';
	
	export let activeTab: 'matches' | 'plan' | 'filters' | 'more' | 'myTeams' = 'matches';
	export let onTabChange: (tab: 'matches' | 'plan' | 'filters' | 'more' | 'myTeams') => void;
	
	let activeFilterCount = 0;
	
	function getActiveFilterCount(): number {
		let count = 0;
		if ($filters.wave !== 'all') count++;
		if ($filters.division) count++;
		if ($filters.court) count++;
		if ($filters.teams.length > 0) count++;
		if ($filters.timeRange.start || $filters.timeRange.end) count++;
		if ($filters.priority && $filters.priority !== 'all') count++;
		if ($filters.coverageStatus && $filters.coverageStatus !== 'all') count++;
		if ($filters.conflictsOnly) count++;
		// Only count myTeamsOnly if there are actually favorited teams
		if ($filters.myTeamsOnly && followedTeamsCount > 0) count++;
		if ($filters.searchQuery) count++;
		return count;
	}
	
	$: activeFilterCount = getActiveFilterCount();
	$: isMediaValue = $isMedia;
	$: isCoachValue = $isCoach;
	$: selectedCountValue = $selectedCount;
	$: followedTeamsCount = $followedTeams?.length || 0;
	$: showMyTeamsTab = $userRole === 'spectator' && followedTeamsCount > 0;
	
	// Role-based navigation tabs
	$: tabs = isMediaValue
		? [
				{ id: 'matches' as const, label: 'Matches', icon: ClipboardList },
				{ id: 'plan' as const, label: 'Schedule', icon: CalendarDays, badge: selectedCountValue > 0 ? selectedCountValue : undefined },
				{ id: 'filters' as const, label: 'Filters', icon: Search, badge: activeFilterCount > 0 ? activeFilterCount : undefined },
				{ id: 'more' as const, label: 'More', icon: Settings }
		  ]
		: isCoachValue
		? [
				{ id: 'matches' as const, label: 'Schedule', icon: Calendar },
				{ id: 'more' as const, label: 'More', icon: Settings }
		  ]
		: showMyTeamsTab
		? [
				{ id: 'matches' as const, label: 'Matches', icon: ClipboardList },
				{ id: 'myTeams' as const, label: 'My Teams', icon: Star },
				{ id: 'filters' as const, label: 'Filters', icon: Search, badge: activeFilterCount > 0 ? activeFilterCount : undefined },
				{ id: 'more' as const, label: 'More', icon: Settings }
		  ]
		: [
				{ id: 'matches' as const, label: 'Matches', icon: ClipboardList },
				{ id: 'filters' as const, label: 'Filters', icon: Search, badge: activeFilterCount > 0 ? activeFilterCount : undefined },
				{ id: 'more' as const, label: 'More', icon: Settings }
		  ];
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 bg-charcoal-900 border-t border-charcoal-700"
	style="padding-bottom: env(safe-area-inset-bottom);"
	aria-label="Main navigation"
>
	<div class="flex items-center justify-around h-16" role="tablist">
		{#each tabs as tab}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.id}
				aria-label={tab.label}
				onclick={() => onTabChange(tab.id)}
				class="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors"
				class:text-gold-500={activeTab === tab.id}
				class:text-charcoal-400={activeTab !== tab.id}
			>
				{#if activeTab === tab.id}
					<div class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gold-500 rounded-b-full"></div>
				{/if}
				<div class="flex items-center justify-center relative">
					<svelte:component this={tab.icon} size={20} class={activeTab === tab.id ? 'text-gold-500' : 'text-charcoal-400'} />
					{#if tab.badge && tab.badge > 0}
						<span
							class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gold-500 text-charcoal-950 text-[10px] font-bold rounded-full"
						>
							{tab.badge > 99 ? '99+' : tab.badge}
						</span>
					{/if}
				</div>
				<span class="text-[10px] font-medium mt-0.5">{tab.label}</span>
			</button>
		{/each}
	</div>
</nav>

<style>
	nav button {
		touch-action: manipulation;
	}
	
	nav button:active {
		opacity: 0.7;
		transform: scale(0.95);
	}
</style>

