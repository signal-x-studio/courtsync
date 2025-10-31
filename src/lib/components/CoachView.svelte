<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { getUniqueTeams, getTeamIdentifier } from '$lib/stores/filters';
	import TeamDetailPanel from '$lib/components/TeamDetailPanel.svelte';
	import TeamMatchView from '$lib/components/TeamMatchView.svelte';
	import WorkAssignmentView from '$lib/components/WorkAssignmentView.svelte';
	
	export let matches: FilteredMatch[];
	export let eventId: string;
	export let clubId: number;
	
	let selectedTeam: string | null = null;
	let selectedMatch: FilteredMatch | null = null;
	let viewMode: 'matches' | 'work' = 'matches';
	
	// Get unique teams from matches
	$: teams = getUniqueTeams(matches);
	
	// Group matches by team
	$: matchesByTeam = (() => {
		const grouped: Record<string, FilteredMatch[]> = {};
		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
			if (teamId) {
				if (!grouped[teamId]) {
					grouped[teamId] = [];
				}
				grouped[teamId].push(match);
			}
		});
		return grouped;
	})();
	
	// Get selected team's matches
	$: selectedTeamMatches = selectedTeam ? (matchesByTeam[selectedTeam] || []) : [];
	
	// Sort teams by number of matches (most active teams first)
	$: sortedTeams = (() => {
		return [...teams].sort((a, b) => {
			const matchesA = matchesByTeam[a]?.length || 0;
			const matchesB = matchesByTeam[b]?.length || 0;
			return matchesB - matchesA;
		});
	})();
	
	function handleTeamSelect(teamId: string) {
		selectedTeam = teamId;
		const firstMatch = matchesByTeam[teamId]?.[0];
		if (firstMatch) {
			selectedMatch = firstMatch;
		}
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h1 class="text-xl font-bold text-[#f8f8f9]">Coach View</h1>
			<p class="text-sm text-[#9fa2ab] mt-1">
				View matches and work assignments by team
			</p>
		</div>

		<!-- View Mode Toggle -->
		<div class="flex items-center gap-2 bg-[#454654] rounded-lg p-1">
			<button
				onclick={() => viewMode = 'matches'}
				class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] {viewMode === 'matches' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
			>
				Matches
			</button>
			<button
				onclick={() => viewMode = 'work'}
				class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] {viewMode === 'work' ? 'bg-[#eab308] text-[#18181b]' : 'text-[#c0c2c8] hover:text-[#f8f8f9]'}"
			>
				Work Assignments
			</button>
		</div>
	</div>

	<!-- Team Selector -->
	{#if teams.length > 0}
		<div class="border-b border-[#454654] pb-4">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Select Team:</span>
				{#each sortedTeams as teamId}
					<button
						onclick={() => handleTeamSelect(teamId)}
						class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] {selectedTeam === teamId ? 'bg-[#eab308] text-[#18181b]' : 'bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]'}"
					>
						{teamId}
						{#if matchesByTeam[teamId]}
							<span class="ml-2 text-[10px] opacity-75">
								({matchesByTeam[teamId].length})
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Team Content -->
	{#if selectedTeam}
		{#if viewMode === 'matches'}
			<TeamMatchView {matches} {teamId} teamName={selectedTeam} {eventId} />
		{:else}
			<WorkAssignmentView {matches} {teamId} teamName={selectedTeam} />
		{/if}
	{:else}
		<div class="text-center py-12 text-[#9fa2ab] text-sm">
			Select a team to view matches and work assignments
		</div>
	{/if}

	<!-- Team Detail Panel -->
	{#if selectedMatch}
		<TeamDetailPanel
			match={selectedMatch}
			{eventId}
			{clubId}
			onClose={() => selectedMatch = null}
			{matches}
		/>
	{/if}
</div>

