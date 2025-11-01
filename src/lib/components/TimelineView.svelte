<script lang="ts">
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { detectConflicts } from '$lib/utils/matchFilters';
	import { detectOpportunities } from '$lib/utils/opportunityDetector';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { filters, applyFilters, updateFilter, resetFilters, getUniqueDivisions, getUniqueTeams, getTeamIdentifier as getTeamIdFromFilter } from '$lib/stores/filters';
	import { priority } from '$lib/stores/priority';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import type { SetScore } from '$lib/types';
	
	import PrioritySelector from '$lib/components/PrioritySelector.svelte';
	import CoverageStatusSelector from '$lib/components/CoverageStatusSelector.svelte';
	import ConflictDetailsPanel from '$lib/components/ConflictDetailsPanel.svelte';
	import LiveScoreIndicator from '$lib/components/LiveScoreIndicator.svelte';
	import Scorekeeper from '$lib/components/Scorekeeper.svelte';
	
	export let matches: FilteredMatch[];
	export let eventId: string;
	
	let selectedConflict: FilteredMatch | null = null;
	let highlightedTeam: string | null = null;
	let priorityMenuOpen: number | null = null;
	let coverageStatusMenuOpen: string | null = null;
	let scorekeeperMatch: FilteredMatch | null = null;
	let highlightGaps = false;
	let showGapsOnly = false;
	let selectedDay: string | null = null;
	let timelineScrollContainer: HTMLDivElement;
	
	// Get matches with gaps for filtering
	$: matchesWithGaps = (() => {
		const matchSet = new Set<number>();
		const allMatchesByCourt: Record<string, FilteredMatch[]> = {};
		filteredMatches.forEach(match => {
			if (!allMatchesByCourt[match.CourtName]) {
				allMatchesByCourt[match.CourtName] = [];
			}
			allMatchesByCourt[match.CourtName].push(match);
		});
		
		Object.values(allMatchesByCourt).forEach(courtMatches => {
			const gaps = calculateGaps(courtMatches);
			gaps.forEach(gap => {
				matchSet.add(gap.before.MatchId);
				matchSet.add(gap.after.MatchId);
			});
		});
		return matchSet;
	})();
	
	// Apply gap filter if enabled
	$: gapFilteredMatches = (() => {
		if (showGapsOnly) {
			return filteredMatches.filter(m => matchesWithGaps.has(m.MatchId));
		}
		return filteredMatches;
	})();
	
	// Group matches by day (using gap-filtered matches)
	$: matchesByDay = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		gapFilteredMatches.forEach(match => {
			const dayKey = formatMatchDate(match.ScheduledStartDateTime);
			if (!grouped[dayKey]) {
				grouped[dayKey] = [];
			}
			grouped[dayKey].push(match);
		});
		return grouped;
	})();
	
	$: days = Object.keys(matchesByDay).sort();
	
	// Set selected day to first day if not set
	$: if (days.length > 0 && !selectedDay) {
		selectedDay = days[0];
	}
	
	// Filter matches by selected day (using gap-filtered matches)
	$: dayFilteredMatches = selectedDay ? matchesByDay[selectedDay] || [] : gapFilteredMatches;
	
	// Group matches by court (using day-filtered matches)
	$: matchesByCourt = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		dayFilteredMatches.forEach(match => {
			if (!grouped[match.CourtName]) {
				grouped[match.CourtName] = [];
			}
			grouped[match.CourtName].push(match);
		});
		return grouped;
	})();
	
	$: courts = Object.keys(matchesByCourt).sort();
	
	// Create match claiming store
	let matchClaiming: ReturnType<typeof createMatchClaiming>;
	
	$: {
		const isSpectatorValue = $isSpectator;
		matchClaiming = createMatchClaiming({ 
			eventId, 
			userId: isSpectatorValue ? 'spectator' : 'anonymous' 
		});
	}
	
	// Conflicts calculation
	$: conflicts = detectConflicts(matches);
	
	// Get unique divisions and teams
	$: divisions = (() => {
		if ($filters.wave !== 'all') {
			const waveStart = $filters.wave === 'morning' ? '08:00' : '14:30';
			const waveEnd = $filters.wave === 'morning' ? '14:30' : '23:59';
			return getUniqueDivisions(matches).filter(div => {
				return matches.some(m => {
					const matchTime = formatMatchTime(m.ScheduledStartDateTime);
					const timeOnly = matchTime.split(' ')[1] || matchTime;
					return timeOnly >= waveStart && timeOnly < waveEnd && m.Division.CodeAlias === div;
				});
			});
		}
		return getUniqueDivisions(matches);
	})();
	
	$: teams = getUniqueTeams(matches);
	
	// Apply filters to matches
	$: filteredMatches = (() => {
		let filtered = applyFilters(matches);
		
		// Apply priority filter
		if ($filters.priority && $filters.priority !== 'all') {
			filtered = filtered.filter(m => {
				const matchPriority = priority.getPriority(m.MatchId);
				return matchPriority === $filters.priority;
			});
		}
		
		// Apply coverage status filter
		if ($filters.coverageStatus && $filters.coverageStatus !== 'all') {
			filtered = filtered.filter(m => {
				const teamId = getTeamIdFromFilter(m);
				if (!teamId) return true;
				const status = coverageStatus.getTeamStatus(teamId);
				
				if ($filters.coverageStatus === 'uncovered') {
					return status === 'not-covered';
				} else if ($filters.coverageStatus === 'covered') {
					return status === 'covered' || status === 'partially-covered';
				} else if ($filters.coverageStatus === 'planned') {
					return status === 'planned';
				}
				
				return true;
			});
		}
		
		return filtered;
	})();
	
	// Detect opportunities (using day-filtered matches)
	$: opportunities = (() => {
		const selectedSet = get(coveragePlan);
		return detectOpportunities(dayFilteredMatches, selectedSet, conflicts, {
			excludeSelected: true,
			preferNoConflicts: true,
			preferNearSelected: true,
			maxResults: 50,
		});
	})();
	
	$: opportunityMatchIds = new Set(opportunities.map(o => o.match.MatchId));
	
	// Get opponent
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
	
	// Calculate timeline bounds (using day-filtered matches)
	$: earliestTime = dayFilteredMatches.length > 0 ? Math.min(...dayFilteredMatches.map((m) => m.ScheduledStartDateTime)) : 0;
	$: latestTime = dayFilteredMatches.length > 0 ? Math.max(...dayFilteredMatches.map((m) => m.ScheduledEndDateTime)) : 0;
	$: totalDuration = latestTime - earliestTime;
	
	function getPosition(startTime: number): number {
		if (totalDuration === 0) return 0;
		return ((startTime - earliestTime) / totalDuration) * 100;
	}
	
	function getWidth(startTime: number, endTime: number): number {
		if (totalDuration === 0) return 0;
		return ((endTime - startTime) / totalDuration) * 100;
	}
	
	// Get highlighted team matches (using day-filtered matches)
	$: highlightedTeamMatches = (() => {
		if (!highlightedTeam) return new Set<number>();
		const matchSet = new Set<number>();
		dayFilteredMatches.forEach(match => {
			const teamId = getTeamIdFromFilter(match);
			if (teamId === highlightedTeam) {
				matchSet.add(match.MatchId);
			}
		});
		return matchSet;
	})();
	
	// Get conflicting matches for selected conflict (using day-filtered matches)
	$: conflictingMatchesForSelected = (() => {
		if (!selectedConflict) return [];
		const conflictGroup = conflicts.get(selectedConflict.MatchId);
		if (!conflictGroup) return [];
		return conflictGroup.map(matchId => {
			return dayFilteredMatches.find(m => m.MatchId === matchId);
		}).filter(Boolean) as FilteredMatch[];
	})();
	
	// Get all conflicts and track completion (using day-filtered matches)
	$: allConflicts = (() => {
		const conflictList: FilteredMatch[] = [];
		const seen = new Set<number>();
		
		dayFilteredMatches.forEach(match => {
			if (conflicts.has(match.MatchId) && !seen.has(match.MatchId)) {
				conflictList.push(match);
				seen.add(match.MatchId);
				const conflictGroup = conflicts.get(match.MatchId);
				if (conflictGroup) {
					conflictGroup.forEach(id => seen.add(id));
				}
			}
		});
		
		return conflictList.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
	})();
	
	// Track resolved conflicts (matches in plan)
	$: resolvedConflicts = (() => {
		const currentPlan = get(coveragePlan);
		return allConflicts.filter(conflict => {
			const conflictGroup = conflicts.get(conflict.MatchId);
			if (!conflictGroup) return false;
			// Conflict is resolved if at least one match from the conflict group is in the plan
			return conflictGroup.some(matchId => currentPlan.has(matchId));
		});
	})();
	
	$: conflictProgress = {
		total: allConflicts.length,
		resolved: resolvedConflicts.length,
		remaining: allConflicts.length - resolvedConflicts.length
	};
	
	// Get current conflict index
	$: currentConflictIndex = selectedConflict ? allConflicts.findIndex(c => c.MatchId === selectedConflict.MatchId) : -1;
	
	function handleNextConflict() {
		if (currentConflictIndex >= 0 && currentConflictIndex < allConflicts.length - 1) {
			selectedConflict = allConflicts[currentConflictIndex + 1];
		}
	}
	
	function handlePreviousConflict() {
		if (currentConflictIndex > 0) {
			selectedConflict = allConflicts[currentConflictIndex - 1];
		}
	}
	
	// Calculate time gaps between matches on each court
	function calculateGaps(courtMatches: FilteredMatch[]) {
		const gaps: Array<{ before: FilteredMatch; after: FilteredMatch; gapMinutes: number }> = [];
		const sorted = [...courtMatches].sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
		
		for (let i = 0; i < sorted.length - 1; i++) {
			const current = sorted[i];
			const next = sorted[i + 1];
			const gapMinutes = Math.floor((next.ScheduledStartDateTime - current.ScheduledEndDateTime) / 60000);
			
			if (gapMinutes > 0) {
				gaps.push({ before: current, after: next, gapMinutes });
			}
		}
		
		return gaps;
	}
	
	function handleMatchClick(match: FilteredMatch) {
		if (conflicts.has(match.MatchId)) {
			selectedConflict = match;
		} else if ($isMedia) {
			coveragePlan.toggleMatch(match.MatchId);
		} else {
			selectedConflict = match;
		}
	}
	
	function handleTeamClick(teamId: string, e: MouseEvent) {
		e.stopPropagation();
		highlightedTeam = highlightedTeam === teamId ? null : teamId;
	}
</script>

{#if filteredMatches.length === 0}
	<div class="text-center py-12 text-charcoal-300 text-sm">
		{$filters.division || $filters.wave !== 'all' || $filters.teams.length > 0 || $filters.timeRange.start || $filters.timeRange.end
			? 'No matches found for selected filters'
			: 'No matches found'}
	</div>
{:else}
	<div data-timeline class="space-y-4">
		<!-- Filter Controls -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
			<!-- Wave Filter -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-charcoal-300 uppercase tracking-wider">Wave:</span>
				<div class="flex gap-1 bg-charcoal-700 rounded-lg p-1">
					<button
						onclick={() => updateFilter('wave', 'all')}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.wave === 'all' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						All
					</button>
					<button
						onclick={() => updateFilter('wave', 'morning')}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.wave === 'morning' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Morning
					</button>
					<button
						onclick={() => updateFilter('wave', 'afternoon')}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.wave === 'afternoon' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Afternoon
					</button>
				</div>
			</div>
			
			<!-- Division Filter -->
			{#if divisions.length > 1}
				<div class="flex items-center gap-2">
					<span class="text-xs text-charcoal-300 uppercase tracking-wider">Division:</span>
					<select
						value={$filters.division || ''}
						onchange={(e) => updateFilter('division', e.target.value || null)}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600 focus:border-gold-500 focus:outline-none min-h-[44px] sm:min-h-0"
					>
						<option value="">All Divisions{$filters.wave !== 'all' ? ` (${$filters.wave})` : ''}</option>
						{#each divisions as div}
							<option value={div}>{div}</option>
						{/each}
					</select>
				</div>
			{/if}
			
			<!-- Team Filter -->
			{#if teams.length > 0}
				<div class="flex items-center gap-2">
					<span class="text-xs text-charcoal-300 uppercase tracking-wider">Team:</span>
					<select
						multiple
						value={$filters.teams}
						onchange={(e) => {
							const selected = Array.from(e.target.selectedOptions, option => option.value);
							updateFilter('teams', selected);
						}}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600 focus:border-gold-500 focus:outline-none min-h-[44px] sm:min-h-0 min-w-[120px]"
						size={Math.min(teams.length, 4)}
					>
						{#each teams as team}
							<option value={team}>{team}</option>
						{/each}
					</select>
				</div>
			{/if}
			
			<!-- Time Range Filter -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-charcoal-300 uppercase tracking-wider">Time:</span>
				<div class="flex gap-1 bg-charcoal-700 rounded-lg p-1">
					<button
						onclick={() => updateFilter('timeRange', { start: null, end: null })}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.timeRange.start === null && $filters.timeRange.end === null ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						All
					</button>
					<button
						onclick={() => updateFilter('timeRange', { start: '08:00', end: '14:30' })}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.timeRange.start === '08:00' && $filters.timeRange.end === '14:30' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Morning
					</button>
					<button
						onclick={() => updateFilter('timeRange', { start: '14:30', end: '23:59' })}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.timeRange.start === '14:30' && $filters.timeRange.end === '23:59' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Afternoon
					</button>
				</div>
			</div>
			
			<!-- Priority Filter - Media Only -->
			{#if $isMedia}
				<div class="flex items-center gap-2">
					<span class="text-xs text-charcoal-300 uppercase tracking-wider">Priority:</span>
					<select
						value={$filters.priority || 'all'}
						onchange={(e) => updateFilter('priority', e.target.value === 'all' ? 'all' : e.target.value as any)}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600 focus:border-gold-500 focus:outline-none min-h-[44px] sm:min-h-0"
					>
						<option value="all">All Priorities</option>
						<option value="must-cover">Must Cover</option>
						<option value="priority">Priority</option>
						<option value="optional">Optional</option>
					</select>
				</div>
			{/if}
			
			<!-- Gap Highlighting Controls -->
			{#if $isMedia}
				<div class="flex items-center gap-2">
					<button
						onclick={() => highlightGaps = !highlightGaps}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {highlightGaps ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600'}"
						title="Highlight all time gaps"
					>
						{highlightGaps ? '✓' : ''} Highlight Gaps
					</button>
					<button
						onclick={() => showGapsOnly = !showGapsOnly}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {showGapsOnly ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600'}"
						title="Show only matches with gaps"
					>
						{showGapsOnly ? '✓' : ''} Gaps Only
					</button>
				</div>
			{/if}
			
			<!-- Clear Filters -->
			{#if $filters.division || $filters.wave !== 'all' || $filters.teams.length > 0 || $filters.timeRange.start || $filters.timeRange.end || ($filters.priority && $filters.priority !== 'all') || ($filters.coverageStatus && $filters.coverageStatus !== 'all')}
				<button
					onclick={resetFilters}
					class="px-3 py-2 sm:py-1 text-xs font-medium rounded-lg transition-colors text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-700 border border-charcoal-600 min-h-[44px] sm:min-h-0"
				>
					Clear
				</button>
			{/if}
		</div>
		
		<!-- Timeline Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
			<!-- Day Navigation (Mobile) -->
			{#if days.length > 1}
				<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 lg:hidden">
					{#each days as day}
						<button
							type="button"
							onclick={() => selectedDay = day}
							class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] flex-shrink-0 {selectedDay === day ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							{day}
						</button>
					{/each}
				</div>
			{/if}
			
			<div class="flex items-center justify-between">
				<div class="text-xs text-charcoal-300">
					Timeline: {formatMatchTime(earliestTime)} - {formatMatchTime(latestTime)}
					{#if selectedDay}
						<span class="ml-2 text-gold-400">• {selectedDay}</span>
					{/if}
					{#if dayFilteredMatches.length !== filteredMatches.length}
						<span class="ml-2">
							({dayFilteredMatches.length} of {filteredMatches.length})
						</span>
					{/if}
					{#if conflictProgress.total > 0 && $isMedia}
						<span class="ml-2 text-xs">
							• Conflicts: {conflictProgress.resolved}/{conflictProgress.total} resolved
						</span>
					{/if}
				</div>
				{#if highlightedTeam}
					<div class="flex items-center gap-2">
						<span class="text-xs text-charcoal-300">Showing:</span>
						<span class="px-2 py-1 text-xs font-semibold rounded bg-gold-500/20 text-[#facc15] border border-gold-500/50">
							Team {highlightedTeam}
						</span>
						<button
							type="button"
							onclick={() => highlightedTeam = null}
							class="text-xs text-charcoal-300 hover:text-charcoal-50 transition-colors min-h-[44px] sm:min-h-0"
							aria-label="Clear highlight"
						>
							✕
						</button>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Day Navigation (Desktop) -->
		{#if days.length > 1}
			<div class="hidden lg:flex items-center gap-2 mb-4">
				<span class="text-xs text-charcoal-300 uppercase tracking-wider">Day:</span>
				<div class="flex gap-2">
					{#each days as day}
						<button
							type="button"
							onclick={() => selectedDay = day}
							class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors {selectedDay === day ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700'}"
						>
							{day}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Court Timelines -->
		<div 
			bind:this={timelineScrollContainer}
			class="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide"
			style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;"
		>
			<div class="space-y-4 min-w-max lg:min-w-0">
				{#each courts as courtName}
					{@const courtMatches = matchesByCourt[courtName]}
					<div 
						class="border-b border-charcoal-700 pb-4 last:border-b-0 last:pb-0 min-w-[calc(100vw-2rem)] lg:min-w-0"
						style="scroll-snap-align: start;"
					>
						<!-- Court Header -->
						<div class="flex items-center justify-between mb-2">
							<div class="text-base font-semibold text-charcoal-50">{courtName}</div>
							<div class="text-xs text-charcoal-400">
								{courtMatches.length} match{courtMatches.length !== 1 ? 'es' : ''}
							</div>
						</div>
						
						<!-- Timeline Bar -->
						<div class="relative h-20 sm:h-20 rounded-lg border overflow-hidden bg-charcoal-800 border-charcoal-700">
							<!-- Time gaps visualization -->
							{#each calculateGaps(courtMatches) as gap, gapIndex}
								{@const gapStart = getPosition(gap.before.ScheduledEndDateTime)}
								{@const gapEnd = getPosition(gap.after.ScheduledStartDateTime)}
								{@const gapWidth = gapEnd - gapStart}
								{@const isLargeGap = gap.gapMinutes >= 30}
								{@const isMediumGap = gap.gapMinutes >= 15 && gap.gapMinutes < 30}
								
								{#if gapWidth >= 1}
									<div
										class="absolute top-0 bottom-0 flex items-center justify-center transition-all {highlightGaps ? 'ring-2 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''}"
										style="left: {gapStart}%; width: {gapWidth}%; z-index: 0;"
										title="{gap.gapMinutes} min gap between matches"
									>
										{#if gapWidth > 3 || highlightGaps}
											<div class="text-[9px] font-medium px-1 py-0.5 rounded {isLargeGap ? 'bg-green-500/20 text-green-400' : isMediumGap ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'} {highlightGaps ? 'ring-2 ring-[#eab308]' : ''}">
												{gap.gapMinutes}m
											</div>
										{/if}
									</div>
								{/if}
							{/each}
							
							<!-- Match blocks -->
							{#each courtMatches as match}
								{@const hasConflict = conflicts.has(match.MatchId)}
								{@const isSelected = selectedConflict?.MatchId === match.MatchId}
								{@const teamId = getTeamIdFromFilter(match)}
								{@const isHighlighted = highlightedTeam !== null && highlightedTeamMatches.has(match.MatchId)}
								{@const shouldDim = highlightedTeam !== null && !isHighlighted}
								{@const currentPlan = get(coveragePlan)}
								{@const isInPlan = currentPlan.has(match.MatchId)}
								{@const matchPriority = priority.getPriority(match.MatchId)}
								{@const isOpportunity = opportunityMatchIds.has(match.MatchId)}
								{@const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered'}
								{@const isCovered = teamCoverageStatus === 'covered' || teamCoverageStatus === 'partially-covered'}
								{@const isPlanned = teamCoverageStatus === 'planned'}
								{@const isUncovered = teamCoverageStatus === 'not-covered'}
								{@const left = getPosition(match.ScheduledStartDateTime)}
								{@const width = Math.max(getWidth(match.ScheduledStartDateTime, match.ScheduledEndDateTime), 2)}
								{@const opponent = getOpponent(match)}
								
								{@const backgroundColor = matchPriority === 'must-cover' ? '#eab308' : matchPriority === 'priority' ? '#f59e0b' : isUncovered && !isInPlan ? '#eab308' : isPlanned ? '#eab308' : isHighlighted ? '#eab308' : isInPlan && !hasConflict ? '#eab308' : isCovered ? '#10b981' : isOpportunity && !isInPlan ? '#10b981' : hasConflict ? '#dc2626' : match.Division.ColorHex}
								{@const borderColor = matchPriority === 'must-cover' ? '#facc15' : matchPriority === 'priority' ? '#fbbf24' : isUncovered && !isInPlan ? '#facc15' : isPlanned ? '#facc15' : isSelected ? '#eab308' : isHighlighted ? '#facc15' : isInPlan ? '#facc15' : hasConflict ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}
								{@const zIndex = isSelected ? 30 : isHighlighted ? 20 : matchPriority === 'must-cover' ? 18 : isInPlan ? 15 : hasConflict ? 10 : 1}
								
					<div
						onclick={(e) => {
							if (e.target instanceof HTMLElement && e.target.closest('.priority-button')) {
								return;
							}
							handleMatchClick(match);
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								if (e.target instanceof HTMLElement && !e.target.closest('.priority-button')) {
									handleMatchClick(match);
								}
							}
						}}
						class="group absolute h-16 rounded-md px-2 py-1.5 text-white shadow-sm border-2 flex flex-col justify-center transition-all active:scale-95 sm:hover:z-20 sm:hover:shadow-lg touch-manipulation cursor-pointer min-h-[44px] {isSelected ? 'ring-2 ring-[#eab308] ring-offset-2 ring-offset-[#3b3c48]' : ''} {isHighlighted ? 'ring-2 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''} {shouldDim ? 'opacity-30' : ''} {isInPlan ? 'ring-1 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''} {isCovered ? 'opacity-60' : ''}"
						style="left: {left}%; width: {width}%; background-color: {backgroundColor}; border-color: {borderColor}; min-width: 120px; z-index: {zIndex};"
						title="{match.CompleteShortName}: {match.FirstTeamText} vs {match.SecondTeamText} - {formatMatchTime(match.ScheduledStartDateTime)}{hasConflict ? ' (Click to see conflicts)' : ' (Click to add to plan)'}{matchPriority ? ` [Priority: ${matchPriority}]` : ''}{isOpportunity && !isInPlan ? ' [Easy opportunity]' : ''}{teamCoverageStatus !== 'not-covered' ? ` [Coverage: ${teamCoverageStatus}]` : ''}"
						role="button"
						tabindex="0"
					>
									<!-- Priority Indicator - Media Only -->
									{#if $isMedia && matchPriority}
										<div class="absolute top-0 left-0 text-[10px]">
											{matchPriority === 'must-cover' && '⭐'}
											{matchPriority === 'priority' && '🔸'}
											{matchPriority === 'optional' && '○'}
										</div>
									{/if}
									
						<!-- Opportunity Badge - Media Only -->
						{#if $isMedia && isOpportunity && !isInPlan}
							<div class="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" title="Easy coverage opportunity"></div>
						{/if}
									
									<!-- Selection Indicator - Media Only -->
									{#if $isMedia && isInPlan}
										<div class="absolute top-0 right-0 w-4 h-4 flex items-center justify-center">
											<svg class="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
									{/if}
									
						<!-- Team Identifier -->
						<div 
							onclick={(e) => teamId && handleTeamClick(teamId, e)}
							onkeydown={(e) => { if (teamId && (e.key === 'Enter' || e.key === ' ')) handleTeamClick(teamId, e); }}
							class="text-xs sm:text-sm font-bold truncate leading-tight {teamId ? 'cursor-pointer hover:underline' : ''}"
							role={teamId ? "button" : undefined}
							tabindex={teamId ? 0 : undefined}
						>
										{teamId || match.Division.CodeAlias}
									</div>
									
									<!-- Opponent -->
									<div class="text-[9px] sm:text-[10px] opacity-90 truncate mt-0.5 leading-tight">
										vs {opponent.length > 20 ? opponent.substring(0, 17) + '...' : opponent}
									</div>
									
									<!-- Time -->
									<div class="text-[9px] sm:text-[10px] opacity-75 mt-0.5">
										{formatMatchTime(match.ScheduledStartDateTime)}
									</div>
									
									<!-- Score Display -->
									{#if matchClaiming}
										{@const score = matchClaiming.getScore(match.MatchId)}
										{#if score && score.status !== 'not-started'}
											{@const currentSet = score.sets.find((s: SetScore) => s.completedAt === 0) || score.sets[score.sets.length - 1]}
											{@const completedSets = score.sets.filter((s: SetScore) => s.completedAt > 0)}
											{@const team1Wins = completedSets.filter((s: SetScore) => s.team1Score > s.team2Score).length}
											{@const team2Wins = completedSets.filter((s: SetScore) => s.team2Score > s.team1Score).length}
											
											<div class="flex items-center gap-1 mt-0.5">
												{#if completedSets.length > 0}
													<div class="text-[8px] text-charcoal-300">
														({team1Wins}-{team2Wins})
													</div>
												{/if}
												<div class="text-[9px] font-semibold text-white">
													{currentSet.team1Score}-{currentSet.team2Score}
												</div>
												{#if score.status === 'in-progress'}
													<LiveScoreIndicator
														isLive={true}
														lastUpdated={score.lastUpdated}
													/>
												{/if}
											</div>
										{/if}
									{/if}
									
									<!-- Priority Button - Media Only -->
									{#if $isMedia}
										<div class="relative">
											<button
												onclick={(e) => {
													e.stopPropagation();
													priorityMenuOpen = priorityMenuOpen === match.MatchId ? null : match.MatchId;
												}}
												class="priority-button flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-black/20 {matchPriority === 'must-cover' ? 'text-[#facc15]' : matchPriority === 'priority' ? 'text-[#fbbf24]' : matchPriority === 'optional' ? 'text-white/60' : 'text-white/40'}"
												aria-label="Set priority"
												title={matchPriority ? `Priority: ${matchPriority}` : 'Set priority'}
											>
												{matchPriority === 'must-cover' && '⭐'}
												{matchPriority === 'priority' && '🔸'}
												{matchPriority === 'optional' && '○'}
												{#if !matchPriority}
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
													</svg>
												{/if}
											</button>
											{#if priorityMenuOpen === match.MatchId}
												<div class="absolute left-full top-0 ml-2 z-50">
													<PrioritySelector
														matchId={match.MatchId}
														currentPriority={matchPriority}
														onPriorityChange={priority.setPriority}
														onClose={() => priorityMenuOpen = null}
													/>
												</div>
											{/if}
										</div>
									{/if}
									
									<!-- Coverage Status Button - Media Only -->
									{#if $isMedia && teamId}
										<div class="relative">
											<button
												onclick={(e) => {
													e.stopPropagation();
													coverageStatusMenuOpen = coverageStatusMenuOpen === teamId ? null : teamId;
												}}
												class="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-black/20 {teamCoverageStatus === 'covered' ? 'text-green-400' : teamCoverageStatus === 'partially-covered' ? 'text-[#fbbf24]' : teamCoverageStatus === 'planned' ? 'text-[#facc15]' : 'text-white/40'}"
												aria-label="Set coverage status"
												title="Coverage: {teamCoverageStatus}"
											>
												{teamCoverageStatus === 'covered' && '✓'}
												{teamCoverageStatus === 'partially-covered' && '◐'}
												{teamCoverageStatus === 'planned' && '📋'}
												{teamCoverageStatus === 'not-covered' && '○'}
											</button>
											{#if coverageStatusMenuOpen === teamId}
												<div class="absolute left-full top-0 ml-2 z-50">
													<CoverageStatusSelector
														{teamId}
														currentStatus={teamCoverageStatus}
														onStatusChange={coverageStatus.setTeamStatus}
														onClose={() => coverageStatusMenuOpen = null}
													/>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
		
		<!-- Conflict Details Panel -->
		{#if selectedConflict}
			<ConflictDetailsPanel
				match={selectedConflict}
				conflictingMatches={conflictingMatchesForSelected}
				onClose={() => selectedConflict = null}
				onNextConflict={handleNextConflict}
				onPreviousConflict={handlePreviousConflict}
				currentIndex={currentConflictIndex}
				totalConflicts={allConflicts.length}
				conflictProgress={conflictProgress}
			/>
		{/if}
		
		<!-- Scorekeeper Modal -->
		{#if scorekeeperMatch && matchClaiming.isClaimOwner(scorekeeperMatch.MatchId)}
			<Scorekeeper
				matchId={scorekeeperMatch.MatchId}
				team1Name={scorekeeperMatch.FirstTeamText}
				team2Name={scorekeeperMatch.SecondTeamText}
				currentScore={matchClaiming.getScore(scorekeeperMatch.MatchId)}
				onScoreUpdate={(sets: SetScore[], status: 'not-started' | 'in-progress' | 'completed') => {
					matchClaiming.updateScore(scorekeeperMatch.MatchId, sets, status);
				}}
				onClose={() => scorekeeperMatch = null}
			/>
		{/if}
		
		<!-- Close priority menu when clicking outside -->
		{#if priorityMenuOpen !== null}
			<div
				class="fixed inset-0 z-40"
				onclick={() => priorityMenuOpen = null}
				onkeydown={(e) => e.key === 'Escape' && (priorityMenuOpen = null)}
				role="button"
				tabindex="-1"
			></div>
		{/if}
		
		<!-- Close coverage status menu when clicking outside -->
		{#if coverageStatusMenuOpen !== null}
			<div
				class="fixed inset-0 z-40"
				onclick={() => coverageStatusMenuOpen = null}
				onkeydown={(e) => e.key === 'Escape' && (coverageStatusMenuOpen = null)}
				role="button"
				tabindex="-1"
			></div>
		{/if}
	</div>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>

