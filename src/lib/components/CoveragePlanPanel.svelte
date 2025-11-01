<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { detectConflicts } from '$lib/utils/matchFilters';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { generateCoverageSuggestions } from '$lib/utils/coverageSuggestions';
	import { exportCoveragePlanToICS } from '$lib/utils/icsExport';
	import { createSwipeHandler } from '$lib/utils/gestures';
	import { AlertTriangle, Calendar, Check, Circle, ClipboardList } from 'lucide-svelte';
	import CoverageStatusSelector from '$lib/components/CoverageStatusSelector.svelte';
	import CoverageAnalytics from '$lib/components/CoverageAnalytics.svelte';
	import CoverageStats from '$lib/components/CoverageStats.svelte';
	import TeamMemberSelector from '$lib/components/TeamMemberSelector.svelte';
	import TeamCoverageView from '$lib/components/TeamCoverageView.svelte';
	
	export let matches: FilteredMatch[];
	export let onClose: () => void;
	
	let sheetElement: HTMLDivElement;
	let swipeHandler: ReturnType<typeof createSwipeHandler> | null = null;
	let swipeOffset = 0;
	let isSwiping = false;
	
	interface ConflictGroup {
		matches: FilteredMatch[];
		conflictCount: number;
	}
	
	let activeTab: 'plan' | 'analytics' | 'stats' | 'coordination' = 'plan';
	let selectedDate: string | null = null;
	let coverageStatusFilter: 'all' | 'not-covered' | 'planned' | 'covered' = 'all';
	let coverageStatusMenuOpen: string | null = null;
	let currentConflictIndex = 0;
	let conflictRefs: HTMLDivElement[] = [];
	
	// Auto-update coverage status when matches are added/removed from plan
	$: if (matches.length > 0) {
		const teamMatches = new Map<string, { total: number; inPlan: number }>();
		const currentPlan = get(coveragePlan);
		
		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
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
	
	// Get all selected matches (unfiltered) for date grouping
	$: allSelectedMatches = (() => {
		const currentPlan = get(coveragePlan);
		return matches
			.filter(m => currentPlan.has(m.MatchId))
			.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
	})();
	
	// Group by date (from unfiltered matches)
	$: matchesByDate = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		allSelectedMatches.forEach(match => {
			const dateKey = formatMatchDate(match.ScheduledStartDateTime);
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(match);
		});
		return grouped;
	})();

	$: sortedDates = (() => {
		return Object.keys(matchesByDate).sort((a, b) => {
			const dateA = new Date(a).getTime();
			const dateB = new Date(b).getTime();
			return dateA - dateB;
		});
	})();
	
	// Set default selected date to first date if available
	$: if (sortedDates.length > 0 && !selectedDate) {
		selectedDate = sortedDates[0];
	}
	
	// Get selected matches with full details, filtered by coverage status if needed
	$: selectedMatchesList = (() => {
		let filtered = allSelectedMatches;
		
		// Apply date filter
		if (selectedDate) {
			filtered = filtered.filter(match => {
				const matchDate = formatMatchDate(match.ScheduledStartDateTime);
				return matchDate === selectedDate;
			});
		}
		
		// Apply coverage status filter
		if (coverageStatusFilter !== 'all') {
			filtered = filtered.filter(match => {
				const teamId = getTeamIdentifier(match);
				if (!teamId) return false;
				const status = coverageStatus.getTeamStatus(teamId);
				return status === coverageStatusFilter;
			});
		}
		
		return filtered;
	})();
	
	// Detect conflicts within selected matches
	$: planConflicts = detectConflicts(selectedMatchesList);
	
	// Coverage-aware opportunities
	$: coverageAwareOpportunities = (() => {
		const conflicts = detectConflicts(matches);
		const currentPlan = get(coveragePlan);
		const selectedSet = currentPlan;
		
		const coverageStatusMap = new Map<string, string>();
		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
			if (teamId) {
				coverageStatusMap.set(teamId, coverageStatus.getTeamStatus(teamId));
			}
		});
		
		return generateCoverageSuggestions(
			matches,
			selectedSet,
			conflicts,
			coverageStatusMap as any,
			getTeamIdentifier,
			{
				preferUncovered: true,
				preferNoConflicts: true,
				preferNearSelected: true,
				maxResults: 5,
			}
		);
	})();
	
	// Group conflicts for easier resolution
	$: conflictGroups = (() => {
		if (planConflicts.size === 0) return [];
		
		const groups: ConflictGroup[] = [];
		const processed = new Set<number>();
		
		selectedMatchesList.forEach(match => {
			if (processed.has(match.MatchId)) return;
			
			const conflictIds = planConflicts.get(match.MatchId);
			if (!conflictIds || conflictIds.length === 0) return;
			
			const conflictMatches = [
				match,
				...conflictIds.map(id => selectedMatchesList.find(m => m.MatchId === id)).filter(Boolean) as FilteredMatch[],
			];
			
			conflictMatches.forEach(m => processed.add(m.MatchId));
			
			groups.push({
				matches: conflictMatches.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime),
				conflictCount: conflictMatches.length,
			});
		});
		
		return groups;
	})();
	
	// Get conflicts for a specific match
	function getMatchConflicts(matchId: number): FilteredMatch[] {
		const conflictIds = planConflicts.get(matchId) || [];
		return conflictIds
			.map(id => selectedMatchesList.find(m => m.MatchId === id))
			.filter(Boolean) as FilteredMatch[];
	}
	
	// Scroll to conflict when index changes
	$: if (conflictGroups.length > 0 && conflictRefs[currentConflictIndex]) {
		setTimeout(() => {
			conflictRefs[currentConflictIndex]?.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}, 100);
	}
	
	// Swipe handler for mobile bottom sheet
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
		
		// Prevent body scroll when panel is open on mobile
		document.body.style.overflow = 'hidden';
		
		return () => {
			if (swipeHandler) {
				sheetElement.removeEventListener('touchstart', swipeHandler.handleTouchStart);
				sheetElement.removeEventListener('touchmove', swipeHandler.handleTouchMove);
				sheetElement.removeEventListener('touchend', swipeHandler.handleTouchEnd);
				sheetElement.removeEventListener('touchcancel', swipeHandler.handleTouchCancel);
				swipeHandler.destroy();
			}
			document.body.style.overflow = '';
		};
	});
	
	onDestroy(() => {
		document.body.style.overflow = '';
	});
	
	// Reset conflict index when conflict groups change
	$: if (conflictGroups.length > 0 && currentConflictIndex >= conflictGroups.length) {
		currentConflictIndex = 0;
	} else if (conflictGroups.length === 0) {
		currentConflictIndex = 0;
	}
	
	function handleNextConflict() {
		if (conflictGroups.length > 0) {
			currentConflictIndex = (currentConflictIndex + 1) % conflictGroups.length;
		}
	}
	
	function handlePreviousConflict() {
		if (conflictGroups.length > 0) {
			currentConflictIndex = (currentConflictIndex - 1 + conflictGroups.length) % conflictGroups.length;
		}
	}
	
	// Get opponent
	function getOpponent(m: FilteredMatch): string {
		if (m.InvolvedTeam === 'first') return m.SecondTeamText;
		if (m.InvolvedTeam === 'second') return m.FirstTeamText;
		return `${m.FirstTeamText} vs ${m.SecondTeamText}`;
	}
	
	// Calculate total coverage time
	$: totalCoverageTime = (() => {
		if (selectedMatchesList.length === 0) return 0;
		const earliest = Math.min(...selectedMatchesList.map(m => m.ScheduledStartDateTime));
		const latest = Math.max(...selectedMatchesList.map(m => m.ScheduledEndDateTime));
		return Math.floor((latest - earliest) / 60000); // minutes
	})();
	
	// Export handlers
	function handleExportJSON() {
		const exportData = {
			plan: {
				createdAt: new Date().toISOString(),
				totalMatches: selectedMatchesList.length,
				totalCoverageTime: totalCoverageTime,
				conflicts: conflictGroups.length,
			},
			matches: selectedMatchesList.map(match => ({
				MatchId: match.MatchId,
				Date: formatMatchDate(match.ScheduledStartDateTime),
				Time: formatMatchTime(match.ScheduledStartDateTime),
				Court: match.CourtName,
				Team: getTeamIdentifier(match) || match.Division.CodeAlias,
				Opponent: getOpponent(match),
				Division: match.Division.CodeAlias,
				FirstTeam: match.FirstTeamText,
				SecondTeam: match.SecondTeamText,
				StartTime: new Date(match.ScheduledStartDateTime).toISOString(),
				EndTime: new Date(match.ScheduledEndDateTime).toISOString(),
			})),
		};
		
		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	function handleExportCSV() {
		const headers = [
			'Date',
			'Time',
			'Court',
			'Team',
			'Opponent',
			'Division',
			'First Team',
			'Second Team',
			'Start Time',
			'End Time',
		];
		
		const rows = selectedMatchesList.map(match => [
			formatMatchDate(match.ScheduledStartDateTime),
			formatMatchTime(match.ScheduledStartDateTime),
			match.CourtName,
			getTeamIdentifier(match) || match.Division.CodeAlias,
			getOpponent(match),
			match.Division.CodeAlias,
			match.FirstTeamText,
			match.SecondTeamText,
			new Date(match.ScheduledStartDateTime).toISOString(),
			new Date(match.ScheduledEndDateTime).toISOString(),
		]);
		
		const csvContent = [
			headers.join(','),
			...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
		].join('\n');
		
		const dataBlob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	function handleExportText() {
		let text = 'COVERAGE PLAN\n';
		text += `${'='.repeat(50)}\n\n`;
		text += `Total Matches: ${selectedMatchesList.length}\n`;
		text += `Total Coverage Time: ${Math.floor(totalCoverageTime / 60)}h ${totalCoverageTime % 60}m\n`;
		if (conflictGroups.length > 0) {
			text += `Conflicts: ${conflictGroups.length}\n`;
		}
		text += '\n';
		
		sortedDates.forEach(dateKey => {
			const dateMatches = matchesByDate[dateKey];
			text += `${dateKey}\n`;
			text += `${'-'.repeat(50)}\n`;
			
			dateMatches.forEach(match => {
				const teamId = getTeamIdentifier(match);
				const opponent = getOpponent(match);
				text += `${formatMatchTime(match.ScheduledStartDateTime)} | ${match.CourtName} | ${teamId || match.Division.CodeAlias} vs ${opponent}\n`;
			});
			
			text += '\n';
		});
		
		const dataBlob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.txt`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	function handleExportICS() {
		const icsContent = exportCoveragePlanToICS(
			selectedMatchesList,
			getTeamIdentifier,
			getOpponent,
			'Coverage Plan'
		);
		
		const dataBlob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-plan-${formatMatchDate(selectedMatchesList[0]?.ScheduledStartDateTime || Date.now()).replace(/,/g, '')}.ics`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	async function handleCopyToClipboard() {
		let text = 'COVERAGE PLAN\n';
		text += `${'='.repeat(50)}\n\n`;
		text += `Total Matches: ${selectedMatchesList.length}\n`;
		text += `Total Coverage Time: ${Math.floor(totalCoverageTime / 60)}h ${totalCoverageTime % 60}m\n`;
		if (conflictGroups.length > 0) {
			text += `Conflicts: ${conflictGroups.length}\n`;
		}
		text += '\n';
		
		sortedDates.forEach(dateKey => {
			const dateMatches = matchesByDate[dateKey];
			text += `${dateKey}\n`;
			text += `${'-'.repeat(50)}\n`;
			
			dateMatches.forEach(match => {
				const teamId = getTeamIdentifier(match);
				const opponent = getOpponent(match);
				text += `${formatMatchTime(match.ScheduledStartDateTime)} | ${match.CourtName} | ${teamId || match.Division.CodeAlias} vs ${opponent}\n`;
			});
			
			text += '\n';
		});
		
		try {
			await navigator.clipboard.writeText(text);
			alert('Coverage plan copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			alert('Failed to copy to clipboard. Please try exporting instead.');
		}
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity lg:flex lg:items-center lg:justify-center lg:p-4"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	aria-label="Coverage plan"
	tabindex="-1"
>
	<!-- Mobile: Bottom Sheet / Desktop: Centered Modal -->
	<div
		bind:this={sheetElement}
		class="fixed bottom-0 left-0 right-0 max-h-[90vh] lg:relative lg:max-w-3xl lg:max-h-[90vh] lg:rounded-lg border border-charcoal-700 lg:border-t bg-charcoal-800 lg:bg-charcoal-800 overflow-hidden flex flex-col transform transition-transform lg:transform-none"
		style="transform: translateY({swipeOffset}px); padding-bottom: env(safe-area-inset-bottom);"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		tabindex="-1"
	>
		<!-- Header -->
		<div class="sticky top-0 bg-charcoal-700/50 lg:bg-charcoal-700/50 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between z-10">
			<!-- Mobile: Drag Handle -->
			<div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full lg:hidden"></div>
			
			<div class="flex-1 ml-auto lg:ml-0">
				<h3 class="text-base sm:text-lg font-semibold text-charcoal-50">
					My Coverage Plan
				</h3>
				<div class="flex items-center gap-3 mt-1 flex-wrap">
					<p class="text-xs text-charcoal-300">
						{selectedMatchesList.length} match{selectedMatchesList.length !== 1 ? 'es' : ''} selected
						{#if totalCoverageTime > 0}
							• {Math.floor(totalCoverageTime / 60)}h {totalCoverageTime % 60}m coverage
						{/if}
						{#if conflictGroups.length > 0}
							<span class="ml-2 text-red-400">
								• {conflictGroups.length} conflict{conflictGroups.length !== 1 ? 's' : ''}
							</span>
						{/if}
					</p>
					<!-- Coverage Status Filter -->
					<select
						id="coverage-status-filter-panel"
						value={coverageStatusFilter}
						onchange={(e) => coverageStatusFilter = e.target.value as any}
						class="px-2 py-1 text-xs rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600 focus:border-brand-500 focus:outline-none"
					>
						<option value="all">All Status</option>
						<option value="not-covered">Uncovered</option>
						<option value="planned">Planned</option>
						<option value="covered">Covered</option>
					</select>
				</div>
			</div>
			
			<!-- Tabs (Mobile: Horizontal Scroll) -->
			{#if selectedMatchesList.length > 0}
				<div class="flex items-center gap-1 bg-charcoal-800 rounded-lg p-1 border border-charcoal-700 mx-4 overflow-x-auto scrollbar-hide">
					<button
						type="button"
						onclick={() => activeTab = 'plan'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 {activeTab === 'plan' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Plan
					</button>
					<button
						type="button"
						onclick={() => activeTab = 'analytics'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 {activeTab === 'analytics' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Analytics
					</button>
					<button
						type="button"
						onclick={() => activeTab = 'stats'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 {activeTab === 'stats' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Stats
					</button>
					<button
						type="button"
						onclick={() => activeTab = 'coordination'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 {activeTab === 'coordination' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-200 hover:text-charcoal-50'}"
					>
						Team
					</button>
				</div>
			{/if}
			
			<button
				type="button"
				onclick={onClose}
				class="text-charcoal-300 hover:text-charcoal-50 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center"
				aria-label="Close panel"
			>
				<svg class="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if activeTab === 'plan'}
				{#if selectedMatchesList.length === 0}
					<div class="text-center py-12 text-charcoal-300 text-sm">
						<p>No matches selected yet</p>
						<p class="text-xs text-charcoal-400 mt-2">
							Click matches in the timeline or list to add them to your coverage plan
						</p>
					</div>
				{:else}
					{#key selectedMatchesList.length}
						{@const totalTeams = new Set(matches.map(m => {
							const teamText = m.InvolvedTeam === 'first' ? m.FirstTeamText : m.SecondTeamText;
							const matchResult = teamText.match(/(\d+-\d+)/);
							return matchResult ? matchResult[1] : '';
						}).filter(Boolean)).size}
						{@const coveredTeams = new Set(Array.from(coverageStatus['_status'] || new Map()).filter(([_, status]) => status === 'covered' || status === 'partially-covered').map(([teamId]) => teamId)).size}
						{@const coveragePercent = totalTeams > 0 ? Math.round((coveredTeams / totalTeams) * 100) : 0}

						<div class="space-y-4">
							<!-- Progress Bar Visualization -->
							<div class="border border-charcoal-700 rounded-lg bg-charcoal-800/50 p-4">
								<div class="flex items-center justify-between mb-2">
									<h4 class="text-sm font-semibold text-charcoal-50">Coverage Progress</h4>
									<span class="text-lg font-bold text-brand-400">{coveragePercent}%</span>
								</div>
								<div class="w-full bg-charcoal-700 rounded-full h-3 overflow-hidden">
									<div
										class="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 rounded-full"
										style="width: {coveragePercent}%"
									></div>
								</div>
								<div class="flex items-center justify-between mt-2 text-xs text-charcoal-400">
									<span>{coveredTeams} of {totalTeams} teams covered</span>
									<span>{selectedMatchesList.length} matches selected</span>
								</div>
								</div>

							<!-- Date Selector -->
							{#if sortedDates.length > 0}
								<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
									{#each sortedDates as dateKey}
										<button
											type="button"
											onclick={() => selectedDate = dateKey}
											class="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[40px] {selectedDate === dateKey ? 'bg-brand-500 text-white' : 'bg-charcoal-800 text-charcoal-300 border border-charcoal-600 hover:bg-charcoal-700 hover:text-charcoal-50'}"
											aria-label={`View matches for ${dateKey}`}
											aria-pressed={selectedDate === dateKey}
										>
											{dateKey}
										</button>
									{/each}
								</div>
							{/if}

							<!-- Conflict Resolution Section -->
						{#if conflictGroups.length > 0}
							<div class="border border-warning-500/50 rounded-lg bg-warning-500/10 p-4">
								<div class="flex items-center justify-between mb-3">
									<div>
										<h4 class="text-sm font-semibold text-warning-500">
											<AlertTriangle size={16} class="inline" />
											Conflicts Detected
										</h4>
										<p class="text-xs text-charcoal-300 mt-0.5">
											{conflictGroups.length} conflict group{conflictGroups.length !== 1 ? 's' : ''} in your plan
											{#if conflictGroups.length > 0}
												<span class="ml-2 text-gold-500">
													• Conflict {currentConflictIndex + 1} of {conflictGroups.length}
												</span>
											{/if}
										</p>
									</div>
									<div class="flex items-center gap-2">
										{#if conflictGroups.length > 1}
											<button
												onclick={handlePreviousConflict}
												class="px-2 py-1 text-xs font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors border border-charcoal-600"
												title="Previous conflict"
											>
												← Prev
											</button>
											<button
												onclick={handleNextConflict}
												class="px-2 py-1 text-xs font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors border border-charcoal-600"
												title="Next conflict"
											>
												Next →
											</button>
										{/if}
										<button
											onclick={() => {
												conflictGroups.forEach(group => {
													group.matches.slice(1).forEach(match => {
														coveragePlan.deselectMatch(match.MatchId);
													});
												});
											}}
											class="px-3 py-1.5 text-xs font-medium rounded-lg bg-warning-500/20 text-warning-500 border border-warning-500/50 hover:bg-warning-500/30 transition-colors"
										>
											Auto-Resolve
										</button>
									</div>
								</div>
								
								<div class="space-y-3">
									{#each conflictGroups as group, groupIndex}
										<div
											bind:this={conflictRefs[groupIndex]}
											class="border rounded p-3 transition-all {groupIndex === currentConflictIndex ? 'border-gold-500 bg-gold-500/5' : 'border-warning-500/30 bg-charcoal-800/50'}"
										>
											<div class="flex items-center gap-2 mb-2">
												<div class="text-xs font-medium text-warning-500">
													Conflict Group {groupIndex + 1}: {group.conflictCount} overlapping match{group.conflictCount !== 1 ? 'es' : ''}
												</div>
												{#if groupIndex === currentConflictIndex}
													<div class="text-[10px] font-semibold text-gold-500 px-1.5 py-0.5 rounded bg-gold-500/20">
														ACTIVE
													</div>
												{/if}
											</div>
											<div class="space-y-2">
												{#each group.matches as match, matchIndex}
													{@const teamId = getTeamIdentifier(match)}
													{@const conflictMatches = getMatchConflicts(match.MatchId)}
													{@const isFirstMatch = matchIndex === 0}
													
													<div class="flex items-center gap-2 px-2 py-1.5 rounded {isFirstMatch ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-charcoal-700/50'}">
														{#if isFirstMatch}
															<div class="flex-shrink-0 text-[10px] font-semibold text-gold-500 px-1.5 py-0.5 rounded bg-gold-500/20">
																KEEP
															</div>
														{/if}
														
														<div class="flex-1 min-w-0">
															<div class="flex items-center gap-2">
																<span class="text-xs font-semibold text-charcoal-50">
																	{formatMatchTime(match.ScheduledStartDateTime)}
																</span>
																<span class="text-xs text-[#facc15] font-medium">
																	{match.CourtName}
																</span>
																<span class="text-xs text-charcoal-200">
																	{teamId || match.Division.CodeAlias}
																</span>
															</div>
															{#if conflictMatches.length > 0}
																<div class="text-[10px] text-charcoal-400 mt-0.5">
																	Conflicts with {conflictMatches.length} other match{conflictMatches.length !== 1 ? 'es' : ''}
																</div>
															{/if}
														</div>
														
														{#if !isFirstMatch}
															<button
																onclick={() => coveragePlan.deselectMatch(match.MatchId)}
																class="px-2 py-1 text-[10px] font-medium rounded bg-warning-500/20 text-warning-500 border border-warning-500/50 hover:bg-warning-500/30 transition-colors"
															>
																Remove
															</button>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- Opportunity Suggestions -->
						{#if coverageAwareOpportunities.length > 0}
							<div class="border border-green-500/50 rounded-lg bg-green-950/10 p-4">
								<div class="flex items-center justify-between mb-3">
									<div>
										<h4 class="text-sm font-semibold text-green-400">
											💡 Coverage Opportunities
										</h4>
										<p class="text-xs text-charcoal-300 mt-0.5">
											{coverageAwareOpportunities.length} suggestion{coverageAwareOpportunities.length !== 1 ? 's' : ''} (prioritizing uncovered teams)
										</p>
									</div>
								</div>
								
								<div class="space-y-2">
									{#each coverageAwareOpportunities as suggestion}
										{@const match = suggestion.match}
										{@const teamId = getTeamIdentifier(match)}
										{@const teamStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered'}
										
										<div class="flex items-center gap-2 px-2 py-1.5 rounded bg-green-950/20 border border-green-500/30">
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-2">
													<span class="text-xs font-semibold text-charcoal-50">
														{formatMatchTime(match.ScheduledStartDateTime)}
													</span>
													<span class="text-xs text-green-400 font-medium">
														{match.CourtName}
													</span>
													<span class="text-xs text-charcoal-200">
														{teamId || match.Division.CodeAlias}
													</span>
													{#if teamStatus === 'not-covered'}
														<span class="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-500 border border-gold-500/50">
															Uncovered
														</span>
													{/if}
												</div>
												<div class="text-[10px] text-charcoal-400 mt-0.5">
													{suggestion.reason}
												</div>
											</div>
											
											<button
												onclick={() => coveragePlan.selectMatch(match.MatchId)}
												class="px-2 py-1 text-xs font-medium rounded transition-colors bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
											>
												Add
											</button>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- Timeline Visualization with Matches -->
						<div class="border border-charcoal-700 rounded-lg bg-charcoal-800/50 p-4">
								<h4 class="text-sm font-semibold text-charcoal-50 mb-4">Upcoming Matches</h4>
								<div class="relative pl-6">
									<!-- Vertical timeline line -->
									<div class="absolute left-2 top-0 bottom-0 w-0.5 bg-charcoal-600"></div>

									{#each selectedMatchesList as match, index}
										{@const teamId = getTeamIdentifier(match)}
										{@const hasConflict = planConflicts.has(match.MatchId)}
										{@const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered'}
										{@const matchDate = formatMatchDate(match.ScheduledStartDateTime)}
										{@const isFirstOfDay = index === 0 || formatMatchDate(selectedMatchesList[index - 1].ScheduledStartDateTime) !== matchDate}
										
										{#if isFirstOfDay && index > 0}
											<div class="mb-4"></div>
										{/if}
										
										{#if isFirstOfDay}
											<!-- Date marker -->
											<div class="relative flex items-center gap-3 mb-3">
												<div class="absolute left-[-22px] w-4 h-4 rounded-full bg-brand-500 border-2 border-charcoal-950 z-10"></div>
												<h5 class="text-xs font-bold text-charcoal-300 uppercase tracking-wide">{matchDate}</h5>
											</div>
										{/if}

										<!-- Match card -->
										<div class="relative mb-4 last:mb-0">
											<div class="absolute left-[-26px] w-3 h-3 rounded-full z-10 border-2 border-charcoal-950 {hasConflict ? 'bg-warning-500' : teamCoverageStatus === 'covered' ? 'bg-success-500' : teamCoverageStatus === 'planned' ? 'bg-gold-500' : 'bg-charcoal-400'}"></div>
											<div class="ml-2 p-3 rounded-lg border border-charcoal-700 bg-charcoal-900">
												<div class="flex items-start justify-between gap-2">
													<div class="flex-1 min-w-0">
														<div class="flex items-center gap-2 mb-1">
															<span class="text-sm font-bold text-charcoal-50">{formatMatchTime(match.ScheduledStartDateTime)}</span>
															<span class="text-xs text-charcoal-500">•</span>
															<span class="text-xs font-medium text-brand-400">{match.CourtName}</span>
														</div>
														<div class="text-xs text-charcoal-300 mb-1">
															Division: {match.Division.CodeAlias}
														</div>
														<div class="text-sm text-charcoal-50">
															{teamId || match.Division.CodeAlias}
														</div>
														<div class="text-sm text-charcoal-300">
															{getOpponent(match)}
														</div>
													</div>
													<div class="flex flex-col items-center gap-1 flex-shrink-0">
														{#if teamCoverageStatus === 'covered'}
															<div class="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center" title="Covered">
																<Check size={12} class="text-white" />
															</div>
														{:else if teamCoverageStatus === 'planned'}
															<div class="w-5 h-5 rounded-full bg-gold-500/20 border border-gold-500/50 flex items-center justify-center" title="Planned">
																<ClipboardList size={12} class="text-gold-400" />
															</div>
														{:else}
															<div class="w-5 h-5 rounded-full bg-charcoal-700 border border-charcoal-600 flex items-center justify-center" title="Uncovered">
																<Circle size={12} class="text-charcoal-400" />
															</div>
														{/if}
														{#if hasConflict}
															<div class="w-5 h-5 rounded-full bg-warning-500 flex items-center justify-center" title="Conflict">
																<AlertTriangle size={12} class="text-charcoal-950" />
															</div>
														{/if}
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>

						</div>
					{/key}
				{/if}
			{:else if activeTab === 'analytics'}
					<CoverageAnalytics {matches} />
				{:else if activeTab === 'stats'}
					<CoverageStats {matches} />
				{:else if activeTab === 'coordination'}
					<TeamCoverageView {matches} />
				{/if}
		</div>
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
