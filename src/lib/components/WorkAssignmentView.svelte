<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { getTeamIdentifier } from '$lib/stores/filters';
	
	export let matches: FilteredMatch[];
	export let teamId: string;
	export let teamName: string;
	
	// Filter matches where this team is the "working team"
	$: workAssignments = (() => {
		return matches.filter(match => {
			const matchTeamId = getTeamIdentifier(match);
			
			// If team is playing, it's not a work assignment
			if (matchTeamId === teamId) {
				return false;
			}

			// For now, we'll check if the match involves this team in a work capacity
			// This logic may need adjustment based on how work assignments are identified in the API
			// For now, we'll return false since we don't have explicit work assignment data
			// This is a placeholder for future work assignment integration
			return false;
		}).sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
	})();
	
	// Separate assignments by date
	$: assignmentsByDate = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		workAssignments.forEach(match => {
			const date = formatMatchDate(match.ScheduledStartDateTime);
			if (!grouped[date]) {
				grouped[date] = [];
			}
			grouped[date].push(match);
		});
		return grouped;
	})();
	
	$: dates = Object.keys(assignmentsByDate).sort();
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="border-b border-charcoal-700 pb-4">
		<h2 class="text-xl font-bold text-charcoal-50">Work Assignments</h2>
		<div class="text-sm text-charcoal-300 mt-1">
			{teamName} • {workAssignments.length} assignment{workAssignments.length !== 1 ? 's' : ''}
		</div>
	</div>

	<!-- Work Assignments -->
	{#if workAssignments.length > 0}
		<div class="space-y-4">
			{#each dates as date}
				<div>
					<h3 class="text-sm font-semibold text-charcoal-300 mb-2 uppercase tracking-wider">
						{date}
					</h3>
					<div class="space-y-2">
						{#each assignmentsByDate[date] as match}
							<div class="px-4 py-3 rounded-lg border border-charcoal-600 bg-charcoal-700/30">
								<div class="flex items-center justify-between mb-2">
									<div class="text-sm font-semibold text-charcoal-50">
										{formatMatchTime(match.ScheduledStartDateTime)}
									</div>
									<div class="text-xs font-medium text-charcoal-300">
										{match.CourtName}
									</div>
								</div>
								<div class="text-sm text-charcoal-200">
									{match.FirstTeamText} vs {match.SecondTeamText}
								</div>
								<div class="text-xs text-charcoal-300 mt-1">
									{match.Division.CodeAlias} • Work Assignment
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 text-charcoal-300 text-sm">
			No work assignments found for {teamName}
			<div class="text-xs text-charcoal-400 mt-2">
				Work assignments will appear here when assigned by tournament officials.
			</div>
		</div>
	{/if}
</div>

