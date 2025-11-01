<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { fetchCourtSchedule, fetchEventInfo, fetchDivisionPlays, fetchPoolSheet } from '$lib/services/api';
	import { filterClubMatches } from '$lib/utils/matchFilters';
	import { formatMatchDate } from '$lib/utils/dateUtils';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import { selectedCount } from '$lib/stores/coveragePlan';
	import type { FilteredMatch } from '$lib/types';
	import { createPoolsheetResultsMap, mergePoolsheetResults } from '$lib/utils/poolsheetResults';

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
	import ViewPlanButton from '$lib/components/ViewPlanButton.svelte';
	import OnboardingModal from '$lib/components/OnboardingModal.svelte';
	import MyTeamsView from '$lib/components/MyTeamsView.svelte';
	import TeamDetailView from '$lib/components/TeamDetailView.svelte';
	import { getUniqueDivisions, getUniqueTeams } from '$lib/stores/filters';
	import { followedTeams } from '$lib/stores/followedTeams';
	import { matchesStore, eventInfoStore } from '$lib/stores/matches';
	
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
	let headerCollapsed = false; // Desktop: start expanded
	let lastScrollY = 0;
	let sidebarCollapsed = false; // Desktop: start expanded
	let activeTab: 'matches' | 'plan' | 'filters' | 'more' | 'myTeams' = 'matches';
	let showFilterSheet = false;
	let showMoreMenu = false;
	let showOnboarding = false;
	let selectedTeamId: string | null = null;
	let selectedTeamName: string | null = null;
	
	// Get unique divisions and teams for filter sheet
	$: divisions = getUniqueDivisions(matches);
	$: teams = getUniqueTeams(matches);
	$: followedTeamsList = $followedTeams || [];
	$: hasFollowedTeams = followedTeamsList.length > 0;
	$: singleTeam = followedTeamsList.length === 1 ? followedTeamsList[0] : null;
	
	// Auto-navigate to team detail if only one team is favorited
	$: if (activeTab === 'myTeams' && singleTeam && !selectedTeamId && !selectedTeamName) {
		selectedTeamId = singleTeam.teamId;
		selectedTeamName = singleTeam.teamName;
	}
	
	function handleTabChange(tab: 'matches' | 'plan' | 'filters' | 'more' | 'myTeams') {
		// If clicking same tab, close it
		if (activeTab === tab) {
			if (tab === 'filters') {
				showFilterSheet = false;
			} else if (tab === 'plan') {
				showCoveragePlan = false;
			} else if (tab === 'more') {
				showMoreMenu = false;
			} else if (tab === 'myTeams') {
				selectedTeamId = null;
				selectedTeamName = null;
			}
			activeTab = 'matches';
		} else {
			activeTab = tab;
			if (tab === 'filters') {
				showFilterSheet = true;
				showCoveragePlan = false;
				showMoreMenu = false;
				selectedTeamId = null;
				selectedTeamName = null;
			} else if (tab === 'plan') {
				if ($isMedia) {
					showCoveragePlan = true;
				} else {
					showCoveragePlan = false;
					activeTab = 'matches';
				}
				showFilterSheet = false;
				showMoreMenu = false;
				selectedTeamId = null;
				selectedTeamName = null;
			} else if (tab === 'more') {
				showMoreMenu = true;
				showFilterSheet = false;
				showCoveragePlan = false;
				selectedTeamId = null;
				selectedTeamName = null;
			} else if (tab === 'myTeams') {
				showFilterSheet = false;
				showMoreMenu = false;
				showCoveragePlan = false;
				selectedTeamId = null;
				selectedTeamName = null;
			} else {
				showFilterSheet = false;
				showMoreMenu = false;
				showCoveragePlan = false;
				selectedTeamId = null;
				selectedTeamName = null;
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
	
	// Auto-close coverage plan when switching away from media role
	$: {
		if (!$isMedia && showCoveragePlan) {
			showCoveragePlan = false;
			if (activeTab === 'plan') {
				activeTab = 'matches';
			}
		}
	}
	
	function handleTeamSelect(teamId: string, teamName: string) {
		selectedTeamId = teamId;
		selectedTeamName = teamName;
	}
	
	function handleBackToMyTeams() {
		selectedTeamId = null;
		selectedTeamName = null;
	}
	
	// Auto-collapse header on scroll (desktop only)
	function handleScroll() {
		if (typeof window === 'undefined') return;
		const currentScrollY = window.scrollY;
		
		// Only auto-collapse on desktop (not mobile)
		if (window.innerWidth >= 768) {
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
	
	// Check for first-time visit and auto-load
	onMount(() => {
		// Check if user has seen onboarding
		if (typeof window !== 'undefined') {
			const hasSeenOnboarding = localStorage.getItem('courtSync_hasSeenOnboarding');
			if (!hasSeenOnboarding) {
				showOnboarding = true;
			}
		}

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
			
			// Fetch match results from poolsheets (async, non-blocking)
			// Note: BallerTV links are now fetched from the event page, not poolsheets
			enrichMatchesWithPoolsheetResults(newEventId, filteredMatches).then(enrichedMatches => {
				matches = enrichedMatches;
				matchesStore.set(enrichedMatches);
			}).catch(err => {
				// Use matches without results if enrichment fails
				matches = filteredMatches;
				matchesStore.set(filteredMatches);
			});
			
			// Set matches immediately (will be updated when BallerTV links are fetched)
			matches = filteredMatches;
			matchesStore.set(filteredMatches);
			eventInfoStore.set({ eventId: newEventId, clubId });
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
	
	// Fetch match results from poolsheets for completed matches
	// Note: BallerTV links are now fetched from the event page, not poolsheets
	async function enrichMatchesWithPoolsheetResults(
		eventId: string,
		matches: FilteredMatch[]
	): Promise<FilteredMatch[]> {
		try {
			const now = Date.now();
			const PAST_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in the past
			
			// Fetch poolsheets for match results only (not for BallerTV links - those come from event page)
			// Match results are for completed matches only
			const relevantMatches = matches.filter(match => {
				const matchEnd = match.ScheduledEndDateTime;
				// Only fetch for completed matches within last 24h (for results/scores)
				return matchEnd < now && matchEnd > now - PAST_WINDOW_MS;
			});
			
			if (relevantMatches.length === 0) {
				// No recently completed matches, skipping result fetch
				return matches;
			}
			
			// Fetching poolsheet results for completed matches (silent)
			
			// Get unique division IDs from relevant matches only
			const divisionIds = new Set(relevantMatches.map(m => m.Division.DivisionId));
			const resultsMap = new Map<number, any>(); // PoolsheetMatchResult
			
			// Fetch poolsheets for each division, but limit concurrent requests
			// NOTE: We fetch ALL plays for divisions with completed matches, which may result in many 404s
			// This is expected behavior - many plays don't have poolsheets yet
			const MAX_CONCURRENT = 3; // Process 3 divisions at a time
			const divisionArray = Array.from(divisionIds);
			
			let totalFetches = 0;
			let successfulFetches = 0;
			let failedFetches = 0;
			
			for (let i = 0; i < divisionArray.length; i += MAX_CONCURRENT) {
				const divisionBatch = divisionArray.slice(i, i + MAX_CONCURRENT);
				
				await Promise.allSettled(
					divisionBatch.map(async (divisionId) => {
						try {
							// Fetch division plays to get play IDs
							const playsData = await fetchDivisionPlays(eventId, divisionId);
							if (!playsData?.Plays || !Array.isArray(playsData.Plays)) {
								return;
							}
							
							// Fetch poolsheet for each play, but limit concurrent requests
							const MAX_PLAY_CONCURRENT = 5; // Process 5 plays at a time
							const playArray = playsData.Plays.filter((play: any) => {
								const playId = play.PlayId || play.Play?.PlayId || 0;
								return playId !== 0;
							});
							
							for (let j = 0; j < playArray.length; j += MAX_PLAY_CONCURRENT) {
								const playBatch = playArray.slice(j, j + MAX_PLAY_CONCURRENT);
								
								await Promise.allSettled(
									playBatch.map(async (play: any) => {
										try {
											const playId = play.PlayId || play.Play?.PlayId || 0;
											if (!playId) return;
											
											totalFetches++;
											const poolsheet = await fetchPoolSheet(eventId, playId);
											// Check if poolsheet is valid (not an error response)
											if (!poolsheet || poolsheet.error) {
												failedFetches++;
												// Silently skip invalid poolsheets (404s are expected)
												return;
											}
											
											successfulFetches++;
											// Extract match results (scores, win/loss) only
											const playResultsMap = createPoolsheetResultsMap(poolsheet);
											if (playResultsMap.size > 0) {
												// Found match results in play (silent)
											}
											playResultsMap.forEach((result, matchId) => {
												resultsMap.set(matchId, result);
											});
										} catch (err) {
											failedFetches++;
											// Silently skip failed poolsheets - many don't exist (404s are expected)
											// Only log if it's not a 404/not found error
											if (err instanceof Error) {
												const status = (err as any).status;
												const is404 = (err as any).is404 || status === 404 || 
												             err.message.toLowerCase().includes('not found') || 
												             err.message.toLowerCase().includes('not available');
												if (!is404) {
													// Failed to fetch poolsheet (silent)
												}
											}
										}
									})
								);
								
								// Small delay between batches to avoid overwhelming the server
								if (j + MAX_PLAY_CONCURRENT < playArray.length) {
									await new Promise(resolve => setTimeout(resolve, 100));
								}
							}
						} catch (err) {
							// Failed to fetch division plays (silent)
						}
					})
				);
				
				// Small delay between division batches
				if (i + MAX_CONCURRENT < divisionArray.length) {
					await new Promise(resolve => setTimeout(resolve, 200));
				}
			}
			
			// Poolsheet fetching completed (silent)
			
			// Merge poolsheet results into matches
			const enrichedMatches = mergePoolsheetResults(matches, resultsMap);
			
			const resultsFound = enrichedMatches.filter(m => m.PoolsheetResult).length;
			
			if (resultsFound > 0) {
				// Poolsheet results merged (silent)
			}
			return enrichedMatches;
		} catch (error) {
			console.error('Error enriching matches with poolsheet results:', error);
			return matches; // Return original matches if enrichment fails
		}
	}
</script>

<div class="min-h-screen bg-charcoal-950 pb-20">
	<!-- Mobile Header -->
		<MobileHeader
			eventName={eventInfo?.name || null}
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
			/* Desktop: Stronger glassmorphism */
			header.glassmorphism {
				backdrop-filter: blur(20px);
				background-color: rgba(37, 37, 41, 0.8);
				border-bottom-color: rgba(58, 58, 63, 0.5);
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			}
		</style>
		<div class="container mx-auto px-4 py-3">
			<!-- Desktop: Collapsible Header -->
			<div class="flex items-center justify-between gap-2 mb-2">
				<button
					onclick={() => headerCollapsed = !headerCollapsed}
					class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900 hover:bg-charcoal-800"
					aria-label={headerCollapsed ? 'Expand header' : 'Collapse header'}
				>
					{headerCollapsed ? '▼' : '▲'}
				</button>
			</div>
			
			<!-- Desktop: Expandable Content -->
			<div class="flex flex-row items-center justify-between gap-4" class:hidden={headerCollapsed}>
				<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:gap-4 min-w-0 flex-1">
					<div class="flex flex-col gap-1 min-w-0">
						<!-- Context Label -->
						<div class="text-[10px] sm:text-xs text-charcoal-400 uppercase tracking-wider">
							Event Schedule
						</div>

						<!-- Event Name as H1 (if available) or Club Name -->
						<div class="flex items-center gap-2 min-w-0">
							{#if eventInfo && eventInfo.name}
								<h1 class="text-base sm:text-lg font-semibold truncate text-charcoal-50">
									{eventInfo.name}
								</h1>
							{:else}
								<h1 class="text-base sm:text-lg font-semibold truncate text-charcoal-50">
									630 Volleyball
								</h1>
							{/if}
							{#if matches.length > 0}
								<span class="text-xs whitespace-nowrap hidden sm:inline text-charcoal-300">
									{matches.length} {matches.length === 1 ? 'match' : 'matches'}
									{#if conflictCount > 0}
										<span class="ml-2 text-warning-500">• {conflictCount} {conflictCount === 1 ? 'conflict' : 'conflicts'}</span>
									{/if}
								</span>
							{/if}
						</div>

						<!-- Date Range and Club Name (if event name is shown) -->
						{#if eventInfo && (eventInfo.startDate || eventInfo.endDate)}
							<div class="flex items-center gap-2 text-xs text-charcoal-300">
								{#if eventInfo.name}
									<span class="text-charcoal-400">630 Volleyball</span>
									<span class="text-charcoal-600">•</span>
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
									<span>
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
					</div>
				</div>
				
				<!-- Inline Utility Controls -->
				<div class="flex items-center gap-2 flex-wrap">
					<!-- User Role Selector -->
					<div class="flex items-center gap-1">
						<label for="role-selector-header" class="text-xs text-charcoal-300">I am a:</label>
						<select
							id="role-selector-header"
							value={userRoleValue}
							onchange={(e) => userRole.setRole(e.target.value as 'media' | 'spectator' | 'coach')}
							class="px-2 py-1.5 text-xs rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 border border-charcoal-600"
							title="Select your role to customize the app features for your needs"
							aria-describedby="role-help"
						>
							<option value="media">📸 Photographer</option>
							<option value="spectator">📊 Scorekeeper</option>
							<option value="coach">📋 Coach</option>
						</select>
						<span id="role-help" class="sr-only">
							Select your role to customize the app features for your needs
						</span>
					</div>
					
						{#if matches.length > 0}
						<!-- View Mode Toggle - Hide for Coach role -->
						{#if !isCoachValue}
							<div class="flex items-center gap-1 rounded-lg p-1 bg-charcoal-700">
								<button
									onclick={() => viewMode = 'list'}
									class="px-3 py-1.5 text-xs font-medium rounded transition-colors"
									class:bg-gold-500={viewMode === 'list'}
									class:text-charcoal-950={viewMode === 'list'}
									class:text-charcoal-300={viewMode !== 'list'}
									class:hover:text-charcoal-50={viewMode !== 'list'}
								>
									List
								</button>
								<button
									onclick={() => viewMode = 'timeline'}
									class="px-3 py-1.5 text-xs font-medium rounded transition-colors"
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
								class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border"
								class:bg-gold-500={showCoveragePlan}
								class:text-charcoal-950={showCoveragePlan}
								class:text-gold-500={!showCoveragePlan}
								style={showCoveragePlan ? '' : 'background-color: rgba(234, 179, 8, 0.1); border-color: rgba(234, 179, 8, 0.2);'}
								title="View and manage your photography coverage schedule"
								aria-label={`My schedule with ${selectedCountValue} ${selectedCountValue === 1 ? 'match' : 'matches'}`}
							>
								<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
								My Schedule ({selectedCountValue})
							</button>
						{/if}

						<!-- Export Buttons -->
						<button
							onclick={handleExportJSON}
							class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50"
							title="Export match data as JSON"
							aria-label="Export data as JSON"
						>
							<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
							</svg>
							JSON
						</button>
						<button
							onclick={handleExportCSV}
							class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50"
							title="Export to Excel (CSV format)"
							aria-label="Export to Excel"
						>
							<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
							</svg>
							CSV
						</button>
					{/if}

					<!-- Event Settings Toggle -->
					<button
						onclick={() => showConfig = !showConfig}
						class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
						class:bg-gold-500={showConfig}
						class:text-charcoal-950={showConfig}
						class:bg-charcoal-700={!showConfig}
						class:text-charcoal-200={!showConfig}
						title="Change event parameters and tournament settings"
						aria-label={showConfig ? 'Hide event settings' : 'Show event settings'}
					>
						<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
						</svg>
						{showConfig ? 'Hide Settings' : 'Event Settings'}
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
					onClose={() => showConfig = false}
				/>
			</div>
		</div>
	{/if}
	
	<style>
		/* Desktop header collapse styles */
		header.collapsed {
			max-height: 48px;
			overflow: hidden;
		}
		
		header:not(.collapsed) {
			max-height: 300px; /* Allow expansion */
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
		<!-- Mobile Filter Bar - Always visible on mobile (hide for My Teams view) -->
		{#if activeTab !== 'myTeams'}
			<div class="lg:hidden">
				<MobileFilterBar 
					onOpenFullFilters={() => { showFilterSheet = true; activeTab = 'filters'; }} 
				/>
			</div>
		{/if}
		
		<!-- My Teams View -->
		{#if activeTab === 'myTeams'}
			{#if selectedTeamId && selectedTeamName}
				<TeamDetailView
					teamId={selectedTeamId}
					teamName={selectedTeamName}
					{matches}
					{eventId}
					{clubId}
					onBack={handleBackToMyTeams}
				/>
			{:else}
				<MyTeamsView
					{matches}
					onTeamSelect={handleTeamSelect}
				/>
			{/if}
		{:else}
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
			<div class="text-center py-12 px-4 max-w-md mx-auto">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-charcoal-800 flex items-center justify-center">
					<svg class="w-8 h-8 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
					</svg>
				</div>
				<h2 class="text-lg font-semibold text-charcoal-50 mb-2">
					Ready to Load Your Tournament
				</h2>
				<p class="text-sm text-charcoal-300 mb-4">
					Enter your event details to see the 630 Volleyball match schedule and plan your coverage
				</p>
				<button
					onclick={() => showConfig = true}
					class="px-6 py-3 bg-gold-500 text-charcoal-950 rounded-lg font-medium hover:bg-gold-400 transition-colors min-h-[44px]"
					aria-label="Open event settings to get started"
				>
					Get Started
				</button>
			</div>
		{/if}

		{#if matches.length > 0}
			{#if isCoachValue}
				<CoachView {matches} {eventId} {clubId} />
			{:else if viewMode === 'list'}
				<MatchList {matches} {eventId} {clubId} eventName={eventInfo?.name || null} />
			{:else}
				<TimelineView {matches} {eventId} />
			{/if}
		{/if}

		{#if showCoveragePlan && $isMedia}
			<CoveragePlanPanel {matches} onClose={closeCoveragePlan} />
		{/if}
		</div>
		{/if}
		</main>
	</div>
	
	<!-- View Plan Button (Mobile) - Media Role Only -->
	{#if $isMedia}
		<div class="lg:hidden">
			<ViewPlanButton
				selectedCount={selectedCountValue}
				onClick={() => {
					showCoveragePlan = true;
					activeTab = 'plan';
				}}
			/>
		</div>
	{/if}
	
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
						onclick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							closeMoreMenu();
						}}
						onmousedown={(e) => e.stopPropagation()}
						ontouchstart={(e) => e.stopPropagation()}
						class="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-900 transition-colors min-h-[44px] relative z-20"
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
						aria-label="Open event settings"
					>
						<div class="font-medium">Event Settings</div>
						<div class="text-xs text-charcoal-400 mt-0.5">Change tournament parameters and load schedule</div>
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
						<label for="role-selector-menu" class="block text-sm font-medium text-charcoal-300 mb-2">
							I am a:
						</label>
						<select
							id="role-selector-menu"
							value={userRoleValue}
							onchange={(e) => { userRole.setRole(e.target.value as 'media' | 'spectator' | 'coach'); }}
							class="w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-gold-500 focus:outline-none bg-charcoal-700 text-charcoal-200 border border-charcoal-600"
							aria-label="Select your role to customize features"
						>
							<option value="media">📸 Photographer</option>
							<option value="spectator">📊 Scorekeeper</option>
							<option value="coach">📋 Coach</option>
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

	<!-- Onboarding Modal - First Time Visit -->
	{#if showOnboarding}
		<OnboardingModal onComplete={() => showOnboarding = false} />
	{/if}
</div>
