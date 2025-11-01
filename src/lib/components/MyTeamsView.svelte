<script lang="ts">
	import { followedTeams } from '$lib/stores/followedTeams';
	import type { FilteredMatch } from '$lib/types';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { Star } from 'lucide-svelte';
	import TeamDelayBadge from '$lib/components/TeamDelayBadge.svelte';
	import TeamDelayQuickSet from '$lib/components/TeamDelayQuickSet.svelte';
	
	export let matches: FilteredMatch[] = [];
	export let onTeamSelect: (teamId: string, teamName: string) => void;
	
	let delayQuickSetTeam: { teamId: string; teamName: string; matchStartTime: number } | null = null;
	
	// Filter matches for each followed team
	function getTeamMatches(teamId: string): FilteredMatch[] {
		return matches.filter(match => {
			const matchTeamId = getTeamIdentifier(match);
			return matchTeamId === teamId;
		}).sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
	}
	
	// Get next match for a team
	function getNextMatch(teamId: string): FilteredMatch | null {
		const teamMatches = getTeamMatches(teamId);
		const now = Date.now();
		const upcoming = teamMatches.filter(m => m.ScheduledStartDateTime > now);
		return upcoming.length > 0 ? upcoming[0] : null;
	}
	
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
</script>

<div class="px-4 py-4 pb-24 lg:px-0 lg:py-0">
	{#if $followedTeams && $followedTeams.length > 0}
		<div class="space-y-3">
			{#each $followedTeams as team}
				{@const teamMatches = getTeamMatches(team.teamId)}
				{@const nextMatch = getNextMatch(team.teamId)}
				{@const teamColor = followedTeams.getTeamColor(team.teamId)}
				
				<button
					type="button"
					onclick={() => onTeamSelect(team.teamId, team.teamName)}
					class="w-full px-4 py-4 rounded-lg border border-charcoal-700 bg-charcoal-800 hover:border-gold-500 hover:bg-charcoal-700 transition-colors text-left"
				>
					<div class="flex items-start gap-3">
						<!-- Team Color Indicator -->
						{#if teamColor}
							<div
								class="w-4 h-4 rounded-full flex-shrink-0 mt-1"
								style="background-color: {teamColor};"
							></div>
						{:else}
							<div class="w-4 h-4 flex-shrink-0 mt-1"></div>
						{/if}
						
						<div class="flex-1 min-w-0">
							<!-- Team Name -->
							<div class="flex items-center gap-2 mb-1">
								<h3 class="text-base font-bold text-charcoal-50 truncate">
									{team.teamName}
								</h3>
								<Star size={16} class="text-gold-500 fill-current flex-shrink-0" />
								{#if nextMatch}
									<TeamDelayBadge
										match={nextMatch}
										onClick={() => {
											delayQuickSetTeam = {
												teamId: team.teamId,
												teamName: team.teamName,
												matchStartTime: nextMatch.ScheduledStartDateTime
											};
										}}
									/>
								{/if}
							</div>
							
							<!-- Match Count -->
							<div class="text-xs text-charcoal-400 mb-2">
								{teamMatches.length} match{teamMatches.length !== 1 ? 'es' : ''}
							</div>
							
							<!-- Next Match Preview -->
							{#if nextMatch}
								<div class="mt-2 pt-2 border-t border-charcoal-700">
									<div class="text-xs text-charcoal-300 mb-1">Next Match:</div>
									<div class="flex items-center gap-2 text-sm">
										<span class="font-semibold text-charcoal-50">
											{formatMatchDate(nextMatch.ScheduledStartDateTime)} • {formatMatchTime(nextMatch.ScheduledStartDateTime)}
										</span>
										<span class="text-gold-500 font-medium">
											{nextMatch.CourtName}
										</span>
									</div>
									<div class="text-xs text-charcoal-300 mt-1">
										vs {getOpponent(nextMatch)}
									</div>
								</div>
							{:else if teamMatches.length === 0}
								<div class="mt-2 pt-2 border-t border-charcoal-700">
									<div class="text-xs text-charcoal-400">No matches found</div>
								</div>
							{:else}
								<div class="mt-2 pt-2 border-t border-charcoal-700">
									<div class="text-xs text-charcoal-400">No upcoming matches</div>
								</div>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<div class="text-charcoal-300 text-sm mb-2">No teams favorited yet</div>
			<div class="text-xs text-charcoal-400">
				Tap the star icon on a match card to favorite a team
			</div>
		</div>
	{/if}
	
	<!-- Team Delay Quick Set Modal -->
	{#if delayQuickSetTeam}
		<TeamDelayQuickSet
			teamId={delayQuickSetTeam.teamId}
			teamName={delayQuickSetTeam.teamName}
			matchStartTime={delayQuickSetTeam.matchStartTime}
			onClose={() => delayQuickSetTeam = null}
		/>
	{/if}
</div>

