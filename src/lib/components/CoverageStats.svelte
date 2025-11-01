<script lang="ts">
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { calculateTeamCoverageMetrics, calculateCoverageDashboardMetrics } from '$lib/utils/coverageStats';
	import { exportCoverageStatsToCSV, exportCoverageStatsToJSON } from '$lib/utils/coverageStats';
	import type { TeamCoverageMetrics, CoverageDashboardMetrics } from '$lib/utils/coverageStats';
	
	export let matches: FilteredMatch[];
	
	const currentPlan = get(coveragePlan);
	const selectedMatchIds = currentPlan;
	
	// Build coverage status map
	$: coverageStatusMap = (() => {
		const map = new Map<string, string>();
		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
			if (teamId) {
				map.set(teamId, coverageStatus.getTeamStatus(teamId));
			}
		});
		return map;
	})();
	
	// Calculate metrics
	$: teamMetrics = (() => {
		return calculateTeamCoverageMetrics(
			matches,
			selectedMatchIds,
			coverageStatusMap as any,
			getTeamIdentifier
		);
	})();
	
	$: dashboardMetrics = (() => {
		return calculateCoverageDashboardMetrics(
			matches,
			selectedMatchIds,
			coverageStatusMap as any,
			getTeamIdentifier
		);
	})();
	
	function handleExportCSV() {
		const csv = exportCoverageStatsToCSV(teamMetrics, dashboardMetrics);
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-stats-${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	function handleExportJSON() {
		const json = exportCoverageStatsToJSON(teamMetrics, dashboardMetrics);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-stats-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="space-y-6">
	<!-- Dashboard Summary -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Coverage Percentage -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Coverage</div>
			<div class="text-2xl font-bold text-charcoal-50 mb-1">
				{dashboardMetrics.coveragePercentage.toFixed(1)}%
			</div>
			<div class="text-xs text-charcoal-300">
				{dashboardMetrics.coveredTeams + dashboardMetrics.partiallyCoveredTeams} of {dashboardMetrics.totalTeams} teams
			</div>
		</div>

		<!-- Covered Teams -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Covered</div>
			<div class="text-2xl font-bold text-green-400 mb-1">
				{dashboardMetrics.coveredTeams}
			</div>
			<div class="text-xs text-charcoal-300">
				{dashboardMetrics.partiallyCoveredTeams} partially covered
			</div>
		</div>

		<!-- Planned Teams -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Planned</div>
			<div class="text-2xl font-bold text-gold-500 mb-1">
				{dashboardMetrics.plannedTeams}
			</div>
			<div class="text-xs text-charcoal-300">
				{dashboardMetrics.plannedPercentage.toFixed(1)}% of teams
			</div>
		</div>

		<!-- Uncovered Teams -->
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Uncovered</div>
			<div class="text-2xl font-bold text-charcoal-400 mb-1">
				{dashboardMetrics.uncoveredTeams}
			</div>
			<div class="text-xs text-charcoal-300">
				{dashboardMetrics.totalTeams > 0 ? ((dashboardMetrics.uncoveredTeams / dashboardMetrics.totalTeams) * 100).toFixed(1) : 0}% remaining
			</div>
		</div>
	</div>

	<!-- Coverage Progress Bar -->
	<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
		<div class="flex items-center justify-between mb-2">
			<div class="text-sm font-medium text-charcoal-50">Overall Coverage Progress</div>
			<div class="text-xs text-charcoal-300">{dashboardMetrics.coveragePercentage.toFixed(1)}%</div>
		</div>
		<div class="w-full h-3 bg-charcoal-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-gold-500 transition-all duration-300"
				style="width: {Math.min(dashboardMetrics.coveragePercentage, 100)}%;"
			/>
		</div>
	</div>

	<!-- Team Breakdown -->
	<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
		<div class="flex items-center justify-between mb-4">
			<div class="text-sm font-medium text-charcoal-50">Team Coverage Breakdown</div>
			<div class="flex gap-2">
				<button
					onclick={handleExportCSV}
					class="px-3 py-1.5 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
				>
					Export CSV
				</button>
				<button
					onclick={handleExportJSON}
					class="px-3 py-1.5 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
				>
					Export JSON
				</button>
			</div>
		</div>
		
		<div class="space-y-3 max-h-[400px] overflow-y-auto">
			{#each teamMetrics as team}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3 flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-shrink-0">
							<div class="w-3 h-3 rounded {team.status === 'covered' ? 'bg-green-500' : team.status === 'partially-covered' ? 'bg-[#f59e0b]' : team.status === 'planned' ? 'bg-gold-500' : 'bg-[#808593]'}" />
							<div class="text-sm font-medium text-charcoal-50">
								Team {team.teamId}
							</div>
						</div>
						<div class="text-xs text-charcoal-300">
							{team.coveredMatches}/{team.totalMatches} matches
							{#if team.plannedMatches > 0}
								• {team.plannedMatches} planned
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-2 flex-shrink-0">
						<div class="w-24 h-2 bg-charcoal-700 rounded-full overflow-hidden">
							<div
								class="h-full transition-all duration-300 {team.status === 'covered' ? 'bg-green-500' : team.status === 'partially-covered' ? 'bg-[#f59e0b]' : team.status === 'planned' ? 'bg-gold-500' : 'bg-[#808593]'}"
								style="width: {Math.min(team.coveragePercentage, 100)}%;"
							/>
						</div>
						<div class="text-xs text-charcoal-300 w-12 text-right">
							{team.coveragePercentage.toFixed(0)}%
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

