<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, calculateTimeGap, formatTimeGap } from '$lib/utils/dateUtils';
	import { detectConflicts } from '$lib/utils/matchFilters';
	import { detectOpportunities } from '$lib/utils/opportunityDetector';
	import { generateCoverageSuggestions } from '$lib/utils/coverageSuggestions';
	import { exportScoresToJSON, importScoresFromJSON, generateScoreShareUrl, extractScoresFromUrl, hasShareableScoresInUrl } from '$lib/utils/scoreShare';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { filters, applyFilters, updateFilter, resetFilters, getUniqueDivisions, getUniqueTeams, getTeamIdentifier as getTeamIdFromFilter } from '$lib/stores/filters';
	import { priority } from '$lib/stores/priority';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { followedTeams } from '$lib/stores/followedTeams';
	import { notifications } from '$lib/stores/notifications';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	import { createMatchNotesStore } from '$lib/stores/matchNotes';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import type { CoverageStatus } from '$lib/stores/coverageStatus';
	import type { SetScore } from '$lib/types';
	
	import TeamDetailPanel from '$lib/components/TeamDetailPanel.svelte';
	import MatchDetailSheet from '$lib/components/MatchDetailSheet.svelte';
	import PrioritySelector from '$lib/components/PrioritySelector.svelte';
	import CoverageStatusSelector from '$lib/components/CoverageStatusSelector.svelte';
	import MatchClaimButton from '$lib/components/MatchClaimButton.svelte';
	import Scorekeeper from '$lib/components/Scorekeeper.svelte';
	import LiveScoreIndicator from '$lib/components/LiveScoreIndicator.svelte';
	import MyTeamsSelector from '$lib/components/MyTeamsSelector.svelte';
	import LiveMatchDashboard from '$lib/components/LiveMatchDashboard.svelte';
	import ClaimHistoryPanel from '$lib/components/ClaimHistoryPanel.svelte';
	import FilterBottomSheet from '$lib/components/FilterBottomSheet.svelte';
	import MatchCardMobile from '$lib/components/MatchCardMobile.svelte';
	
	export let matches: FilteredMatch[];
	export let eventId: string;
	export let clubId: number;
	
	type SortMode = 'team' | 'court' | 'time' | 'priority';
	
	let sortMode: SortMode = 'team';
	let expandedMatch: number | null = null;
	let detailSheetMatch: FilteredMatch | null = null;
	let priorityMenuOpen: number | null = null;
	let coverageStatusMenuOpen: string | null = null;
	let scanningMode = false;
	let showSuggestions = false;
	let scorekeeperMatch: FilteredMatch | null = null;
	let showScoreExportMenu = false;
	let showScoreImportDialog = false;
	let showClaimHistory = false;
	let claimHistoryMatchId: number | undefined = undefined;
	let importJson = '';
	let importError: string | null = null;
	let previousClaimedMatchIds = new Set<number>();
	let showFilterSheet = false;
	
	function getActiveFilterCount(): number {
		let count = 0;
		if ($filters.wave !== 'all') count++;
		if ($filters.division) count++;
		if ($filters.teams.length > 0) count++;
		if ($filters.timeRange.start || $filters.timeRange.end) count++;
		if ($filters.priority && $filters.priority !== 'all') count++;
		if ($filters.coverageStatus && $filters.coverageStatus !== 'all') count++;
		return count;
	}
	
	$: activeFilterCount = getActiveFilterCount();
	
	// Create match claiming store
	let matchClaiming: ReturnType<typeof createMatchClaiming>;
	
	$: {
		const isSpectatorValue = $isSpectator;
		matchClaiming = createMatchClaiming({ 
			eventId, 
			userId: isSpectatorValue ? 'spectator' : 'anonymous' 
		});
	}
	
	// Create match notes store
	const matchNotes = createMatchNotesStore(eventId);
	
	// Conflicts calculation
	$: conflicts = detectConflicts(matches);
	
	// Get unique divisions and teams for filter dropdowns
	$: divisions = (() => {
		if ($filters.wave !== 'all') {
			// Filter divisions by wave
			const waveStart = $filters.wave === 'morning' ? '08:00' : '14:30';
			const waveEnd = $filters.wave === 'morning' ? '14:30' : '23:59';
			return getUniqueDivisions(matches).filter(div => {
				// Check if any match in this division falls within the wave
				return matches.some(m => {
					const matchTime = formatMatchTime(m.ScheduledStartDateTime);
					const timeOnly = matchTime.split(' ')[1] || matchTime;
					return timeOnly >= waveStart && timeOnly < waveEnd && m.Division.Name === div;
				});
			});
		}
		return getUniqueDivisions(matches);
	})();
	
	$: teams = getUniqueTeams(matches);
	
	// Build coverage status map for suggestions
	$: coverageStatusMap = (() => {
		const map = new Map<string, CoverageStatus>();
		matches.forEach(match => {
			const teamId = getTeamIdFromFilter(match);
			if (teamId) {
				map.set(teamId, coverageStatus.getTeamStatus(teamId));
			}
		});
		return map;
	})();
	
	// Generate coverage suggestions
	$: coverageSuggestions = (() => {
		const selectedSet = get(coveragePlan);
		return generateCoverageSuggestions(
			matches,
			selectedSet,
			conflicts,
			coverageStatusMap,
			getTeamIdFromFilter,
			{
				excludeSelected: true,
				preferUncovered: true,
				preferNoConflicts: true,
				preferNearSelected: true,
				maxResults: 10,
			}
		);
	})();
	
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
		
		// Apply "My Teams" filter for spectators (only if explicitly enabled)
		if ($isSpectator && $filters.myTeamsOnly) {
			let followedTeamIds: string[] = [];
			followedTeams.subscribe(teams => {
				followedTeamIds = teams.map(t => t.teamId);
			})();
			
			if (followedTeamIds.length > 0) {
				filtered = filtered.filter(m => {
					const teamId = getTeamIdFromFilter(m);
					return teamId && followedTeamIds.includes(teamId);
				});
			}
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
	
	// Calculate coverage statistics
	$: coverageStats = (() => {
		const teamStatusMap = new Map<string, string>();
		matches.forEach(match => {
			const teamId = getTeamIdFromFilter(match);
			if (teamId) {
				const status = coverageStatus.getTeamStatus(teamId);
				teamStatusMap.set(teamId, status);
			}
		});
		
		const totalTeams = teamStatusMap.size;
		const coveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'covered').length;
		const partiallyCoveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'partially-covered').length;
		const plannedTeams = Array.from(teamStatusMap.values()).filter(s => s === 'planned').length;
		const uncoveredTeams = Array.from(teamStatusMap.values()).filter(s => s === 'not-covered').length;
		
		return {
			totalTeams,
			coveredTeams,
			partiallyCoveredTeams,
			plannedTeams,
			uncoveredTeams,
			coveragePercentage: totalTeams > 0 ? ((coveredTeams + partiallyCoveredTeams) / totalTeams) * 100 : 0,
		};
	})();
	
	// Get opponent
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
	
	// Sort matches
	$: sortedMatches = (() => {
		let sorted = [...filteredMatches];
		
		if (sortMode === 'priority') {
			sorted.sort((a, b) => {
				const priorityA = priority.getPriority(a.MatchId);
				const priorityB = priority.getPriority(b.MatchId);
				
				const priorityOrder: Record<string, number> = {
					'must-cover': 3,
					'priority': 2,
					'optional': 1,
					'null': 0,
				};
				
				const orderA = priorityOrder[priorityA || 'null'];
				const orderB = priorityOrder[priorityB || 'null'];
				
				if (orderA !== orderB) {
					return orderB - orderA;
				}
				
				return a.ScheduledStartDateTime - b.ScheduledStartDateTime;
			});
		} else if (sortMode === 'team') {
			sorted.sort((a, b) => {
				const teamA = getTeamIdFromFilter(a);
				const teamB = getTeamIdFromFilter(b);
				return teamA.localeCompare(teamB);
			});
		} else if (sortMode === 'court') {
			sorted.sort((a, b) => {
				return a.CourtName.localeCompare(b.CourtName);
			});
		} else {
			sorted.sort((a, b) => {
				return a.ScheduledStartDateTime - b.ScheduledStartDateTime;
			});
		}
		
		return sorted;
	})();
	
	// Group matches by start time
	$: matchesByStartTime = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		sortedMatches.forEach(match => {
			const startTime = formatMatchTime(match.ScheduledStartDateTime);
			if (!grouped[startTime]) {
				grouped[startTime] = [];
			}
			grouped[startTime].push(match);
		});
		return grouped;
	})();
	
	$: startTimes = (() => {
		return Object.keys(matchesByStartTime).sort((a, b) => {
			const timeA = new Date(`2000-01-01 ${a}`).getTime();
			const timeB = new Date(`2000-01-01 ${b}`).getTime();
			return timeA - timeB;
		});
	})();
	
	// Handle score export
	function handleExportScores() {
		const jsonData = exportScoresToJSON(eventId);
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `scores-${eventId}-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showScoreExportMenu = false;
	}
	
	// Handle score share link
	function handleShareScoreLink() {
		const shareUrl = generateScoreShareUrl(eventId);
		navigator.clipboard.writeText(shareUrl).then(() => {
			alert('Score link copied to clipboard! Share this link with others.');
			showScoreExportMenu = false;
		}).catch(() => {
			prompt('Copy this link to share scores:', shareUrl);
		});
	}
	
	// Handle score import
	function handleImportScores() {
		try {
			importError = null;
			const result = importScoresFromJSON(importJson);
			
			if (result.success) {
				alert(`Successfully imported ${result.imported} score(s)!`);
				showScoreImportDialog = false;
				importJson = '';
				window.location.reload();
			} else {
				importError = result.errors.join(', ');
			}
		} catch (error) {
			importError = `Failed to import scores: ${error}`;
		}
	}
	
	// Auto-open scorekeeper when a match is newly claimed
	$: if ($isSpectator && matches.length > 0) {
		const currentClaimed = new Set<number>();
		matches.forEach(match => {
			if (matchClaiming.isClaimOwner(match.MatchId)) {
				currentClaimed.add(match.MatchId);
				
				if (!previousClaimedMatchIds.has(match.MatchId) && 
					(!scorekeeperMatch || scorekeeperMatch.MatchId !== match.MatchId)) {
					setTimeout(() => {
						scorekeeperMatch = match;
					}, 200);
				}
			}
		});
		previousClaimedMatchIds = currentClaimed;
	}
	
	// Check for shareable scores in URL on mount
	onMount(() => {
		if (hasShareableScoresInUrl()) {
			const urlData = extractScoresFromUrl();
			if (urlData && urlData.scores.length > 0) {
				const jsonData = JSON.stringify({ eventId: urlData.eventId, scores: urlData.scores }, null, 2);
				importJson = jsonData;
				showScoreImportDialog = true;
			}
		}
		
		// Start polling for match claiming
		matchClaiming.startPolling();
		
		// Check for upcoming matches and send notifications
		if ($isSpectator) {
			let followedTeamIds: string[] = [];
			followedTeams.subscribe(teams => {
				followedTeamIds = teams.map(t => t.teamId);
			})();
			
			if (followedTeamIds.length > 0) {
				const interval = setInterval(() => {
					notifications.checkUpcomingMatches(matches, followedTeamIds);
				}, 60000);
				
				return () => clearInterval(interval);
			}
		}
	});
	
	onDestroy(() => {
		matchClaiming.stopPolling();
	});
	
	// Notify on score updates
	$: if ($isSpectator && matches.length > 0) {
		let followedTeamIds: string[] = [];
		followedTeams.subscribe(teams => {
			followedTeamIds = teams.map(t => t.teamId);
		})();
		
		matches.forEach(match => {
			const teamId = getTeamIdFromFilter(match);
			if (teamId && followedTeamIds.includes(teamId)) {
				const score = matchClaiming.getScore(match.MatchId);
				if (score && score.status === 'in-progress') {
					notifications.notifyScoreUpdate(match, score);
				}
			}
		});
	}
</script>

{#if filteredMatches.length === 0}
	<div class="text-center py-12 text-charcoal-300 text-sm">
		{$filters.division || $filters.wave !== 'all' || $filters.teams.length > 0 || $filters.timeRange.start || $filters.timeRange.end
			? 'No matches found for selected filters'
			: 'No matches found'}
	</div>
{:else}
	<div>
		{#if $isSpectator}
			<LiveMatchDashboard {matches} {eventId} userId={$isSpectator ? 'spectator' : 'anonymous'} />
		{/if}
		
		<!-- Coverage Statistics Header - Media Only -->
		{#if $isMedia && coverageStats.totalTeams > 0}
			<div class="mb-4 px-4 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 flex items-center justify-between flex-wrap gap-2">
				<div class="flex items-center gap-4 flex-wrap">
					<div class="text-xs text-charcoal-300">
						<span class="font-semibold text-charcoal-50">{coverageStats.coveragePercentage.toFixed(0)}%</span> Coverage
					</div>
					<div class="flex items-center gap-2 text-xs">
						<span class="text-green-400">✓ {coverageStats.coveredTeams}</span>
						<span class="text-charcoal-300">/</span>
						<span class="text-[#f59e0b]">◐ {coverageStats.partiallyCoveredTeams}</span>
						<span class="text-charcoal-300">/</span>
						<span class="text-gold-500">📋 {coverageStats.plannedTeams}</span>
						<span class="text-charcoal-300">/</span>
						<span class="text-charcoal-400">○ {coverageStats.uncoveredTeams}</span>
					</div>
				</div>
				
				<!-- Scanning Mode Button - Media Only -->
				{#if $isMedia}
					<div class="mt-8 pt-6 border-t border-charcoal-700">
						<button
							onclick={() => scanningMode = !scanningMode}
							class="w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] {scanningMode ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600'}"
							title="Dim covered teams to focus on uncovered"
						>
							{scanningMode ? '👁️ Scanning' : 'Scanning Mode'}
						</button>
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Coverage Suggestions Panel - Media Only -->
		{#if $isMedia && showSuggestions && coverageSuggestions.length > 0}
			<div class="mb-4 rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-semibold text-charcoal-50">Coverage Suggestions</h3>
					<button
						onclick={() => showSuggestions = false}
						class="text-charcoal-300 hover:text-charcoal-50 transition-colors"
						aria-label="Close suggestions"
					>
						✕
					</button>
				</div>
				<div class="space-y-2">
					{#each coverageSuggestions.slice(0, 5) as suggestion}
						<div
							class="flex items-center justify-between px-3 py-2 rounded bg-charcoal-700 border border-charcoal-600 hover:border-gold-500/50 transition-colors"
						>
							<div class="flex-1 min-w-0">
								<div class="text-xs font-medium text-charcoal-50 truncate">
									{formatMatchTime(suggestion.match.ScheduledStartDateTime)} - {suggestion.match.CourtName} - Team {suggestion.teamId}
								</div>
								<div class="text-[10px] text-charcoal-300 mt-0.5">{suggestion.reason}</div>
							</div>
							<button
								onclick={(e) => {
									e.stopPropagation();
									coveragePlan.selectMatch(suggestion.match.MatchId);
								}}
								class="ml-3 px-3 py-1 text-xs font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors flex-shrink-0"
							>
								Add
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Coverage Legend - Media Only -->
		{#if $isMedia}
			<div class="mb-4 px-3 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 text-xs">
				<div class="font-medium text-charcoal-300 uppercase tracking-wider mb-2">Coverage Status Legend</div>
				<div class="flex flex-wrap gap-4 text-charcoal-200">
					<div class="flex items-center gap-1.5">
						<div class="w-4 h-4 rounded border border-gold-500 bg-gold-500/5"></div>
						<span>Uncovered</span>
					</div>
					<div class="flex items-center gap-1.5">
						<div class="w-4 h-4 rounded border border-gold-500/50 bg-gold-500/10"></div>
						<span>Planned</span>
					</div>
					<div class="flex items-center gap-1.5">
						<div class="w-4 h-4 rounded border border-green-500/30 bg-green-950/5"></div>
						<span>Covered</span>
					</div>
					<div class="flex items-center gap-1.5">
						<div class="w-4 h-4 rounded border border-red-800/50 bg-red-950/10"></div>
						<span>Conflict</span>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Sort & Filter Controls -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
		<!-- Mobile: Floating Filter Button -->
		<button
			onclick={() => showFilterSheet = true}
			class="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg flex items-center justify-center font-semibold z-[60] sm:hidden hover:bg-brand-600 transition-colors"
			aria-label="Open filters"
		>
				Filters
				{#if activeFilterCount > 0}
					<span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error-500 text-charcoal-50 text-xs flex items-center justify-center">
						{activeFilterCount}
					</span>
				{/if}
			</button>
			
			<!-- Desktop: Inline Filters (Hidden when sidebar is available) -->
			<div class="hidden sm:flex lg:hidden flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
				<div class="flex items-center gap-2">
					<span class="text-xs text-charcoal-300 uppercase tracking-wider">Sort:</span>
					<div class="flex gap-1 bg-charcoal-700 rounded-lg p-1">
						<button
							onclick={() => sortMode = 'team'}
							class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {sortMode === 'team' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
						>
							Team
						</button>
						<button
							onclick={() => sortMode = 'court'}
							class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {sortMode === 'court' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
						>
							Court
						</button>
						<button
							onclick={() => sortMode = 'time'}
							class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {sortMode === 'time' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
						>
							Time
						</button>
					</div>
				</div>
				
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
				
				<!-- My Teams Selector - Spectator Only -->
				{#if $isSpectator}
					<div class="flex items-center gap-2">
						<MyTeamsSelector {matches} />
					</div>
				{/if}
			</div>
			
			<!-- Mobile: Sort Only (Filters in bottom sheet) -->
			<div class="flex items-center gap-2 sm:hidden">
				<span class="text-xs text-charcoal-300 uppercase tracking-wider">Sort:</span>
				<div class="flex gap-1 bg-charcoal-700 rounded-lg p-1">
					<button
						onclick={() => sortMode = 'team'}
						class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] {sortMode === 'team' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Team
					</button>
					<button
						onclick={() => sortMode = 'court'}
						class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] {sortMode === 'court' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Court
					</button>
					<button
						onclick={() => sortMode = 'time'}
						class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] {sortMode === 'time' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Time
					</button>
				</div>
			</div>
			
			<!-- TODO: Add remaining filter controls and match list rendering -->
			<!-- This is a partial migration - remaining sections will be added incrementally -->
		</div>
		
		<!-- Filter Bottom Sheet (Mobile Only) -->
		<FilterBottomSheet
			{matches}
			{divisions}
			{teams}
			open={showFilterSheet}
			onClose={() => showFilterSheet = false}
		/>
		
		<!-- Matches List - Grouped by Start Time -->
		<div data-match-list class="space-y-4">
			{#if startTimes.length === 0}
				<div class="text-center py-12 text-charcoal-300 text-sm">
					No matches found
				</div>
			{:else}
				{#each startTimes as startTime}
					{@const timeMatches = matchesByStartTime[startTime]}
					{@const timeConflicts = timeMatches.filter(m => conflicts.has(m.MatchId)).length}
					{@const hasAnyConflict = timeConflicts > 0}
					{@const allHaveConflicts = timeConflicts === timeMatches.length}
					
					<div class="space-y-2">
						<!-- Time Header - Compact -->
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								<h3 class="text-base font-bold text-charcoal-50">{startTime}</h3>
								<span class="text-xs text-charcoal-300">
									{timeMatches.length} match{timeMatches.length !== 1 ? 'es' : ''}
								</span>
							</div>
							{#if hasAnyConflict}
								<span class="text-xs font-medium text-warning-500">
									{timeConflicts} conflict{timeConflicts !== 1 ? 's' : ''}
								</span>
							{/if}
						</div>
						
						<!-- Matches at this time -->
						<div class="space-y-1">
						{#each timeMatches as match, index}
							{@const hasConflict = conflicts.has(match.MatchId)}
							{@const teamId = getTeamIdFromFilter(match)}
							{@const opponent = getOpponent(match)}
							{@const isExpanded = expandedMatch === match.MatchId}
							{@const matchPriority = priority.getPriority(match.MatchId)}
							{@const isOpportunity = opportunityMatchIds.has(match.MatchId)}
							{@const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered'}
							{@const isCovered = teamCoverageStatus === 'covered' || teamCoverageStatus === 'partially-covered'}
							{@const isPlanned = teamCoverageStatus === 'planned'}
							{@const isUncovered = teamCoverageStatus === 'not-covered'}
							{@const shouldDim = scanningMode && isCovered}
							{@const currentPlan = get(coveragePlan)}
							{@const isSelected = currentPlan.has(match.MatchId)}
							{@const showConflictStyling = hasConflict && !allHaveConflicts}
							
							<div>
								<!-- Mobile: Touch-Optimized Card Layout (<1024px) -->
								<div class="lg:hidden">
									<MatchCardMobile
										{match}
										{hasConflict}
										{conflicts}
										scanningMode={scanningMode}
										onTap={(m) => detailSheetMatch = m}
										onSwipeRight={$isMedia ? (m) => coveragePlan.toggleMatch(m.MatchId) : null}
										onSwipeLeft={null}
									/>
								</div>
								
					<!-- Desktop: Dense Horizontal Row Layout (≥1024px) - Old Design -->
					<div class="hidden lg:flex lg:items-center lg:gap-4 lg:py-2 lg:px-3 lg:border-b lg:border-charcoal-700 hover:bg-[#2a2a2f]/50 transition-colors cursor-pointer {shouldDim ? 'opacity-30' : ''}"
						onclick={() => expandedMatch = isExpanded ? null : match.MatchId}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') expandedMatch = isExpanded ? null : match.MatchId; }}
						data-match-card
						role="button"
						tabindex="0"
					>
									<!-- Column 1: Team ID + Division Code (Left-Aligned) -->
									<div class="flex-shrink-0 w-16">
										<div class="text-base font-bold text-charcoal-50 leading-tight">
											{teamId || match.Division.CodeAlias}
										</div>
										<div class="text-xs text-charcoal-300 leading-tight mt-0.5">
											{match.Division.CodeAlias}
										</div>
									</div>
									
									<!-- Column 2: Court Name (Yellow, Prominent) -->
									<div class="flex-shrink-0 w-28">
										<div class="text-base font-bold text-[#facc15] leading-tight">
											{match.CourtName}
										</div>
									</div>
									
									<!-- Column 3: Opponent (Flexible Width) -->
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<!-- Team Color Indicator - Spectator Only -->
											{#if $isSpectator && teamId}
												{@const teamColor = followedTeams.getTeamColor(teamId)}
												{#if teamColor}
													<div
														class="w-3 h-3 rounded-full flex-shrink-0"
														style="background-color: {teamColor};"
														title="{teamId} (followed)"
													/>
												{/if}
											{/if}
											<div class="text-sm text-charcoal-200 truncate">
												vs {opponent}
											</div>
											{#if hasConflict}
												<span class="text-xs text-warning-500 flex-shrink-0">⚠️</span>
											{/if}
										</div>
									</div>
									
									<!-- Column 4: Action Buttons (Right-Aligned, Horizontal) -->
									<div class="flex items-center gap-2 flex-shrink-0">
										<!-- Selection Checkbox - Media Only -->
										{#if $isMedia}
											<button
												onclick={(e) => {
													e.stopPropagation();
													coveragePlan.toggleMatch(match.MatchId);
												}}
												class="flex-shrink-0 w-5 h-5 rounded border-2 {isSelected ? 'border-gold-500 bg-gold-500/20' : 'border-charcoal-600 bg-transparent'} flex items-center justify-center hover:bg-charcoal-700 transition-colors"
												aria-label={isSelected ? 'Remove from plan' : 'Add to plan'}
											>
												{#if isSelected}
													<svg class="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
													</svg>
												{:else}
													<span class="text-xs text-charcoal-300">+</span>
												{/if}
											</button>
										{/if}
										
										<!-- Priority Button - Media Only -->
										{#if $isMedia}
											<div class="relative">
												<button
													onclick={(e) => {
														e.stopPropagation();
														priorityMenuOpen = priorityMenuOpen === match.MatchId ? null : match.MatchId;
													}}
													class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-charcoal-700 {matchPriority === 'must-cover' ? 'text-gold-500' : matchPriority === 'priority' ? 'text-[#f59e0b]' : matchPriority === 'optional' ? 'text-charcoal-300' : 'text-charcoal-400'}"
													aria-label="Set priority"
													title={matchPriority ? `Priority: ${matchPriority}` : 'Set priority'}
												>
													{matchPriority === 'must-cover' && '⭐'}
													{matchPriority === 'priority' && '🔸'}
													{matchPriority === 'optional' && '○'}
													{#if !matchPriority}
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
														</svg>
													{/if}
												</button>
												{#if priorityMenuOpen === match.MatchId}
													<div class="absolute right-0 top-8 z-50">
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
													class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-charcoal-700 {teamCoverageStatus === 'covered' ? 'text-green-500' : teamCoverageStatus === 'partially-covered' ? 'text-[#f59e0b]' : teamCoverageStatus === 'planned' ? 'text-gold-500' : 'text-charcoal-400'}"
													aria-label="Set coverage status"
													title="Coverage: {teamCoverageStatus}"
												>
													{teamCoverageStatus === 'covered' && '✓'}
													{teamCoverageStatus === 'partially-covered' && '◐'}
													{teamCoverageStatus === 'planned' && '📋'}
													{teamCoverageStatus === 'not-covered' && '○'}
												</button>
												{#if coverageStatusMenuOpen === teamId}
													<div class="absolute right-0 top-8 z-50">
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
									
										<!-- Spectator Features -->
										{#if $isSpectator}
											{@const score = matchClaiming.getScore(match.MatchId)}
											{@const claimStatus = matchClaiming.getClaimStatus(match.MatchId)}
											{@const isOwner = matchClaiming.isClaimOwner(match.MatchId)}
											
											<!-- Follow Team Button -->
											{#if teamId}
												<button
													onclick={(e) => {
														e.stopPropagation();
														if (followedTeams.isFollowing(teamId)) {
															followedTeams.unfollowTeam(teamId);
														} else {
															followedTeams.followTeam(teamId, teamId);
														}
													}}
													class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded transition-colors {followedTeams.isFollowing(teamId) ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600'}"
													title={followedTeams.isFollowing(teamId) ? 'Unfollow team' : 'Follow team'}
												>
													{followedTeams.isFollowing(teamId) ? '✓' : '+'}
												</button>
											{/if}
											
											<!-- Match Claim Button -->
											<div class="flex-shrink-0">
												<MatchClaimButton
													{match}
													{eventId}
													onClaim={(matchId) => {
														const claimedMatch = matches.find(m => m.MatchId === matchId);
														if (claimedMatch) {
															setTimeout(() => {
																scorekeeperMatch = claimedMatch;
															}, 300);
														}
													}}
													onRelease={() => {
														scorekeeperMatch = null;
													}}
												/>
											</div>
											
											<!-- Start Scoring Button -->
											{#if claimStatus === 'claimed' && isOwner}
												<button
													onclick={(e) => {
														e.stopPropagation();
														scorekeeperMatch = match;
													}}
													class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
													title="Start keeping score for this match"
												>
													{score ? 'Update Score' : 'Start Scoring'}
												</button>
											{/if}
											
											<!-- Live Score Indicator -->
											{#if score && score.status !== 'not-started'}
												<LiveScoreIndicator {match} {matchClaiming} />
											{/if}
										{/if}
									</div>
								</div>
								
								<!-- Desktop Expanded Detail -->
								{#if isExpanded && expandedMatch === match.MatchId}
									<div class="hidden lg:block mt-8">
										<TeamDetailPanel
											{match}
											{eventId}
											{clubId}
											onClose={() => expandedMatch = null}
											{matches}
										/>
									</div>
								{/if}
							</div>
						{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
		
		<!-- Match Detail Sheet (Mobile) -->
		<MatchDetailSheet
			match={detailSheetMatch}
			{eventId}
			{clubId}
			{matches}
			onClose={() => detailSheetMatch = null}
		/>
		
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

		<!-- Claim History Panel -->
		{#if showClaimHistory}
			<ClaimHistoryPanel
				matchId={claimHistoryMatchId}
				{eventId}
				{matches}
				onClose={() => {
					showClaimHistory = false;
					claimHistoryMatchId = undefined;
				}}
			/>
		{/if}

		<!-- Score Export/Import UI - Spectator Only -->
		{#if $isSpectator}
			<!-- Score Actions Button -->
			<div class="fixed bottom-4 right-4 z-50">
				<div class="relative">
					<button
						onclick={() => showScoreExportMenu = !showScoreExportMenu}
						class="px-4 py-2 text-sm font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 hover:text-charcoal-50 transition-colors shadow-lg flex items-center gap-2 border border-charcoal-600"
						title="Score sharing & sync options"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Scores
					</button>
					
					{#if showScoreExportMenu}
						<div class="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-charcoal-700 bg-charcoal-800 shadow-lg p-2">
							<div class="px-3 py-2 text-xs text-charcoal-300 border-b border-charcoal-700 mb-2">
								Score Sharing
							</div>
							<button
								onclick={handleExportScores}
								class="w-full px-3 py-2 text-sm text-left text-charcoal-200 hover:bg-charcoal-700 rounded transition-colors flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Export Scores (JSON)
							</button>
							<button
								onclick={handleShareScoreLink}
								class="w-full px-3 py-2 text-sm text-left text-charcoal-200 hover:bg-charcoal-700 rounded transition-colors flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
								</svg>
								Generate Share Link
							</button>
							<div class="border-t border-charcoal-700 my-2"></div>
							<div class="px-3 py-2 text-xs text-charcoal-300 border-b border-charcoal-700 mb-2">
								Receive Scores
							</div>
							<button
								onclick={() => {
									showScoreImportDialog = true;
									showScoreExportMenu = false;
								}}
								class="w-full px-3 py-2 text-sm text-left text-charcoal-200 hover:bg-charcoal-700 rounded transition-colors flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
								Import Scores from JSON
							</button>
							<div class="px-3 py-1.5 mt-2 text-[10px] text-charcoal-400 bg-charcoal-700/30 rounded">
								💡 Scores sync automatically across tabs. To share with others, use Export or Share Link.
							</div>
							<div class="border-t border-charcoal-700 my-2"></div>
							<div class="px-3 py-2 text-xs text-charcoal-300 border-b border-charcoal-700 mb-2">
								Claim History
							</div>
							<button
								onclick={() => {
									showClaimHistory = true;
									claimHistoryMatchId = undefined;
									showScoreExportMenu = false;
								}}
								class="w-full px-3 py-2 text-sm text-left text-charcoal-200 hover:bg-charcoal-700 rounded transition-colors flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								View All Claim History
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Score Import Dialog -->
			{#if showScoreImportDialog}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div class="bg-charcoal-800 rounded-lg border border-charcoal-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold text-charcoal-50">Import Scores</h3>
							<button
								onclick={() => {
									showScoreImportDialog = false;
									importJson = '';
									importError = null;
								}}
								class="text-charcoal-300 hover:text-charcoal-50 transition-colors"
								aria-label="Close"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-charcoal-200 mb-2">
									Paste JSON score data:
								</label>
								<textarea
									bind:value={importJson}
									class="w-full px-3 py-2 text-sm rounded bg-charcoal-700 text-charcoal-50 border border-charcoal-600 focus:border-gold-500 focus:outline-none font-mono"
									rows="10"
									placeholder='Paste JSON score data here'
								></textarea>
							</div>
							
							{#if importError}
								<div class="px-4 py-2 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
									{importError}
								</div>
							{/if}
							
							<div class="flex justify-end gap-2">
								<button
									onclick={() => {
										showScoreImportDialog = false;
										importJson = '';
										importError = null;
									}}
									class="px-4 py-2 text-sm font-medium rounded bg-charcoal-700 text-charcoal-200 hover:bg-[#525463] transition-colors border border-charcoal-600"
								>
									Cancel
								</button>
								<button
									onclick={handleImportScores}
									class="px-4 py-2 text-sm font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors"
								>
									Import
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}

