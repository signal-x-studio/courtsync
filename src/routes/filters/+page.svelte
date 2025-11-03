<!-- Reference: https://svelte.dev/docs/svelte/$state -->
<!-- Purpose: Filters page for division and team filtering, plus uncovered matches toggle -->
<!-- Note: Uses session-only filters store, provides clear all functionality -->

<script lang="ts">
	import { filters } from '$lib/stores/filters';
	import { persona } from '$lib/stores/persona';
	import type { PageData } from './$types';
	import type { TeamAssignment } from '$lib/types/aes';

	// Get data from load function
	let { data }: { data: PageData } = $props();

	// Use data from server-side load
	let divisions = $derived(data.divisions);
	let teams = $derived(data.teams);

	// Group teams by division for better UX
	let teamsByDivision = $derived(
		teams.reduce(
			(acc, team) => {
				if (!team.DivisionId) return acc;
				if (!acc[team.DivisionId]) {
					acc[team.DivisionId] = [];
				}
				acc[team.DivisionId]?.push(team);
				return acc;
			},
			{} as Record<number, TeamAssignment[]>
		)
	);

	function toggleDivision(divisionId: number) {
		if ($filters.divisionIds.includes(divisionId)) {
			filters.removeDivision(divisionId);
		} else {
			filters.addDivision(divisionId);
		}
	}

	function toggleTeam(teamId: number) {
		if ($filters.teamIds.includes(teamId)) {
			filters.removeTeam(teamId);
		} else {
			filters.addTeam(teamId);
		}
	}
</script>

<div class="max-w-screen-xl mx-auto p-4">
	<div class="mb-6 flex justify-between items-start">
		<div>
			<h2 class="text-2xl font-bold text-court-gold mb-2">Filters</h2>
			<p class="text-gray-400">
				{$filters.divisionIds.length} division{$filters.divisionIds.length !== 1 ? 's' : ''}
				• {$filters.teamIds.length} team{$filters.teamIds.length !== 1 ? 's' : ''}
			</p>
		</div>
		{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0 || $filters.showOnlyUncovered}
			<button
				onclick={() => filters.clear()}
				class="px-4 py-2 bg-red-900 text-red-400 border border-red-700 rounded-lg hover:bg-red-800 transition-colors"
			>
				Clear All
			</button>
		{/if}
	</div>

	<div class="space-y-6">
		<!-- Media-only: Show only uncovered matches -->
		{#if $persona === 'media'}
			<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
				<h3 class="text-lg font-semibold mb-3">Coverage Filters</h3>
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={$filters.showOnlyUncovered}
						onchange={(e) => filters.setShowOnlyUncovered(e.currentTarget.checked)}
						class="w-5 h-5 rounded border-gray-700 bg-court-dark text-court-gold focus:ring-court-gold focus:ring-offset-court-dark"
					/>
					<span>Show only uncovered matches</span>
				</label>
			</div>
		{/if}

		<!-- Division Filters -->
		<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
			<h3 class="text-lg font-semibold mb-3">Divisions</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
				{#each divisions as division (division.DivisionId)}
					<button
						onclick={() => toggleDivision(division.DivisionId)}
						class="text-left px-3 py-2 rounded border transition-colors flex items-center gap-2 {$filters.divisionIds.includes(
							division.DivisionId
						)
							? 'border-court-gold bg-court-gold bg-opacity-10'
							: 'border-gray-700'}"
					>
						<div
							class="w-4 h-4 rounded-full"
							style="background-color: {division.ColorHex}"
							aria-hidden="true"
						></div>
						<span>{division.Name}</span>
						{#if $filters.divisionIds.includes(division.DivisionId)}
							<span class="ml-auto text-court-gold">✓</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Team Filters -->
		<div class="bg-court-charcoal border border-gray-700 rounded-lg p-4">
			<h3 class="text-lg font-semibold mb-3">Teams</h3>
			<div class="space-y-4">
				{#each divisions as division (division.DivisionId)}
					{@const divisionTeams = teamsByDivision[division.DivisionId] || []}
					{#if divisionTeams.length > 0}
						<div>
							<h4 class="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
								<div
									class="w-3 h-3 rounded-full"
									style="background-color: {division.ColorHex}"
									aria-hidden="true"
								></div>
								{division.Name}
							</h4>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2 ml-5">
								{#each divisionTeams as team (team.TeamId)}
									<button
										onclick={() => team.TeamId && toggleTeam(team.TeamId)}
										class="text-left px-3 py-2 rounded border transition-colors text-sm {team.TeamId &&
										$filters.teamIds.includes(team.TeamId)
											? 'border-court-gold bg-court-gold bg-opacity-10'
											: 'border-gray-700'}"
									>
										{team.TeamName}
										{#if team.TeamId && $filters.teamIds.includes(team.TeamId)}
											<span class="ml-2 text-court-gold">✓</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Apply Filters Info -->
		<div class="bg-blue-900/20 border border-blue-600 rounded-lg p-4 text-blue-400">
			ℹ️ Filters are applied automatically to the All Matches and My Teams pages.
		</div>
	</div>
</div>
