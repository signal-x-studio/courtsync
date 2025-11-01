<script lang="ts">
	import type { FilteredMatch, SetScore } from '$lib/types';
	import { formatMatchTime } from '$lib/utils/dateUtils';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	import LiveScoreIndicator from '$lib/components/LiveScoreIndicator.svelte';
	
	export let matches: FilteredMatch[];
	export let eventId: string;
	export let userId: string | undefined = undefined;
	export let onMatchClick: ((match: FilteredMatch) => void) | undefined = undefined;
	
	const matchClaiming = createMatchClaiming(eventId, userId || 'anonymous');
	
	// Find matches that are currently in progress
	$: liveMatches = (() => {
		const now = Date.now();
		return matches.filter(match => {
			const matchStart = match.ScheduledStartDateTime;
			const matchEnd = match.ScheduledEndDateTime || matchStart + (90 * 60 * 1000);
			const score = matchClaiming.getScore(match.MatchId);
			
			return (score && score.status === 'in-progress') || (now >= matchStart && now <= matchEnd);
		});
	})();
</script>

{#if liveMatches.length > 0}
	<div class="mb-6 rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-[#f8f8f9] flex items-center gap-2">
				<span class="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
				Live Now
			</h2>
			<span class="text-xs text-[#9fa2ab]">
				{liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} in progress
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each liveMatches as match}
				{@const score = matchClaiming.getScore(match.MatchId)}
				{@const currentSet = score?.sets.find((s: SetScore) => s.completedAt === 0) || score?.sets[score?.sets.length - 1]}
				{@const completedSets = score?.sets.filter((s: SetScore) => s.completedAt > 0) || []}
				{@const team1Wins = completedSets.filter((s: SetScore) => s.team1Score > s.team2Score).length}
				{@const team2Wins = completedSets.filter((s: SetScore) => s.team2Score > s.team1Score).length}
				
				<div
					onclick={() => onMatchClick?.(match)}
					class="px-4 py-3 rounded-lg border border-[#525463] bg-[#454654] hover:border-[#eab308] transition-colors cursor-pointer"
				>
					<!-- Match Header -->
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<span class="text-xs font-medium text-[#facc15]">
								{match.CourtName}
							</span>
							<LiveScoreIndicator
								isLive={score?.status === 'in-progress' || false}
								lastUpdated={score?.lastUpdated}
							/>
						</div>
						<div class="text-xs text-[#9fa2ab]">
							{formatMatchTime(match.ScheduledStartDateTime)}
						</div>
					</div>

					<!-- Teams -->
					<div class="space-y-1">
						<div class="text-sm font-semibold text-[#f8f8f9]">
							{match.FirstTeamText}
						</div>
						<div class="text-xs text-[#9fa2ab]">vs</div>
						<div class="text-sm font-semibold text-[#f8f8f9]">
							{match.SecondTeamText}
						</div>
					</div>

					<!-- Score Display -->
					{#if score && score.status !== 'not-started' && currentSet}
						<div class="mt-3 pt-3 border-t border-[#525463]">
							<div class="flex items-center justify-between">
								{#if completedSets.length > 0}
									<div class="text-xs text-[#9fa2ab]">
										Sets: {team1Wins}-{team2Wins}
									</div>
								{/if}
								<div class="text-lg font-bold text-[#facc15]">
									{currentSet.team1Score}-{currentSet.team2Score}
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

