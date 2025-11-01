<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { fetchCourtSchedule, fetchEventInfo } from '$lib/services/api';
	import { filterClubMatches } from '$lib/utils/matchFilters';
	import { formatMatchDate } from '$lib/utils/dateUtils';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import { selectedCount } from '$lib/stores/coveragePlan';
	import type { FilteredMatch } from '$lib/types';
	
	import EventInput from '$lib/components/EventInput.svelte';
	import MatchList from '$lib/components/MatchList.svelte';
	import TimelineView from '$lib/components/TimelineView.svelte';
	import CoveragePlanPanel from '$lib/components/CoveragePlanPanel.svelte';
	import CoachView from '$lib/components/CoachView.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import MobileBottomNav from '$lib/components/MobileBottomNav.svelte';
	import FilterBottomSheet from '$lib/components/FilterBottomSheet.svelte';
	import MobileFilterBar from '$lib/components/MobileFilterBar.svelte';
	import { getUniqueDivisions, getUniqueTeams } from '$lib/stores/filters';
	
	let eventId = 'PTAwMDAwNDEzMTQ90';
	let date = '2025-11-01';
	let timeWindow = 300;
	let matches: FilteredMatch[] = [];
	let loading = false;
	let error: string | null = null;
	let viewMode: 'list' | 'timeline' = 'list';
	let showConfig = false;
	let clubId = 24426; // 630 Volleyball club ID
	let selectedTeam: FilteredMatch | null = null;
	let showCoveragePlan = false;
	let eventInfo: { name?: string; startDate?: string; endDate?: string } | null = null;
	let headerCollapsed = true; // Mobile: start collapsed
	let lastScrollY = 0;
	let sidebarCollapsed = false; // Desktop: start expanded
	let activeTab: 'matches' | 'plan' | 'filters' | 'more' = 'matches';
	let showFilterSheet = false;
	let showMoreMenu = false;
	
	// Get unique divisions and teams for filter sheet
	$: divisions = getUniqueDivisions(matches);
	$: teams = getUniqueTeams(matches);
	
	function handleTabChange(tab: 'matches' | 'plan' | 'filters' | 'more') {
		// If clicking same tab, close it
		if (activeTab === tab) {
			if (tab === 'filters') {
				showFilterSheet = false;
			} else if (tab === 'plan') {
				showCoveragePlan = false;
			} else if (tab === 'more') {
				showMoreMenu = false;
			}
			activeTab = 'matches';
		} else {
			activeTab = tab;
			if (tab === 'filters') {
				showFilterSheet = true;
				showCoveragePlan = false;
				showMoreMenu = false;
			} else if (tab === 'plan') {
				showCoveragePlan = true;
				showFilterSheet = false;
				showMoreMenu = false;
			} else if (tab === 'more') {
				showMoreMenu = true;
				showFilterSheet = false;
				showCoveragePlan = false;
			} else {
				showFilterSheet = false;
				showMoreMenu = false;
				showCoveragePlan = false;
			}
		}
	}
	
	function closeFilterSheet() {
		showFilterSheet = false;
		activeTab = 'matches';
	}
	
	function closeCoveragePlan() {
		showCoveragePlan = false;
		activeTab = 'matches';
	}
	
	function closeMoreMenu() {
		showMoreMenu = false;
		activeTab = 'matches';
	}
	
	// Auto-collapse header on scroll (mobile only)
	function handleScroll() {
		if (typeof window === 'undefined') return;
		const currentScrollY = window.scrollY;
		
		// Only auto-collapse on mobile
		if (window.innerWidth < 768) {
			if (currentScrollY > lastScrollY && currentScrollY > 100) {
				// Scrolling down - collapse header
				headerCollapsed = true;
			} else if (currentScrollY < lastScrollY) {
				// Scrolling up - can expand
				// Don't auto-expand, let user control
			}
		}
		
		lastScrollY = currentScrollY;
	}
	
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', handleScroll, { passive: true });
		}
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('scroll', handleScroll);
			}
		};
	});
	
	// Auto-update coverage status when plan changes
	$: if (matches.length > 0) {
		const teamMatches = new Map<string, { total: number; inPlan: number }>();
		
		matches.forEach(match => {
			const teamText = match.InvolvedTeam === 'first' 
				? match.FirstTeamText 
				: match.SecondTeamText;
			const matchResult = teamText.match(/(\d+-\d+)/);
			const teamId = matchResult ? matchResult[1] : '';
			
			if (!teamId) return;
			
			const stats = teamMatches.get(teamId) || { total: 0, inPlan: 0 };
			stats.total++;
			
			// Check if match is selected
			let isSelected = false;
			coveragePlan.subscribe(plan => {
				isSelected = plan.has(match.MatchId);
			})();
			
			if (isSelected) {
				stats.inPlan++;
			}
			teamMatches.set(teamId, stats);
		});
		
		// Update coverage status for each team
		teamMatches.forEach((stats, teamId) => {
			coverageStatus.updateFromPlan(teamId, stats.inPlan, stats.total);
		});
	}
	
	// Auto-load on mount
	onMount(() => {
		handleLoad(eventId, date, timeWindow);
	});
	
	async function handleLoad(
		newEventId: string,
		newDate: string,
		newTimeWindow: number
	) {
		loading = true;
		error = null;
		eventId = newEventId;
		date = newDate;
		timeWindow = newTimeWindow;

		try {
			// Fetch event info to get club ID and event details
			const eventInfoData = await fetchEventInfo(newEventId);
			const club = eventInfoData.Clubs?.find((c: any) => c.Name === '630 Volleyball');
			if (club) {
				clubId = club.ClubId;
			}

			// Store event info for display
			eventInfo = {
				name: eventInfoData.Name || eventInfoData.EventName || eventInfoData.FullName || eventInfoData.Title || 'Event',
				startDate: eventInfoData.StartDate || eventInfoData.StartDateTime || eventInfoData.Start || eventInfoData.StartTime,
				endDate: eventInfoData.EndDate || eventInfoData.EndDateTime || eventInfoData.End || eventInfoData.EndTime,
			};

			const data = await fetchCourtSchedule(newEventId, newDate, newTimeWindow);
			const filteredMatches = filterClubMatches(data.CourtSchedules);
			matches = filteredMatches;
		} catch (err) {
			console.error('Error loading schedule:', err);
			error = err instanceof Error ? err.message : 'Failed to load schedule';
			matches = [];
		} finally {
			loading = false;
		}
	}
	
	function handleExportJSON() {
		const dataStr = JSON.stringify(matches, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `630-volleyball-matches-${date}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	function handleExportCSV() {
		const headers = [
			'Match ID',
			'Division',
			'Short Name',
			'First Team',
			'Second Team',
			'Work Team',
			'Court',
			'Start Time',
			'End Time',
			'Duration',
			'Involved Team',
		];

		const rows = matches.map((match) => [
			match.MatchId.toString(),
			match.Division.Name,
			match.CompleteShortName,
			match.FirstTeamText,
			match.SecondTeamText,
			match.WorkTeamText,
			match.CourtName,
			new Date(match.ScheduledStartDateTime).toISOString(),
			new Date(match.ScheduledEndDateTime).toISOString(),
			((match.ScheduledEndDateTime - match.ScheduledStartDateTime) / 60000).toString(),
			match.InvolvedTeam,
		]);

		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
		].join('\n');

		const dataBlob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `630-volleyball-matches-${date}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
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
	
	$: selectedCountValue = $selectedCount;
	$: isMediaValue = $isMedia;
	$: isSpectatorValue = $isSpectator;
	$: isCoachValue = $isCoach;
	$: userRoleValue = $userRole;
	
	// Reactive statement for coverage status updates
	$: if (matches.length > 0 && selectedCountValue !== undefined) {
		const teamMatches = new Map<string, { total: number; inPlan: number }>();
		const currentPlan = get(coveragePlan);
		
		matches.forEach(match => {
			const teamText = match.InvolvedTeam === 'first' 
				? match.FirstTeamText 
				: match.SecondTeamText;
			const matchResult = teamText.match(/(\d+-\d+)/);
			const teamId = matchResult ? matchResult[1] : '';
			
			if (!teamId) return;
			
			const stats = teamMatches.get(teamId) || { total: 0, inPlan: 0 };
			stats.total++;
			
			if (currentPlan.has(match.MatchId)) {
				stats.inPlan++;
			}
			teamMatches.set(teamId, stats);
		});
		
		teamMatches.forEach((stats, teamId) => {
			coverageStatus.updateFromPlan(teamId, stats.inPlan, stats.total);
		});
	}
</script>

<div class="min-h-screen bg-charcoal-950 pb-20">
	<!-- Mobile Header -->
	<MobileHeader
		eventName={eventInfo?.name || null}
		matchCount={matches.length}
		conflictCount={conflictCount}
		collapsed={headerCollapsed}
		onToggle={() => headerCollapsed = !headerCollapsed}
	/>
	
	<!-- Desktop Header (hidden on mobile) -->
	<header 
		data-header 
		class="hidden md:block border-b sticky top-0 z-10 transition-all duration-300 border-charcoal-700 glass-medium" 
		class:collapsed={headerCollapsed}
		class:glassmorphism={!headerCollapsed}
	>
		<!-- Glassmorphism effect -->
		<style>
			/* Mobile: Lighter glassmorphism */
			@media (max-width: 639px) {
				header.glassmorphism {
					backdrop-filter: blur(10px);
					background-color: rgba(37, 37, 41, 0.85);
					border-bottom-color: rgba(58, 58, 63, 0.4);
				}
			}
			/* Desktop: Stronger glassmorphism */
			@media (min-width: 640px) {
				header.glassmorphism {
					backdrop-filter: blur(20px);
					background-color: rgba(37, 37, 41, 0.8);
					border-bottom-color: rgba(58, 58, 63, 0.5);
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
				}
			}
		</style>
		<div class="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
			<!-- Mobile: Collapsed State -->
			<div class="flex items-center justify-between gap-2 sm:hidden">
				<div class="flex items-center gap-2 min-w-0 flex-1">
					<h1 class="text-base font-semibold truncate text-charcoal-50">
						630 Volleyball
					</h1>
					{#if matches.length > 0}
						<span class="text-xs whitespace-nowrap text-charcoal-300">
							{matches.length}
							{#if conflictCount > 0}
								<span class="ml-1 text-warning-500">• {conflictCount}</span>
							{/if}
						</span>
					{/if}
				</div>
				<button
					onclick={() => headerCollapsed = !headerCollapsed}
					class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900"
					aria-label={headerCollapsed ? 'Expand header' : 'Collapse header'}
				>
					{headerCollapsed ? '▼' : '▲'}
				</button>
			</div>
			
			<!-- Mobile: Expanded State / Desktop: Always Visible -->
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4" class:hidden={headerCollapsed}>
				<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:gap-4 min-w-0 flex-1">
					<div class="flex items-center gap-2 min-w-0">
						<h1 class="text-base sm:text-lg font-semibold truncate text-charcoal-50">
							630 Volleyball Coverage
						</h1>
						{#if matches.length > 0}
							<span class="text-xs whitespace-nowrap hidden sm:inline text-charcoal-300">
								{matches.length} matches
								{#if conflictCount > 0}
									<span class="ml-2 text-warning-500">• {conflictCount} conflicts</span>
								{/if}
							</span>
						{/if}
					</div>
					
					<!-- Event Name and Date Range -->
					{#if eventInfo && (eventInfo.name || eventInfo.startDate)}
						<div class="flex items-center gap-2 text-xs text-charcoal-300">
							{#if eventInfo.name}
								<span class="font-medium truncate max-w-[200px] sm:max-w-none">
									{eventInfo.name}
								</span>
							{/if}
							{#if (eventInfo.startDate || eventInfo.endDate) && (() => {
								try {
									const startDate = eventInfo.startDate ? new Date(eventInfo.startDate).getTime() : null;
									const endDate = eventInfo.endDate ? new Date(eventInfo.endDate).getTime() : null;
									return startDate && endDate && Math.abs(startDate - endDate) > 86400000;
								} catch {
									return false;
								}
							})()}
								<span class="hidden sm:inline">
									{(() => {
										try {
											const startDate = eventInfo.startDate ? new Date(eventInfo.startDate).getTime() : null;
											const endDate = eventInfo.endDate ? new Date(eventInfo.endDate).getTime() : null;
											if (startDate && endDate && Math.abs(startDate - endDate) > 86400000) {
												return `${formatMatchDate(startDate)} - ${formatMatchDate(endDate)}`;
											} else if (startDate) {
												return formatMatchDate(startDate);
											} else if (endDate) {
												return formatMatchDate(endDate);
											}
											return null;
										} catch {
											return null;
										}
									})()}
								</span>
							{/if}
						</div>
					{/if}
					
					<!-- Mobile: Show match count below -->
					{#if matches.length > 0}
						<span class="text-xs sm:hidden text-charcoal-300">
							{matches.length} matches
							{#if conflictCount > 0}
								<span class="ml-2 text-warning-500">• {conflictCount} conflicts</span>
							{/if}
						</span>
					{/if}
				</div>
				
				<!-- Inline Utility Controls -->
				<div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
					<!-- User Role Selector -->
					<div class="flex items-center gap-1">
						<label for="role-selector-header" class="text-xs hidden sm:inline text-charcoal-300">Role:</label>
						<select
							id="role-selector-header"
							value={userRoleValue}
							onchange={(e) => userRole.setRole(e.target.value as 'media' | 'spectator' | 'coach')}
							class="px-2 py-2 sm:py-1.5 text-xs rounded-lg transition-colors min-h-[44px] sm:min-h-0 bg-charcoal-700 text-charcoal-200 border border-charcoal-600"
							title="Select your role"
						>
							<option value="media">Media</option>
							<option value="spectator">Spectator</option>
							<option value="coach">Coach</option>
						</select>
					</div>
					
					{#if matches.length > 0}
						<!-- View Mode Toggle - Hide for Coach role -->
						{#if !isCoachValue}
							<div class="flex items-center gap-1 rounded-lg p-1 bg-charcoal-700">
								<button
									onclick={() => viewMode = 'list'}
									class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0"
									class:bg-gold-500={viewMode === 'list'}
									class:text-charcoal-950={viewMode === 'list'}
									class:text-charcoal-300={viewMode !== 'list'}
									class:hover:text-charcoal-50={viewMode !== 'list'}
								>
									List
								</button>
								<button
									onclick={() => viewMode = 'timeline'}
									class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0"
									class:bg-gold-500={viewMode === 'timeline'}
									class:text-charcoal-950={viewMode === 'timeline'}
									class:text-charcoal-300={viewMode !== 'timeline'}
									class:hover:text-charcoal-50={viewMode !== 'timeline'}
								>
									Timeline
								</button>
							</div>
						{/if}

						<!-- Coverage Plan Toggle - Only show for Media role -->
						{#if isMediaValue && selectedCountValue > 0}
							<button
								onclick={() => showCoveragePlan = !showCoveragePlan}
								class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0 border"
								class:bg-gold-500={showCoveragePlan}
								class:text-charcoal-950={showCoveragePlan}
								class:text-gold-500={!showCoveragePlan}
								style={showCoveragePlan ? '' : 'background-color: rgba(234, 179, 8, 0.1); border-color: rgba(234, 179, 8, 0.2);'}
							>
								Plan ({selectedCountValue})
							</button>
						{/if}

						<!-- Export Buttons -->
						<button
							onclick={handleExportJSON}
							class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 min-h-[44px] sm:min-h-0"
							title="Export JSON"
						>
							JSON
						</button>
						<button
							onclick={handleExportCSV}
							class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 min-h-[44px] sm:min-h-0"
							title="Export CSV"
						>
							CSV
						</button>
					{/if}
					
					<!-- Config Toggle -->
					<button
						onclick={() => showConfig = !showConfig}
						class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0"
						class:bg-gold-500={showConfig}
						class:text-charcoal-950={showConfig}
						class:bg-charcoal-700={!showConfig}
						class:text-charcoal-200={!showConfig}
					>
						{showConfig ? 'Hide' : 'Config'}
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Progressive Disclosure: Config Panel -->
	{#if showConfig}
		<div class="border-b border-charcoal-700 bg-charcoal-800/30">
			<div class="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
				<EventInput
					{eventId}
					{date}
					{timeWindow}
					onLoad={handleLoad}
					{loading}
				/>
			</div>
		</div>
	{/if}
	
	<style>
		header.collapsed {
			max-height: 56px;
			overflow: hidden;
		}
		
		@media (max-width: 767px) {
			header.collapsed {
				max-height: 56px;
			}
			header:not(.collapsed) {
				max-height: 500px; /* Allow expansion */
			}
		}
	</style>

	<!-- Main Content -->
	<div class="flex flex-col lg:flex-row">
		<!-- Sidebar (Desktop Only) -->
		<div class="hidden lg:block">
			<Sidebar
				{matches}
				collapsed={sidebarCollapsed}
				onToggle={() => sidebarCollapsed = !sidebarCollapsed}
			/>
		</div>
		
        <!-- Main Content Area -->
        <main class="flex-1 w-full lg:container lg:mx-auto lg:px-6 lg:py-6">
		<!-- Mobile Filter Bar -->
		<div class="lg:hidden">
			<MobileFilterBar onOpenFullFilters={() => { showFilterSheet = true; activeTab = 'filters'; }} />
		</div>
		
		<div class="px-4 py-4 pb-24 lg:px-0 lg:py-0">
		{#if loading}
			<div class="text-center py-12">
				<div class="inline-block animate-pulse text-charcoal-300">
					Loading matches...
				</div>
			</div>
		{/if}

		{#if error}
			<div class="rounded-lg mb-6 px-4 py-3 border" style="background-color: rgba(127, 29, 29, 0.5); border-color: #991b1b; color: #fca5a5;">
				<div class="text-xs font-medium mb-1">Error</div>
				<div class="text-sm">{error}</div>
			</div>
		{/if}

		{#if !loading && matches.length === 0 && !error}
			<div class="text-center py-12 text-charcoal-300">
				<div class="text-sm">No matches found for 630 Volleyball</div>
				<div class="text-xs mt-2" style="color: #808593;">
					Click "Config" to change event parameters
				</div>
			</div>
		{/if}

		{#if matches.length > 0}
			{#if isCoachValue}
				<CoachView {matches} {eventId} {clubId} />
			{:else if viewMode === 'list'}
				<MatchList {matches} {eventId} {clubId} />
			{:else}
				<TimelineView {matches} {eventId} />
			{/if}
		{/if}

		{#if showCoveragePlan}
			<CoveragePlanPanel {matches} onClose={closeCoveragePlan} />
		{/if}
		</div>
		</main>
	</div>
	
	<!-- Mobile Bottom Navigation -->
	<MobileBottomNav
		{activeTab}
		onTabChange={handleTabChange}
	/>
	
	<!-- Filter Bottom Sheet -->
	<FilterBottomSheet
		{matches}
		{divisions}
		{teams}
		open={showFilterSheet}
		onClose={closeFilterSheet}
	/>
	
	<!-- More Menu Modal -->
	{#if showMoreMenu}
		<div
			class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
			onclick={closeMoreMenu}
			onkeydown={(e) => e.key === 'Escape' && closeMoreMenu()}
			role="dialog"
			aria-modal="true"
			aria-label="More options"
			tabindex="-1"
		>
			<div
				class="fixed bottom-0 left-0 right-0 max-h-[60vh] bg-charcoal-950 rounded-t-lg border-t border-charcoal-900 overflow-y-auto"
				style="padding-bottom: env(safe-area-inset-bottom);"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				tabindex="-1"
			>
				<!-- Header -->
				<div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-900 px-4 py-3 flex items-center justify-between z-10">
					<h2 class="text-lg font-semibold text-charcoal-50">More</h2>
					<button
						type="button"
						onclick={closeMoreMenu}
						class="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-900 transition-colors min-h-[44px]"
						aria-label="Close menu"
					>
						×
					</button>
				</div>
				
				<!-- Menu Items -->
				<div class="p-4 space-y-2">
					<button
						type="button"
						onclick={() => { showConfig = !showConfig; closeMoreMenu(); }}
						class="w-full px-4 py-3 text-left rounded-lg bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px]"
					>
						<div class="font-medium">Config</div>
						<div class="text-xs text-charcoal-400 mt-0.5">Change event parameters</div>
					</button>
					
					{#if matches.length > 0}
						<button
							type="button"
							onclick={() => { handleExportJSON(); closeMoreMenu(); }}
							class="w-full px-4 py-3 text-left rounded-lg bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px]"
						>
							<div class="font-medium">Export JSON</div>
							<div class="text-xs text-charcoal-400 mt-0.5">Download matches as JSON</div>
						</button>
						
						<button
							type="button"
							onclick={() => { handleExportCSV(); closeMoreMenu(); }}
							class="w-full px-4 py-3 text-left rounded-lg bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px]"
						>
							<div class="font-medium">Export CSV</div>
							<div class="text-xs text-charcoal-400 mt-0.5">Download matches as CSV</div>
						</button>
					{/if}
					
					<div class="pt-2 border-t border-charcoal-700">
						<label for="role-selector-menu" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
							Role
						</label>
						<select
							id="role-selector-menu"
							value={userRoleValue}
							onchange={(e) => { userRole.setRole(e.target.value as 'media' | 'spectator' | 'coach'); }}
							class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-gold-500 focus:outline-none bg-charcoal-700 text-charcoal-200 border border-charcoal-600"
						>
							<option value="media">Media</option>
							<option value="spectator">Spectator</option>
							<option value="coach">Coach</option>
						</select>
					</div>
					
					{#if !isCoachValue}
						<div class="pt-2 border-t border-charcoal-700">
							<label for="view-mode-selector-menu" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
								View Mode
							</label>
							<div class="flex gap-2" role="group" aria-labelledby="view-mode-selector-menu">
								<button
									type="button"
									id="view-mode-list"
									onclick={() => { viewMode = 'list'; }}
									class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
									class:bg-gold-500={viewMode === 'list'}
									class:text-charcoal-950={viewMode === 'list'}
									class:text-charcoal-300={viewMode !== 'list'}
									class:hover:text-charcoal-50={viewMode !== 'list'}
									class:bg-charcoal-700={viewMode !== 'list'}
									aria-pressed={viewMode === 'list'}
								>
									List
								</button>
								<button
									type="button"
									id="view-mode-timeline"
									onclick={() => { viewMode = 'timeline'; }}
									class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
									class:bg-gold-500={viewMode === 'timeline'}
									class:text-charcoal-950={viewMode === 'timeline'}
									class:text-charcoal-300={viewMode !== 'timeline'}
									class:hover:text-charcoal-50={viewMode !== 'timeline'}
									class:bg-charcoal-700={viewMode !== 'timeline'}
									aria-pressed={viewMode === 'timeline'}
								>
									Timeline
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
