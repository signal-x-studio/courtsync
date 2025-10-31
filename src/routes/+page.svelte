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
	// TODO: Import other components as they're migrated
	
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

<div class="min-h-screen" style="background-color: #18181b;">
	<!-- Compact Header -->
	<header class="border-b sticky top-0 z-10" style="border-color: #454654; background-color: rgba(59, 60, 72, 0.5);">
		<div class="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
				<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:gap-4 min-w-0 flex-1">
					<div class="flex items-center gap-2 min-w-0">
						<h1 class="text-base sm:text-lg font-semibold truncate" style="color: #f8f8f9;">
							630 Volleyball Coverage
						</h1>
						{#if matches.length > 0}
							<span class="text-xs whitespace-nowrap hidden sm:inline" style="color: #9fa2ab;">
								{matches.length} matches
								{#if conflictCount > 0}
									<span class="ml-2" style="color: #ef4444;">• {conflictCount} conflicts</span>
								{/if}
							</span>
						{/if}
					</div>
					
					<!-- Event Name and Date Range -->
					{#if eventInfo && (eventInfo.name || eventInfo.startDate)}
						<div class="flex items-center gap-2 text-xs" style="color: #9fa2ab;">
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
						<span class="text-xs sm:hidden" style="color: #9fa2ab;">
							{matches.length} matches
							{#if conflictCount > 0}
								<span class="ml-2" style="color: #ef4444;">• {conflictCount} conflicts</span>
							{/if}
						</span>
					{/if}
				</div>
				
				<!-- Inline Utility Controls -->
				<div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
					<!-- User Role Selector -->
					<div class="flex items-center gap-1">
						<label class="text-xs hidden sm:inline" style="color: #9fa2ab;">Role:</label>
						<select
							value={userRoleValue}
							onchange={(e) => userRole.setRole(e.target.value as 'media' | 'spectator' | 'coach')}
							class="px-2 py-2 sm:py-1.5 text-xs rounded-lg transition-colors min-h-[44px] sm:min-h-0"
							style="background-color: #454654; color: #c0c2c8; border: 1px solid #525463;"
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
							<div class="flex items-center gap-1 rounded-lg p-1" style="background-color: #454654;">
								<button
									onclick={() => viewMode = 'list'}
									class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0"
									class:bg-gold-500={viewMode === 'list'}
									class:text-charcoal-950={viewMode === 'list'}
									class:text-charcoal-300={viewMode !== 'list'}
									class:hover:text-charcoal-50={viewMode !== 'list'}
									style={viewMode === 'list' ? 'background-color: #eab308; color: #18181b;' : 'color: #c0c2c8;'}
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
									style={viewMode === 'timeline' ? 'background-color: #eab308; color: #18181b;' : 'color: #c0c2c8;'}
								>
									Timeline
								</button>
							</div>
						{/if}

						<!-- Coverage Plan Toggle - Only show for Media role -->
						{#if isMediaValue && selectedCountValue > 0}
							<button
								onclick={() => showCoveragePlan = !showCoveragePlan}
								class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0"
								class:text-charcoal-950={showCoveragePlan}
								style={showCoveragePlan ? 'background-color: #eab308; color: #18181b;' : 'background-color: #454654; color: #c0c2c8;'}
							>
								Plan ({selectedCountValue})
							</button>
						{/if}

						<!-- Export Buttons -->
						<button
							onclick={handleExportJSON}
							class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[#f8f8f9] min-h-[44px] sm:min-h-0"
							style="background-color: #454654; color: #c0c2c8;"
							title="Export JSON"
						>
							JSON
						</button>
						<button
							onclick={handleExportCSV}
							class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[#f8f8f9] min-h-[44px] sm:min-h-0"
							style="background-color: #454654; color: #c0c2c8;"
							title="Export CSV"
						>
							CSV
						</button>
					{/if}
					
					<!-- Config Toggle -->
					<button
						onclick={() => showConfig = !showConfig}
						class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0"
						class:text-charcoal-950={showConfig}
						style={showConfig ? 'background-color: #eab308; color: #18181b;' : 'background-color: #454654; color: #c0c2c8;'}
					>
						{showConfig ? 'Hide' : 'Config'}
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Progressive Disclosure: Config Panel -->
	{#if showConfig}
		<div class="border-b" style="border-color: #454654; background-color: rgba(59, 60, 72, 0.3);">
			<div class="container mx-auto px-3 sm:px-4 py-4">
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

	<!-- Main Content -->
	<main class="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
		{#if loading}
			<div class="text-center py-12">
				<div class="inline-block animate-pulse" style="color: #9fa2ab;">
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
			<div class="text-center py-12" style="color: #9fa2ab;">
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
			<CoveragePlanPanel {matches} onClose={() => showCoveragePlan = false} />
		{/if}
	</main>
</div>
