<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { detectConflicts } from '$lib/utils/matchFilters';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { generateCoverageSuggestions } from '$lib/utils/coverageSuggestions';
	import { exportCoveragePlanToICS } from '$lib/utils/icsExport';
	import CoverageStatusSelector from '$lib/components/CoverageStatusSelector.svelte';
	import CoverageAnalytics from '$lib/components/CoverageAnalytics.svelte';
	import CoverageStats from '$lib/components/CoverageStats.svelte';
	
	// TODO: Import other components as they're migrated
	// import TeamMemberSelector from '$lib/components/TeamMemberSelector.svelte';
	// import TeamCoverageView from '$lib/components/TeamCoverageView.svelte';
	
	export let matches: FilteredMatch[];
	export let onClose: () => void;
	
	interface ConflictGroup {
		matches: FilteredMatch[];
		conflictCount: number;
	}
	
	let activeTab: 'plan' | 'analytics' | 'stats' | 'coordination' = 'plan';
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
	
	// Get selected matches with full details, filtered by coverage status if needed
	$: selectedMatchesList = (() => {
		const currentPlan = get(coveragePlan);
		let filtered = matches
			.filter(m => currentPlan.has(m.MatchId))
			.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
		
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
	
	// Group by date
	$: matchesByDate = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		selectedMatchesList.forEach(match => {
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

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
	<div class="relative w-full max-w-3xl max-h-[90vh] border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-[#454654] bg-[#454654]/50">
			<div class="flex-1">
				<h3 class="text-base sm:text-lg font-semibold text-[#f8f8f9]">
					My Coverage Plan
				</h3>
				<div class="flex items-center gap-3 mt-1 flex-wrap">
					<p class="text-xs text-[#9fa2ab]">
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
						value={coverageStatusFilter}
						onchange={(e) => coverageStatusFilter = e.target.value as any}
						class="px-2 py-1 text-xs rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
					>
						<option value="all">All Status</option>
						<option value="not-covered">Uncovered</option>
						<option value="planned">Planned</option>
						<option value="covered">Covered</option>
					</select>
				</div>
			</div>
			
			<!-- Tabs -->
			{#if selectedMatchesList.length > 0}
				<div class="flex items-center gap-1 bg-[#3b3c48] rounded-lg p-1 border border-[#454654] mx-4">
					<button
						onclick={() => activeTab = 'plan'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors {activeTab === 'plan' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Plan
					</button>
					<button
						onclick={() => activeTab = 'analytics'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors {activeTab === 'analytics' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Analytics
					</button>
					<button
						onclick={() => activeTab = 'stats'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors {activeTab === 'stats' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Stats
					</button>
					<button
						onclick={() => activeTab = 'coordination'}
						class="px-3 py-1.5 text-xs font-medium rounded transition-colors {activeTab === 'coordination' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Team
					</button>
				</div>
			{/if}
			
			<button
				onclick={onClose}
				class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
				aria-label="Close panel"
			>
				<svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if activeTab === 'plan'}
				{#if selectedMatchesList.length === 0}
					<div class="text-center py-12 text-[#9fa2ab] text-sm">
						<p>No matches selected yet</p>
						<p class="text-xs text-[#808593] mt-2">
							Click matches in the timeline or list to add them to your coverage plan
						</p>
					</div>
				{:else}
					<div class="space-y-4">
						<!-- Conflict Resolution Section -->
						{#if conflictGroups.length > 0}
							<div class="border border-red-800/50 rounded-lg bg-red-950/10 p-4">
								<div class="flex items-center justify-between mb-3">
									<div>
										<h4 class="text-sm font-semibold text-red-400">
											⚠️ Conflicts Detected
										</h4>
										<p class="text-xs text-[#9fa2ab] mt-0.5">
											{conflictGroups.length} conflict group{conflictGroups.length !== 1 ? 's' : ''} in your plan
											{#if conflictGroups.length > 0}
												<span class="ml-2 text-[#eab308]">
													• Conflict {currentConflictIndex + 1} of {conflictGroups.length}
												</span>
											{/if}
										</p>
									</div>
									<div class="flex items-center gap-2">
										{#if conflictGroups.length > 1}
											<button
												onclick={handlePreviousConflict}
												class="px-2 py-1 text-xs font-medium rounded-lg bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]"
												title="Previous conflict"
											>
												← Prev
											</button>
											<button
												onclick={handleNextConflict}
												class="px-2 py-1 text-xs font-medium rounded-lg bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]"
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
											class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
										>
											Auto-Resolve
										</button>
									</div>
								</div>
								
								<div class="space-y-3">
									{#each conflictGroups as group, groupIndex}
										<div
											bind:this={conflictRefs[groupIndex]}
											class="border rounded p-3 transition-all {groupIndex === currentConflictIndex ? 'border-[#eab308] bg-[#eab308]/5' : 'border-red-800/30 bg-[#3b3c48]/50'}"
										>
											<div class="flex items-center gap-2 mb-2">
												<div class="text-xs font-medium text-red-400">
													Conflict Group {groupIndex + 1}: {group.conflictCount} overlapping match{group.conflictCount !== 1 ? 'es' : ''}
												</div>
												{#if groupIndex === currentConflictIndex}
													<div class="text-[10px] font-semibold text-[#eab308] px-1.5 py-0.5 rounded bg-[#eab308]/20">
														ACTIVE
													</div>
												{/if}
											</div>
											<div class="space-y-2">
												{#each group.matches as match, matchIndex}
													{@const teamId = getTeamIdentifier(match)}
													{@const conflictMatches = getMatchConflicts(match.MatchId)}
													{@const isFirstMatch = matchIndex === 0}
													
													<div class="flex items-center gap-2 px-2 py-1.5 rounded {isFirstMatch ? 'bg-[#eab308]/10 border border-[#eab308]/30' : 'bg-[#454654]/50'}">
														{#if isFirstMatch}
															<div class="flex-shrink-0 text-[10px] font-semibold text-[#eab308] px-1.5 py-0.5 rounded bg-[#eab308]/20">
																KEEP
															</div>
														{/if}
														
														<div class="flex-1 min-w-0">
															<div class="flex items-center gap-2">
																<span class="text-xs font-semibold text-[#f8f8f9]">
																	{formatMatchTime(match.ScheduledStartDateTime)}
																</span>
																<span class="text-xs text-[#facc15] font-medium">
																	{match.CourtName}
																</span>
																<span class="text-xs text-[#c0c2c8]">
																	{teamId || match.Division.CodeAlias}
																</span>
															</div>
															{#if conflictMatches.length > 0}
																<div class="text-[10px] text-[#808593] mt-0.5">
																	Conflicts with {conflictMatches.length} other match{conflictMatches.length !== 1 ? 'es' : ''}
																</div>
															{/if}
														</div>
														
														{#if !isFirstMatch}
															<button
																onclick={() => coveragePlan.deselectMatch(match.MatchId)}
																class="px-2 py-1 text-[10px] font-medium rounded bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
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
										<p class="text-xs text-[#9fa2ab] mt-0.5">
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
													<span class="text-xs font-semibold text-[#f8f8f9]">
														{formatMatchTime(match.ScheduledStartDateTime)}
													</span>
													<span class="text-xs text-green-400 font-medium">
														{match.CourtName}
													</span>
													<span class="text-xs text-[#c0c2c8]">
														{teamId || match.Division.CodeAlias}
													</span>
													{#if teamStatus === 'not-covered'}
														<span class="text-[10px] px-1.5 py-0.5 rounded bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/50">
															Uncovered
														</span>
													{/if}
												</div>
												<div class="text-[10px] text-[#808593] mt-0.5">
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
						
						<!-- Matches List -->
						<div class="space-y-4">
							{#each sortedDates as dateKey}
								{@const dateMatches = matchesByDate[dateKey]}
								<div class="space-y-2">
									<div class="flex items-center gap-2 pb-2 border-b border-[#454654]">
										<h4 class="text-sm font-semibold text-[#f8f8f9]">{dateKey}</h4>
										<span class="text-xs text-[#808593]">
											({dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''})
										</span>
									</div>
									
									{#each dateMatches as match}
										{@const teamId = getTeamIdentifier(match)}
										{@const opponent = getOpponent(match)}
										{@const hasConflict = planConflicts.has(match.MatchId)}
										
										<div class="flex items-center gap-3 px-3 py-2.5 rounded border {hasConflict ? 'border-red-800/50 bg-red-950/10' : 'border-[#eab308]/50 bg-[#eab308]/5'}">
											<button
												onclick={() => coveragePlan.toggleMatch(match.MatchId)}
												class="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center hover:opacity-80 transition-colors {hasConflict ? 'border-red-800/50 bg-red-950/20' : 'border-[#eab308] bg-[#eab308]/20'}"
												aria-label="Remove from plan"
											>
												<svg class="w-3 h-3 {hasConflict ? 'text-red-400' : 'text-[#facc15]'}" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
												</svg>
											</button>
											
											{#if hasConflict}
												<div class="flex-shrink-0 text-[10px] font-semibold text-red-400 px-1.5 py-0.5 rounded bg-red-950/50">
													CONFLICT
												</div>
											{/if}
											
											<div class="flex-shrink-0 w-20 text-sm font-semibold text-[#f8f8f9]">
												{formatMatchTime(match.ScheduledStartDateTime)}
											</div>
											
											<div class="flex-shrink-0 w-24 text-sm font-bold text-[#facc15]">
												{match.CourtName}
											</div>
											
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-2">
													<div class="text-sm font-bold text-[#f8f8f9]">
														{teamId || match.Division.CodeAlias}
													</div>
													{#if teamId}
														{@const teamStatus = coverageStatus.getTeamStatus(teamId)}
														<div class="w-2 h-2 rounded {teamStatus === 'covered' ? 'bg-green-500' : teamStatus === 'partially-covered' ? 'bg-[#f59e0b]' : teamStatus === 'planned' ? 'bg-[#eab308]' : 'bg-[#808593]'}" title="Status: {teamStatus}" />
													{/if}
												</div>
												<div class="text-xs text-[#c0c2c8] truncate">
													vs {opponent}
												</div>
											</div>
											
											{#if teamId}
												<div class="relative flex-shrink-0">
													<button
														onclick={(e) => {
															e.stopPropagation();
															coverageStatusMenuOpen = coverageStatusMenuOpen === teamId ? null : teamId;
														}}
														class="px-2 py-1 text-xs rounded transition-colors {coverageStatusMenuOpen === teamId ? 'bg-[#eab308] text-[#18181b]' : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]'}"
														title="Set coverage status"
													>
														{(() => {
															const status = coverageStatus.getTeamStatus(teamId);
															if (status === 'covered') return '✓';
															if (status === 'partially-covered') return '◐';
															if (status === 'planned') return '📋';
															return '○';
														})()}
													</button>
													{#if coverageStatusMenuOpen === teamId}
														<div
															class="fixed inset-0 z-40"
															onclick={() => coverageStatusMenuOpen = null}
														/>
														<div class="absolute right-0 top-full mt-1 z-50">
															<CoverageStatusSelector
																{teamId}
																currentStatus={coverageStatus.getTeamStatus(teamId)}
																onStatusChange={(status) => {
																	coverageStatus.setTeamStatus(teamId, status as any);
																	coverageStatusMenuOpen = null;
																}}
																onClose={() => coverageStatusMenuOpen = null}
															/>
														</div>
													{/if}
												</div>
											{/if}
											
											<div class="flex-shrink-0">
												<span
													class="px-2 py-0.5 text-[10px] font-semibold rounded"
													style="background-color: {match.Division.ColorHex}20; color: {match.Division.ColorHex}; border: 1px solid {match.Division.ColorHex}40;"
												>
													{match.Division.CodeAlias}
												</span>
											</div>
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{:else if activeTab === 'analytics'}
				<CoverageAnalytics {matches} />
			{:else if activeTab === 'stats'}
				<CoverageStats {matches} />
			{:else}
				<!-- TODO: TeamMemberSelector and TeamCoverageView components -->
				<div class="text-center py-12 text-[#9fa2ab] text-sm">
					TeamMemberSelector and TeamCoverageView - To be migrated
				</div>
			{/if}
		</div>

		<!-- Footer Actions -->
		{#if selectedMatchesList.length > 0 && activeTab === 'plan'}
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-[#454654] bg-[#454654]/50">
				<div class="flex items-center gap-2 flex-wrap">
					<button
						onclick={() => {
							selectedMatchesList.forEach(match => {
								const teamId = getTeamIdentifier(match);
								if (teamId) {
									coverageStatus.setTeamStatus(teamId, 'planned');
								}
							});
							alert('All matches marked as Planned');
						}}
						class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]"
					>
						Mark All as Planned
					</button>
					<button
						onclick={() => {
							selectedMatchesList.forEach(match => {
								const teamId = getTeamIdentifier(match);
								if (teamId) {
									coverageStatus.setTeamStatus(teamId, 'covered');
								}
							});
							alert('All matches marked as Covered');
						}}
						class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]"
					>
						Mark All as Covered
					</button>
					<button
						onclick={() => coveragePlan.clearPlan()}
						class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-[#9fa2ab] hover:text-[#f8f8f9] hover:bg-[#454654]"
					>
						Clear Plan
					</button>
				</div>
				
				<div class="flex items-center gap-2 flex-wrap">
					<button
						onclick={handleCopyToClipboard}
						class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463]"
						title="Copy plan to clipboard"
					>
						Copy
					</button>
					
					<div class="flex items-center gap-1 bg-[#3b3c48] rounded-lg p-1 border border-[#454654]">
						<button
							onclick={handleExportJSON}
							class="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
							title="Export as JSON"
						>
							JSON
						</button>
						<button
							onclick={handleExportCSV}
							class="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
							title="Export as CSV"
						>
							CSV
						</button>
						<button
							onclick={handleExportText}
							class="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
							title="Export as Text"
						>
							TXT
						</button>
						<button
							onclick={handleExportICS}
							class="px-2 py-1 text-xs font-medium rounded transition-colors text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654]"
							title="Export as Calendar (ICS)"
						>
							📅 ICS
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

