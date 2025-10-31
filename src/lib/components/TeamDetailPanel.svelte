<script lang="ts">
	import { onMount } from 'svelte';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import {
		fetchTeamAssignments,
		fetchTeamSchedule,
		fetchDivisionPlays,
		fetchPoolSheet,
	} from '$lib/services/api';
	import { getTeamIdentifier } from '$lib/stores/filters';
	
	// TODO: Import TeamStatsView when migrated
	// import TeamStatsView from '$lib/components/TeamStatsView.svelte';
	
	export let match: FilteredMatch;
	export let eventId: string;
	export let clubId: number;
	export let onClose: () => void;
	export let matches: FilteredMatch[] = [];
	
	interface TeamInfo {
		TeamId: number;
		DivisionId: number;
		TeamName: string;
		TeamText: string;
	}
	
	interface ScheduleMatch {
		MatchId: number;
		ScheduledStartDateTime: string | number;
		ScheduledEndDateTime: string | number;
		FirstTeamText: string;
		SecondTeamText?: string;
		WorkTeamText?: string;
		Court?: {
			Name: string;
			CourtId: number;
		} | null;
		Division?: {
			CodeAlias: string;
			ColorHex: string;
			CompleteShortName?: string;
			FullName?: string;
			PlayId?: number;
		} | null;
		type?: 'current' | 'work' | 'future';
	}
	
	let teamInfo: TeamInfo | null = null;
	let currentSchedule: ScheduleMatch[] = [];
	let workSchedule: ScheduleMatch[] = [];
	let futureSchedule: ScheduleMatch[] = [];
	let divisionPlays: any[] = [];
	let selectedPlayId: number | null = null;
	let poolSheet: any | null = null;
	let viewMode: 'schedule' | 'poolsheet' | 'stats' = 'schedule';
	let loading = true;
	let error: string | null = null;
	
	// Extract team name from match
	function getTeamName(): string {
		if (match.InvolvedTeam === 'first') {
			return match.FirstTeamText;
		} else if (match.InvolvedTeam === 'second') {
			return match.SecondTeamText;
		}
		return '';
	}
	
	const teamId = getTeamIdentifier(match);
	const teamName = getTeamName();
	
	// Reset poolSheet when view mode changes
	$: if (viewMode === 'poolsheet') {
		poolSheet = null;
	}
	
	// Load team data
	onMount(async () => {
		loading = true;
		error = null;

		try {
			// First, fetch team assignments to get TeamId and DivisionId
			const assignmentsResponse = await fetchTeamAssignments(eventId, clubId);
			const assignments = assignmentsResponse.value || [];

			// Find matching team by name
			const teamName = getTeamName();
			if (!teamName) {
				error = 'Could not extract team name from match';
				loading = false;
				return;
			}

			// Try multiple matching strategies
			const team = assignments.find((t: any) => {
				// Exact match on TeamText
				if (t.TeamText === teamName) return true;
				// Match on TeamName
				if (t.TeamName === teamName) return true;
				// Partial match - extract team number (e.g., "16-1" from "630 Volleyball 16-1 (GL)")
				const teamNumberMatch = teamName.match(/(\d+-\d+)/);
				if (teamNumberMatch) {
					const teamNumber = teamNumberMatch[1];
					return t.TeamName.includes(teamNumber) || t.TeamText.includes(teamNumber);
				}
				return false;
			});

			if (!team) {
				error = `Team not found: ${teamName}`;
				loading = false;
				return;
			}

			const teamId = team.TeamId;
			const divisionId = team.TeamDivision.DivisionId;

			teamInfo = {
				TeamId: teamId,
				DivisionId: divisionId,
				TeamName: team.TeamName,
				TeamText: team.TeamText,
			};

			// Fetch all team schedules
			const [current, work, future] = await Promise.all([
				fetchTeamSchedule(eventId, divisionId, teamId, 'current').catch(() => []),
				fetchTeamSchedule(eventId, divisionId, teamId, 'work').catch(() => []),
				fetchTeamSchedule(eventId, divisionId, teamId, 'future').catch(() => []),
			]);

			// Flatten the response
			const flattenMatches = (response: any[], isWorkSchedule: boolean = false): ScheduleMatch[] => {
				if (!Array.isArray(response)) return [];
				return response.flatMap((play: any) => {
					if (isWorkSchedule) {
						if (!play.Match) return [];
						return [{
							...play.Match,
							Court: play.Match.Court || null,
							Division: {
								...play.Play,
								PlayId: play.Play?.PlayId,
							} as any,
							FirstTeamText: play.Play?.CompleteShortName || 'Work Assignment',
							SecondTeamText: undefined,
						}];
					} else {
						if (!play.Matches || !Array.isArray(play.Matches)) return [];
						return play.Matches.map((match: any) => ({
							...match,
							Court: match.Court || null,
							Division: {
								...play.Play,
								PlayId: play.Play?.PlayId,
							} as any,
						}));
					}
				});
			};

			currentSchedule = flattenMatches(current, false);
			workSchedule = flattenMatches(work, true);
			futureSchedule = flattenMatches(future, false);

			// Fetch division plays to get pool information
			const playsData = await fetchDivisionPlays(eventId, divisionId).catch(() => null);
			if (playsData?.Plays) {
				divisionPlays = playsData.Plays;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load team data';
		} finally {
			loading = false;
		}
	});
	
	// Fetch pool sheet when play is selected
	$: if (selectedPlayId && viewMode === 'poolsheet') {
		fetchPoolSheet(eventId, selectedPlayId)
			.then((data) => {
				poolSheet = data;
			})
			.catch((err) => {
				console.error('Failed to fetch pool sheet:', err);
				poolSheet = null;
			});
	}
	
	function renderMatch(scheduleMatch: ScheduleMatch, isWork: boolean = false) {
		const startTime = typeof scheduleMatch.ScheduledStartDateTime === 'string'
			? new Date(scheduleMatch.ScheduledStartDateTime).getTime()
			: scheduleMatch.ScheduledStartDateTime;
		
		const isPlaying = scheduleMatch.FirstTeamText?.includes('630') || scheduleMatch.SecondTeamText?.includes('630');
		const matchDate = formatMatchDate(startTime);
		const startTimeDisplay = formatMatchTime(startTime);
		
		return {
			matchDate,
			startTimeDisplay,
			isPlaying,
			isWork,
			scheduleMatch
		};
	}
	
	// Combine all matches
	$: allMatches = (() => {
		const matches = [
			...currentSchedule.map(m => ({ ...m, type: 'current' as const })),
			...workSchedule.map(m => ({ ...m, type: 'work' as const })),
			...futureSchedule.map(m => ({ ...m, type: 'future' as const })),
		].filter((match, index, array) => {
			return array.findIndex(m => m.MatchId === match.MatchId) === index;
		}).sort((a, b) => {
			const timeA = typeof a.ScheduledStartDateTime === 'string'
				? new Date(a.ScheduledStartDateTime).getTime()
				: a.ScheduledStartDateTime || 0;
			const timeB = typeof b.ScheduledStartDateTime === 'string'
				? new Date(b.ScheduledStartDateTime).getTime()
				: b.ScheduledStartDateTime || 0;
			return timeA - timeB;
		});
		return matches;
	})();
	
	// Extract pools that this team is actually in
	$: teamPools = (() => {
		const poolSet = new Set<number>();
		allMatches.forEach(match => {
			if (match.Division && match.Division.PlayId) {
				const playId = Math.abs(match.Division.PlayId);
				poolSet.add(playId);
			}
		});
		return Array.from(poolSet);
	})();
	
	// Filter division plays to only show pools this team is in
	$: relevantPools = (() => {
		return divisionPlays.filter((play: any) => {
			const normalizedPlayId = Math.abs(play.PlayId);
			return teamPools.includes(normalizedPlayId);
		});
	})();
	
	// Auto-select the team's pool
	$: if (relevantPools.length > 0 && !selectedPlayId) {
		selectedPlayId = relevantPools[0].PlayId;
	}
	
	// Group matches by date
	$: matchesByDate = (() => {
		const grouped: Record<string, typeof allMatches> = {};
		allMatches.forEach(match => {
			const startTime = typeof match.ScheduledStartDateTime === 'string'
				? new Date(match.ScheduledStartDateTime).getTime()
				: match.ScheduledStartDateTime || 0;
			const dateKey = formatMatchDate(startTime);
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(match);
		});
		return grouped;
	})();
	
	// Sort dates chronologically
	$: sortedDates = (() => {
		return Object.keys(matchesByDate).sort((a, b) => {
			const dateA = new Date(a).getTime();
			const dateB = new Date(b).getTime();
			return dateA - dateB;
		});
	})();
</script>

<div class="mt-2 border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
	<div class="p-3 sm:p-4">
		<div class="flex items-center justify-between mb-3 sm:mb-4">
			<h4 class="text-xs sm:text-sm font-semibold text-[#f8f8f9] truncate pr-2">
				{teamInfo?.TeamText || teamName} - Full Schedule
			</h4>
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

		{#if loading}
			<div class="text-center py-8 text-[#9fa2ab] text-sm">
				Loading schedule...
			</div>
		{/if}

		{#if error}
			<div class="text-center py-4 text-red-400 text-sm">
				{error}
			</div>
		{/if}

		{#if !loading && teamInfo}
			<div class="space-y-4">
				<!-- View Mode Toggle -->
				<div class="flex items-center gap-2 border-b border-[#454654] pb-2">
					<button
						onclick={() => viewMode = 'schedule'}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {viewMode === 'schedule' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Schedule
					</button>
					<button
						onclick={() => viewMode = 'poolsheet'}
						class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {viewMode === 'poolsheet' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
					>
						Pool Sheet
					</button>
					{#if matches.length > 0 && teamId}
						<button
							onclick={() => viewMode = 'stats'}
							class="px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {viewMode === 'stats' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
						>
							Statistics
						</button>
					{/if}
				</div>

				{#if viewMode === 'stats' && teamId}
					<!-- TODO: TeamStatsView component -->
					<div class="text-[#9fa2ab]">TeamStatsView - To be migrated</div>
				{:else if viewMode === 'schedule'}
					<!-- Full Schedule Timeline -->
					<div>
						<h5 class="text-xs font-semibold text-[#9fa2ab] uppercase tracking-wider mb-2">
							Complete Schedule
						</h5>
						<div class="space-y-4">
							{#if sortedDates.length === 0}
								<div class="text-xs text-[#808593] py-4 text-center">
									No schedule data available
								</div>
							{:else}
								{#each sortedDates as dateKey}
									{@const dateMatches = matchesByDate[dateKey]}
									<div class="space-y-1">
										<!-- Date Header -->
										<div class="flex items-center gap-2 mb-2 pb-1 border-b border-[#454654]">
											<h6 class="text-xs font-semibold text-[#f8f8f9]">{dateKey}</h6>
											<span class="text-[10px] text-[#808593]">
												({dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''})
											</span>
										</div>
										<!-- Matches for this date -->
										{#each dateMatches as scheduleMatch}
											{@const matchData = renderMatch(scheduleMatch, scheduleMatch.type === 'work')}
											<div
												class="flex items-center gap-3 px-3 py-2 rounded border {matchData.isWork ? 'border-[#525463] bg-[#454654]/30' : matchData.isPlaying ? 'border-[#eab308]/50 bg-[#eab308]/5' : 'border-[#454654] bg-[#3b3c48]/30'}"
											>
												<!-- Status Indicator -->
												<div class="flex-shrink-0 w-1 h-full rounded-full {matchData.isWork ? 'bg-[#808593]' : matchData.isPlaying ? 'bg-[#eab308]' : 'bg-[#525463]'}" />
												
												<!-- Date -->
												<div class="flex-shrink-0 w-16 text-xs font-medium text-[#9fa2ab]">
													{matchData.matchDate}
												</div>
												
												<!-- Scheduled Start Time -->
												<div class="flex-shrink-0 w-20 text-sm font-semibold text-[#f8f8f9]">
													{matchData.startTimeDisplay}
												</div>
												
												<!-- Court -->
												{#if matchData.scheduleMatch.Court}
													<div class="flex-shrink-0 w-20 text-xs text-[#facc15] font-medium">
														{matchData.scheduleMatch.Court.Name}
													</div>
												{/if}
												
												<!-- Match Info -->
												<div class="flex-1 min-w-0">
													<div class="text-xs">
														{#if matchData.isWork}
															<span class="text-[#808593] font-medium">WORK</span>
															<span class="text-[#808593] ml-2">
																{matchData.scheduleMatch.Division?.CompleteShortName || matchData.scheduleMatch.Division?.FullName || matchData.scheduleMatch.FirstTeamText}
															</span>
														{:else if matchData.isPlaying}
															<span class="text-[#eab308] font-semibold">PLAY</span>
															<span class="text-[#c0c2c8] ml-2">
																{matchData.scheduleMatch.FirstTeamText}
																{#if matchData.scheduleMatch.SecondTeamText}
																	<span class="text-[#808593] mx-1">vs</span>
																	{matchData.scheduleMatch.SecondTeamText}
																{/if}
															</span>
														{:else}
															<span class="text-[#808593] font-medium">WATCH</span>
															<span class="text-[#808593] ml-2">
																{matchData.scheduleMatch.FirstTeamText}
																{#if matchData.scheduleMatch.SecondTeamText}
																	<span class="mx-1">vs</span>
																	{matchData.scheduleMatch.SecondTeamText}
																{/if}
															</span>
														{/if}
													</div>
												</div>
												
												<!-- Division Badge -->
												{#if matchData.scheduleMatch.Division}
													<div class="flex-shrink-0">
														<span
															class="px-2 py-0.5 text-[10px] font-semibold rounded"
															style="background-color: {matchData.scheduleMatch.Division.ColorHex}20; color: {matchData.scheduleMatch.Division.ColorHex}; border: 1px solid {matchData.scheduleMatch.Division.ColorHex}40;"
														>
															{matchData.scheduleMatch.Division.CodeAlias}
														</span>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{:else}
					<!-- Pool Sheet View -->
					<div>
						<h5 class="text-xs font-semibold text-[#9fa2ab] uppercase tracking-wider mb-2">
							Pool Standings
						</h5>
						
						{#if relevantPools.length === 0}
							<div class="text-xs text-[#808593] py-4 text-center">
								No pool data available for this team
							</div>
						{:else}
							<!-- Pool Selector -->
							{#if relevantPools.length > 1}
								<div class="mb-4">
									<label class="text-xs text-[#9fa2ab] mb-1 block">Pool:</label>
									<select
										value={selectedPlayId || ''}
										onchange={(e) => selectedPlayId = Number(e.target.value)}
										class="w-full px-3 py-2.5 sm:py-2 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none min-h-[44px] sm:min-h-0"
									>
										{#each relevantPools as play}
											<option value={play.PlayId}>
												{play.CompleteFullName || play.FullName || `Pool ${play.PlayId}`}
											</option>
										{/each}
									</select>
								</div>
							{/if}
							
							{#if selectedPlayId && poolSheet}
								<div class="space-y-4">
									<!-- Pool Standings -->
									{#if poolSheet.Pool && poolSheet.Pool.Teams && poolSheet.Pool.Teams.length > 0}
										<div class="border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
											<div class="px-3 sm:px-4 py-2 bg-[#454654] border-b border-[#525463]">
												<h6 class="text-xs sm:text-sm font-semibold text-[#f8f8f9]">
													{poolSheet.Pool.CompleteFullName || poolSheet.Pool.FullName} - Standings
												</h6>
											</div>
											
											<!-- Standings Table -->
											<div class="overflow-x-auto">
												<table class="w-full text-xs min-w-[500px]">
													<thead>
														<tr class="border-b border-[#454654] bg-[#454654]/50">
															<th class="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Rank</th>
															<th class="px-2 sm:px-3 py-2 text-left text-[#9fa2ab] font-semibold">Team</th>
															<th class="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">W</th>
															<th class="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">L</th>
															<th class="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">Sets</th>
															<th class="px-2 sm:px-3 py-2 text-center text-[#9fa2ab] font-semibold">Points</th>
														</tr>
													</thead>
													<tbody>
														{#each poolSheet.Pool.Teams as team}
															{@const isOurTeam = team.TeamText?.includes('630')}
															<tr class="border-b border-[#454654] {isOurTeam ? 'bg-[#eab308]/10' : ''}">
																<td class="px-2 sm:px-3 py-2 text-[#f8f8f9] font-medium">
																	{team.FinishRank || team.OverallRank || '-'}
																</td>
																<td class="px-2 sm:px-3 py-2">
																	<div class="{isOurTeam ? 'text-[#facc15] font-semibold' : 'text-[#c0c2c8]'}">
																		{team.TeamText}
																	</div>
																</td>
																<td class="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
																	{team.MatchesWon ?? '-'}
																</td>
																<td class="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
																	{team.MatchesLost ?? '-'}
																</td>
																<td class="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
																	{team.SetsWon ?? '-'}-{team.SetsLost ?? '-'}
																</td>
																<td class="px-2 sm:px-3 py-2 text-center text-[#c0c2c8]">
																	{team.PointRatio && team.PointRatio !== 'NaN' ? team.PointRatio : '-'}
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										</div>
									{/if}
									
									<!-- Pool Schedule -->
									{#if poolSheet.Pool && poolSheet.Pool.Matches && poolSheet.Pool.Matches.length > 0}
										<div class="border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden">
											<div class="px-3 sm:px-4 py-2 bg-[#454654] border-b border-[#525463]">
												<h6 class="text-xs sm:text-sm font-semibold text-[#f8f8f9]">
													Pool Schedule
												</h6>
											</div>
											<div class="p-3 sm:p-4 space-y-2">
												{#each poolSheet.Pool.Matches as poolMatch}
													{@const startTime = typeof poolMatch.ScheduledStartDateTime === 'string' ? new Date(poolMatch.ScheduledStartDateTime).getTime() : poolMatch.ScheduledStartDateTime}
													{@const isPlaying = poolMatch.FirstTeamText?.includes('630') || poolMatch.SecondTeamText?.includes('630')}
													<div class="flex items-center gap-3 px-3 py-2 rounded border {isPlaying ? 'border-[#eab308]/50 bg-[#eab308]/5' : 'border-[#454654] bg-[#3b3c48]/30'}">
														<div class="flex-shrink-0 w-20 text-sm font-semibold text-[#f8f8f9]">
															{formatMatchTime(startTime)}
														</div>
														{#if poolMatch.Court}
															<div class="flex-shrink-0 w-20 text-xs text-[#facc15] font-medium">
																{poolMatch.Court.Name}
															</div>
														{/if}
														<div class="flex-1 min-w-0 text-xs text-[#c0c2c8]">
															{poolMatch.FirstTeamText}
															{#if poolMatch.SecondTeamText}
																<span class="text-[#808593] mx-1">vs</span>
																{poolMatch.SecondTeamText}
															{/if}
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if selectedPlayId}
								<div class="text-xs text-[#808593] py-4 text-center">
									Loading pool sheet...
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

