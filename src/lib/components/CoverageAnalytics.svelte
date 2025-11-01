<script lang="ts">
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { calculateCoverageMetrics, calculateTeamCoverageStats, formatDuration, type CoverageMetrics, type TeamCoverageStats } from '$lib/utils/analytics';
	import { detectConflicts } from '$lib/utils/matchFilters';
	
	export let matches: FilteredMatch[];
	
	const conflicts = detectConflicts(matches);
	const currentPlan = get(coveragePlan);
	const selectedMatchIds = currentPlan;
	
	$: metrics = (() => {
		return calculateCoverageMetrics(matches, selectedMatchIds, conflicts);
	})();
	
	$: teamStats = (() => {
		return calculateTeamCoverageStats(matches, selectedMatchIds);
	})();
</script>

<div class="space-y-6">
	<!-- Overview Metrics -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Coverage Percentage -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Coverage</div>
			<div class="text-2xl font-bold text-charcoal-50 mb-1">
				{metrics.coveragePercentage.toFixed(1)}%
			</div>
			<div class="text-xs text-charcoal-300">
				{metrics.coveredMatches} of {metrics.totalMatches} matches
			</div>
		</div>

		<!-- Teams Covered -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Teams Covered</div>
			<div class="text-2xl font-bold text-charcoal-50 mb-1">
				{metrics.teamsCovered}
			</div>
			<div class="text-xs text-charcoal-300">
				of {metrics.totalTeams} teams
			</div>
		</div>

		<!-- Total Coverage Time -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Total Time</div>
			<div class="text-2xl font-bold text-charcoal-50 mb-1">
				{formatDuration(metrics.totalCoverageTime)}
			</div>
			<div class="text-xs text-charcoal-300">
				coverage time
			</div>
		</div>

		<!-- Conflicts in Plan -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Conflicts</div>
			<div class="text-2xl font-bold mb-1 {metrics.conflictsInPlan > 0 ? 'text-warning-500' : 'text-charcoal-50'}">
				{metrics.conflictsInPlan}
			</div>
			<div class="text-xs text-charcoal-300">
				in coverage plan
			</div>
		</div>
	</div>

	<!-- Coverage Progress Bar -->
	<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
		<div class="flex items-center justify-between mb-2">
			<div class="text-sm font-medium text-charcoal-50">Coverage Progress</div>
			<div class="text-xs text-charcoal-300">{metrics.coveragePercentage.toFixed(1)}%</div>
		</div>
		<div class="w-full h-3 bg-charcoal-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-gold-500 transition-all duration-300"
				style="width: {Math.min(metrics.coveragePercentage, 100)}%;"
			></div>
		</div>
	</div>

	<!-- Team Coverage Breakdown -->
	{#if teamStats.length > 0}
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-sm font-medium text-charcoal-50 mb-4">Team Coverage Breakdown</div>
			<div class="space-y-3 max-h-[400px] overflow-y-auto">
				{#each teamStats as team}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3 flex-1 min-w-0">
							<div class="text-sm font-medium text-charcoal-50 truncate">
								Team {team.teamId}
							</div>
							<div class="text-xs text-charcoal-300">
								{team.coveredMatches}/{team.totalMatches} matches
							</div>
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
						<div class="w-24 h-2 bg-charcoal-700 rounded-full overflow-hidden">
							<div
								class="h-full bg-gold-500 transition-all duration-300"
								style="width: {Math.min(team.coveragePercentage, 100)}%;"
							></div>
						</div>
							<div class="text-xs text-charcoal-300 w-12 text-right">
								{team.coveragePercentage.toFixed(0)}%
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Efficiency Metrics -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Avg Matches/Team</div>
			<div class="text-xl font-bold text-charcoal-50">
				{metrics.averageMatchesPerTeam.toFixed(1)}
			</div>
		</div>
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Coverage Efficiency</div>
			<div class="text-xl font-bold text-charcoal-50">
				{metrics.totalMatches > 0 ? ((metrics.teamsCovered / metrics.totalTeams) * 100).toFixed(1) : '0'}%
			</div>
			<div class="text-xs text-charcoal-300 mt-1">
				teams covered ratio
			</div>
		</div>
	</div>
</div>

