<script lang="ts">
	import type { FilteredMatch, MatchScore } from '$lib/types';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	import { calculateTeamStats } from '$lib/utils/scoreStats';
	
	export let matches: FilteredMatch[];
	export let eventId: string;
	export let teamId: string;
	export let teamName: string;
	
	const matchClaiming = createMatchClaiming(eventId, 'anonymous');
	
	// Get all scores
	$: scores = (() => {
		const scoreMap = new Map<number, MatchScore>();
		matches.forEach(match => {
			const score = matchClaiming.getScore(match.MatchId);
			if (score) {
				scoreMap.set(match.MatchId, score);
			}
		});
		return scoreMap;
	})();
	
	// Calculate team statistics
	$: stats = calculateTeamStats(teamId, teamName, matches, scores);
</script>

<div class="space-y-4">
	<h3 class="text-lg font-semibold text-charcoal-50">Team Statistics</h3>

	<!-- Overview Cards -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Record</div>
			<div class="text-lg font-bold text-charcoal-50">
				{stats.wins}-{stats.losses}
			</div>
		</div>

		<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Win %</div>
			<div class="text-lg font-bold text-[#facc15]">
				{stats.winPercentage.toFixed(1)}%
			</div>
		</div>

		<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Sets</div>
			<div class="text-lg font-bold text-charcoal-50">
				{stats.setsWon}-{stats.setsLost}
			</div>
		</div>

		<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Matches</div>
			<div class="text-lg font-bold text-charcoal-50">
				{stats.completedMatches}/{stats.totalMatches}
			</div>
		</div>
	</div>

	<!-- Detailed Statistics -->
	<div class="space-y-3">
		<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
			<div class="text-sm font-semibold text-charcoal-50 mb-2">Points</div>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<div class="text-xs text-charcoal-300 mb-1">Scored</div>
					<div class="text-base font-bold text-charcoal-50">
						{stats.pointsScored} ({stats.avgPointsScored.toFixed(1)} avg)
					</div>
				</div>
				<div>
					<div class="text-xs text-charcoal-300 mb-1">Allowed</div>
					<div class="text-base font-bold text-charcoal-50">
						{stats.pointsAllowed} ({stats.avgPointsAllowed.toFixed(1)} avg)
					</div>
				</div>
			</div>
		</div>

		<!-- Win/Loss Breakdown -->
		{#if stats.completedMatches > 0}
			<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
				<div class="text-sm font-semibold text-charcoal-50 mb-2">Win/Loss Breakdown</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-xs text-charcoal-300">Wins</span>
						<div class="flex items-center gap-2">
					<div class="w-24 h-2 bg-charcoal-700 rounded-full overflow-hidden">
						<div
							class="h-full bg-green-500"
							style="width: {stats.winPercentage}%"
						></div>
					</div>
							<span class="text-sm font-semibold text-charcoal-50 w-8 text-right">
								{stats.wins}
							</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-charcoal-300">Losses</span>
						<div class="flex items-center gap-2">
					<div class="w-24 h-2 bg-charcoal-700 rounded-full overflow-hidden">
						<div
							class="h-full bg-red-500"
							style="width: {100 - stats.winPercentage}%"
						></div>
					</div>
							<span class="text-sm font-semibold text-charcoal-50 w-8 text-right">
								{stats.losses}
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if stats.completedMatches === 0}
		<div class="text-center py-8 text-charcoal-300 text-sm">
			No completed matches yet
		</div>
	{/if}
</div>

