<script lang="ts">
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime } from '$lib/utils/dateUtils';
	import { detectConflicts } from '$lib/utils/matchFilters';
	import { detectOpportunities } from '$lib/utils/opportunityDetector';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { filters, applyFilters, updateFilter, resetFilters, getUniqueDivisions, getUniqueTeams, getTeamIdentifier as getTeamIdFromFilter } from '$lib/stores/filters';
	import { priority } from '$lib/stores/priority';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import type { SetScore } from '$lib/types';
	
	// TODO: Import Svelte components as they're migrated
	// import ConflictDetailsPanel from '$lib/components/ConflictDetailsPanel.svelte';
	// import PrioritySelector from '$lib/components/PrioritySelector.svelte';
	// import CoverageStatusSelector from '$lib/components/CoverageStatusSelector.svelte';
	// import Scorekeeper from '$lib/components/Scorekeeper.svelte';
	// import LiveScoreIndicator from '$lib/components/LiveScoreIndicator.svelte';
	
	export let matches: FilteredMatch[];
	export let eventId: string;
	
	let selectedConflict: FilteredMatch | null = null;
	let highlightedTeam: string | null = null;
	let priorityMenuOpen: number | null = null;
	let coverageStatusMenuOpen: string | null = null;
	let scorekeeperMatch: FilteredMatch | null = null;
	
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
	
	// Detect opportunities
	$: opportunities = (() => {
		const selectedSet = get(coveragePlan);
		return detectOpportunities(matches, selectedSet, conflicts, {
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
	
	// Calculate timeline bounds
	$: earliestTime = filteredMatches.length > 0 ? Math.min(...filteredMatches.map((m) => m.ScheduledStartDateTime)) : 0;
	$: latestTime = filteredMatches.length > 0 ? Math.max(...filteredMatches.map((m) => m.ScheduledEndDateTime)) : 0;
	$: totalDuration = latestTime - earliestTime;
	
	function getPosition(startTime: number): number {
		if (totalDuration === 0) return 0;
		return ((startTime - earliestTime) / totalDuration) * 100;
	}
	
	function getWidth(startTime: number, endTime: number): number {
		if (totalDuration === 0) return 0;
		return ((endTime - startTime) / totalDuration) * 100;
	}
	
	// Group matches by court
	$: matchesByCourt = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		filteredMatches.forEach(match => {
			if (!grouped[match.CourtName]) {
				grouped[match.CourtName] = [];
			}
			grouped[match.CourtName].push(match);
		});
		return grouped;
	})();
	
	$: courts = Object.keys(matchesByCourt).sort();
	
	// Get highlighted team matches
	$: highlightedTeamMatches = (() => {
		if (!highlightedTeam) return new Set<number>();
		const matchSet = new Set<number>();
		filteredMatches.forEach(match => {
			const teamId = getTeamIdFromFilter(match);
			if (teamId === highlightedTeam) {
				matchSet.add(match.MatchId);
			}
		});
		return matchSet;
	})();
	
	// Get conflicting matches for selected conflict
	$: conflictingMatchesForSelected = (() => {
		if (!selectedConflict) return [];
		const conflictGroup = conflicts.get(selectedConflict.MatchId);
		if (!conflictGroup) return [];
		return conflictGroup.map(matchId => {
			return filteredMatches.find(m => m.MatchId === matchId);
		}).filter(Boolean) as FilteredMatch[];
	})();
	
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
	<div class="text-center py-12 text-[#9fa2ab] text-sm">
		{$filters.division || $filters.wave !== 'all' || $filters.teams.length > 0 || $filters.timeRange.start || $filters.timeRange.end
			? 'No matches found for selected filters'
			: 'No matches found'}
	</div>
{:else}
	<div class="space-y-4">
		<!-- Filter Controls -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
			<!-- Wave Filter -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Wave:</span>
				<div class="flex gap-1 bg-[#454654] rounded-lg p-1">
					<button
						onclick={() => updateFilter('wave', 'all')}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.wave === 'all' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						All
					</button>
					<button
						onclick={() => updateFilter('wave', 'morning')}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.wave === 'morning' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Morning
					</button>
					<button
						onclick={() => updateFilter('wave', 'afternoon')}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.wave === 'afternoon' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Afternoon
					</button>
				</div>
			</div>
			
			<!-- Division Filter -->
			{#if divisions.length > 1}
				<div class="flex items-center gap-2">
					<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Division:</span>
					<select
						value={$filters.division || ''}
						onchange={(e) => updateFilter('division', e.target.value || null)}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
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
					<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Team:</span>
					<select
						multiple
						value={$filters.teams}
						onchange={(e) => {
							const selected = Array.from(e.target.selectedOptions, option => option.value);
							updateFilter('teams', selected);
						}}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0 min-w-[120px]"
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
				<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Time:</span>
				<div class="flex gap-1 bg-[#454654] rounded-lg p-1">
					<button
						onclick={() => updateFilter('timeRange', { start: null, end: null })}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.timeRange.start === null && $filters.timeRange.end === null ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						All
					</button>
					<button
						onclick={() => updateFilter('timeRange', { start: '08:00', end: '14:30' })}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.timeRange.start === '08:00' && $filters.timeRange.end === '14:30' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Morning
					</button>
					<button
						onclick={() => updateFilter('timeRange', { start: '14:30', end: '23:59' })}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$filters.timeRange.start === '14:30' && $filters.timeRange.end === '23:59' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Afternoon
					</button>
				</div>
			</div>
			
			<!-- Priority Filter - Media Only -->
			{#if $isMedia}
				<div class="flex items-center gap-2">
					<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Priority:</span>
					<select
						value={$filters.priority || 'all'}
						onchange={(e) => updateFilter('priority', e.target.value === 'all' ? 'all' : e.target.value as any)}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
					>
						<option value="all">All Priorities</option>
						<option value="must-cover">Must Cover</option>
						<option value="priority">Priority</option>
						<option value="optional">Optional</option>
					</select>
				</div>
			{/if}
			
			<!-- Clear Filters -->
			{#if $filters.division || $filters.wave !== 'all' || $filters.teams.length > 0 || $filters.timeRange.start || $filters.timeRange.end || ($filters.priority && $filters.priority !== 'all') || ($filters.coverageStatus && $filters.coverageStatus !== 'all')}
				<button
					onclick={resetFilters}
					class="px-3 py-2 sm:py-1 text-xs font-medium rounded-lg transition-colors text-[#9fa2ab] hover:text-[#f8f8f9] hover:bg-[#454654] border border-[#525463] min-h-[44px] sm:min-h-0"
				>
					Clear
				</button>
			{/if}
		</div>
		
		<!-- Timeline Header -->
		<div class="flex items-center justify-between">
			<div class="text-xs text-[#9fa2ab]">
				Timeline: {formatMatchTime(earliestTime)} - {formatMatchTime(latestTime)}
				{#if filteredMatches.length !== matches.length}
					<span class="ml-2">
						({filteredMatches.length} of {matches.length})
					</span>
				{/if}
			</div>
			{#if highlightedTeam}
				<div class="flex items-center gap-2">
					<span class="text-xs text-[#9fa2ab]">Showing:</span>
					<span class="px-2 py-1 text-xs font-semibold rounded bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50">
						Team {highlightedTeam}
					</span>
					<button
						onclick={() => highlightedTeam = null}
						class="text-xs text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
						aria-label="Clear highlight"
					>
						✕
					</button>
				</div>
			{/if}
		</div>
		
		<!-- Court Timelines -->
		<div class="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
			<div class="space-y-4 min-w-max sm:min-w-0">
				{#each courts as courtName}
					{@const courtMatches = matchesByCourt[courtName]}
					<div class="border-b border-[#454654] pb-4 last:border-b-0 last:pb-0 min-w-[600px] sm:min-w-0">
						<!-- Court Header -->
						<div class="flex items-center justify-between mb-2">
							<div class="text-base font-semibold text-[#f8f8f9]">{courtName}</div>
							<div class="text-xs text-[#808593]">
								{courtMatches.length} match{courtMatches.length !== 1 ? 'es' : ''}
							</div>
						</div>
						
						<!-- Timeline Bar -->
						<div class="relative h-20 sm:h-20 rounded-lg border overflow-hidden bg-[#3b3c48] border-[#454654]">
							<!-- Time gaps visualization -->
							{#each calculateGaps(courtMatches) as gap, gapIndex}
								{@const gapStart = getPosition(gap.before.ScheduledEndDateTime)}
								{@const gapEnd = getPosition(gap.after.ScheduledStartDateTime)}
								{@const gapWidth = gapEnd - gapStart}
								{@const isLargeGap = gap.gapMinutes >= 30}
								{@const isMediumGap = gap.gapMinutes >= 15 && gap.gapMinutes < 30}
								
								{#if gapWidth >= 1}
									<div
										class="absolute top-0 bottom-0 flex items-center justify-center"
										style="left: {gapStart}%; width: {gapWidth}%; z-index: 0;"
										title="{gap.gapMinutes} min gap between matches"
									>
										{#if gapWidth > 3}
											<div class="text-[9px] font-medium px-1 py-0.5 rounded {isLargeGap ? 'bg-green-500/20 text-green-400' : isMediumGap ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}">
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
									class="group absolute h-16 rounded-md px-2 py-1.5 text-white shadow-sm border-2 flex flex-col justify-center transition-all active:scale-95 sm:hover:z-20 sm:hover:shadow-lg touch-manipulation cursor-pointer {isSelected ? 'ring-2 ring-[#eab308] ring-offset-2 ring-offset-[#3b3c48]' : ''} {isHighlighted ? 'ring-2 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''} {shouldDim ? 'opacity-30' : ''} {isInPlan ? 'ring-1 ring-[#eab308] ring-offset-1 ring-offset-[#3b3c48]' : ''} {isCovered ? 'opacity-60' : ''}"
									style="left: {left}%; width: {width}%; background-color: {backgroundColor}; border-color: {borderColor}; min-width: 100px; z-index: {zIndex};"
									title="{match.CompleteShortName}: {match.FirstTeamText} vs {match.SecondTeamText} - {formatMatchTime(match.ScheduledStartDateTime)}{hasConflict ? ' (Click to see conflicts)' : ' (Click to add to plan)'}{matchPriority ? ` [Priority: ${matchPriority}]` : ''}{isOpportunity && !isInPlan ? ' [Easy opportunity]' : ''}{teamCoverageStatus !== 'not-covered' ? ` [Coverage: ${teamCoverageStatus}]` : ''}"
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
										<div class="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" title="Easy coverage opportunity" />
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
										class="text-xs sm:text-sm font-bold truncate leading-tight {teamId ? 'cursor-pointer hover:underline' : ''}"
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
												<!-- TODO: PrioritySelector component -->
												<div class="absolute left-full top-0 ml-2 z-50">
													PrioritySelector - To be migrated
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
												<!-- TODO: CoverageStatusSelector component -->
												<div class="absolute left-full top-0 ml-2 z-50">
													CoverageStatusSelector - To be migrated
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
			<!-- TODO: ConflictDetailsPanel component -->
			<div class="text-[#9fa2ab] mt-4 p-4 border border-[#454654] rounded-lg">
				ConflictDetailsPanel - To be migrated
			</div>
		{/if}
		
		<!-- Scorekeeper Modal -->
		{#if scorekeeperMatch && matchClaiming && matchClaiming.isClaimOwner(scorekeeperMatch.MatchId)}
			<!-- TODO: Scorekeeper component -->
			<div class="text-[#9fa2ab]">Scorekeeper - To be migrated</div>
		{/if}
		
		<!-- Close priority menu when clicking outside -->
		{#if priorityMenuOpen !== null}
			<div
				class="fixed inset-0 z-40"
				onclick={() => priorityMenuOpen = null}
			/>
		{/if}
		
		<!-- Close coverage status menu when clicking outside -->
		{#if coverageStatusMenuOpen !== null}
			<div
				class="fixed inset-0 z-40"
				onclick={() => coverageStatusMenuOpen = null}
			/>
		{/if}
	</div>
{/if}

