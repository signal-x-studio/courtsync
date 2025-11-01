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
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Coverage</div>
			<div class="text-2xl font-bold text-[#f8f8f9] mb-1">
				{metrics.coveragePercentage.toFixed(1)}%
			</div>
			<div class="text-xs text-[#9fa2ab]">
				{metrics.coveredMatches} of {metrics.totalMatches} matches
			</div>
		</div>

		<!-- Teams Covered -->
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Teams Covered</div>
			<div class="text-2xl font-bold text-[#f8f8f9] mb-1">
				{metrics.teamsCovered}
			</div>
			<div class="text-xs text-[#9fa2ab]">
				of {metrics.totalTeams} teams
			</div>
		</div>

		<!-- Total Coverage Time -->
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Total Time</div>
			<div class="text-2xl font-bold text-[#f8f8f9] mb-1">
				{formatDuration(metrics.totalCoverageTime)}
			</div>
			<div class="text-xs text-[#9fa2ab]">
				coverage time
			</div>
		</div>

		<!-- Conflicts in Plan -->
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Conflicts</div>
			<div class="text-2xl font-bold mb-1 {metrics.conflictsInPlan > 0 ? 'text-red-400' : 'text-[#f8f8f9]'}">
				{metrics.conflictsInPlan}
			</div>
			<div class="text-xs text-[#9fa2ab]">
				in coverage plan
			</div>
		</div>
	</div>

	<!-- Coverage Progress Bar -->
	<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
		<div class="flex items-center justify-between mb-2">
			<div class="text-sm font-medium text-[#f8f8f9]">Coverage Progress</div>
			<div class="text-xs text-[#9fa2ab]">{metrics.coveragePercentage.toFixed(1)}%</div>
		</div>
		<div class="w-full h-3 bg-[#454654] rounded-full overflow-hidden">
			<div
				class="h-full bg-[#eab308] transition-all duration-300"
				style="width: {Math.min(metrics.coveragePercentage, 100)}%;"
			/>
		</div>
	</div>

	<!-- Team Coverage Breakdown -->
	{#if teamStats.length > 0}
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-sm font-medium text-[#f8f8f9] mb-4">Team Coverage Breakdown</div>
			<div class="space-y-3 max-h-[400px] overflow-y-auto">
				{#each teamStats as team}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3 flex-1 min-w-0">
							<div class="text-sm font-medium text-[#f8f8f9] truncate">
								Team {team.teamId}
							</div>
							<div class="text-xs text-[#9fa2ab]">
								{team.coveredMatches}/{team.totalMatches} matches
							</div>
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
							<div class="w-24 h-2 bg-[#454654] rounded-full overflow-hidden">
								<div
									class="h-full bg-[#eab308] transition-all duration-300"
									style="width: {Math.min(team.coveragePercentage, 100)}%;"
								/>
							</div>
							<div class="text-xs text-[#9fa2ab] w-12 text-right">
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
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Avg Matches/Team</div>
			<div class="text-xl font-bold text-[#f8f8f9]">
				{metrics.averageMatchesPerTeam.toFixed(1)}
			</div>
		</div>
		<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
			<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Coverage Efficiency</div>
			<div class="text-xl font-bold text-[#f8f8f9]">
				{metrics.totalMatches > 0 ? ((metrics.teamsCovered / metrics.totalTeams) * 100).toFixed(1) : '0'}%
			</div>
			<div class="text-xs text-[#9fa2ab] mt-1">
				teams covered ratio
			</div>
		</div>
	</div>
</div>

