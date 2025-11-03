<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: My Teams page showing matches for favorited teams -->
<!-- Note: Allows users to add/remove favorite teams and see their schedules -->

<script lang="ts">
	import { page } from '$app/stores';
	import { aesClient } from '$lib/api/aesClient';
	import { eventId } from '$lib/stores/event';
	import { favoriteTeams } from '$lib/stores/favorites';
	import { filters } from '$lib/stores/filters';
	import { applyFilters, groupByTime } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import MatchCardSkeleton from '$lib/components/ui/MatchCardSkeleton.svelte';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import type { Match, TeamAssignment } from '$lib/types/aes';

	let loading = $state(true);
	let error = $state('');
	let allMatches = $state<Match[]>([]);
	let availableTeams = $state<TeamAssignment[]>([]);
	let showTeamSelector = $state(false);

	// Derived reactive values
	let favoriteMatches = $derived(
		allMatches.filter(
			(match) =>
				(match.FirstTeamId && $favoriteTeams.includes(match.FirstTeamId)) ||
				(match.SecondTeamId && $favoriteTeams.includes(match.SecondTeamId))
		)
	);
	let filteredMatches = $derived(applyFilters(favoriteMatches, $filters));
	let timeBlocks = $derived(groupByTime(filteredMatches));

	async function loadData() {
		if (!$eventId) {
			error = 'Please select an event first';
			loading = false;
			return;
		}

		loading = true;
		error = '';

		try {
			// Get current date
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0];
			if (!dateStr) {
				throw new Error('Invalid date format');
			}

			// Load court schedule
			const schedule = await aesClient.getCourtSchedule($eventId, dateStr, 1440);
			allMatches = schedule.Matches;

			// Extract unique teams from matches
			const teamsMap = new Map<number, TeamAssignment>();
			for (const match of schedule.Matches) {
				// Add first team
				if (match.FirstTeamId) {
					teamsMap.set(match.FirstTeamId, {
						TeamId: match.FirstTeamId,
						TeamName: match.FirstTeamText,
						TeamCode: '',
						ClubId: 0,
						ClubName: '',
						DivisionId: match.Division.DivisionId,
						DivisionName: match.Division.Name
					});
				}
				// Add second team
				if (match.SecondTeamId) {
					teamsMap.set(match.SecondTeamId, {
						TeamId: match.SecondTeamId,
						TeamName: match.SecondTeamText,
						TeamCode: '',
						ClubId: 0,
						ClubName: '',
						DivisionId: match.Division.DivisionId,
						DivisionName: match.Division.Name
					});
				}
			}
			availableTeams = Array.from(teamsMap.values()).sort((a, b) => {
				const divCompare = a.DivisionName.localeCompare(b.DivisionName);
				return divCompare !== 0 ? divCompare : a.TeamName.localeCompare(b.TeamName);
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
			allMatches = [];
			availableTeams = [];
		} finally {
			loading = false;
		}
	}

	function toggleFavorite(teamId: number) {
		if ($favoriteTeams.includes(teamId)) {
			favoriteTeams.removeTeam(teamId);
		} else {
			favoriteTeams.addTeam(teamId);
		}
	}

	// Load data when component mounts
	$effect(() => {
		loadData();
	});
</script>

<div class="max-w-screen-xl mx-auto p-4">
	<div class="mb-6 flex justify-between items-start">
		<div>
			<h2 class="text-2xl font-bold text-court-gold mb-2">My Teams</h2>
			<p class="text-gray-400">
				{$favoriteTeams.length} favorite team{$favoriteTeams.length !== 1 ? 's' : ''}
				• {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
			</p>
		</div>
		<button
			onclick={() => (showTeamSelector = !showTeamSelector)}
			class="px-4 py-2 bg-court-charcoal border border-gray-700 rounded-lg hover:border-court-gold transition-colors"
		>
			{showTeamSelector ? 'Hide' : 'Manage'} Teams
		</button>
	</div>

	{#if showTeamSelector}
		<div class="mb-6 bg-court-charcoal border border-gray-700 rounded-lg p-4">
			<h3 class="text-lg font-semibold mb-3">Select Your Teams</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
				{#each availableTeams as team (team.TeamId)}
					<button
						onclick={() => team.TeamId && toggleFavorite(team.TeamId)}
						class="text-left px-3 py-2 rounded border transition-colors {team.TeamId &&
						$favoriteTeams.includes(team.TeamId)
							? 'border-court-gold bg-court-gold bg-opacity-10'
							: 'border-gray-700'}"
					>
						<div class="flex items-center gap-2">
							<span
								class="text-lg"
								class:text-court-gold={team.TeamId && $favoriteTeams.includes(team.TeamId)}
							>
								{team.TeamId && $favoriteTeams.includes(team.TeamId) ? '★' : '☆'}
							</span>
							<div>
								<div class="font-medium">{team.TeamName}</div>
								<div class="text-sm text-gray-400">{team.DivisionName}</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<ErrorBoundary {error} retry={loadData}>
		{#if loading}
			<div class="space-y-4">
				{#each Array(5) as _}
					<MatchCardSkeleton />
				{/each}
			</div>
		{:else if $favoriteTeams.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg mb-4">No favorite teams selected</p>
				<button
					onclick={() => (showTeamSelector = true)}
					class="px-6 py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark transition-colors"
				>
					Select Your Teams
				</button>
			</div>
		{:else if timeBlocks.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg">No matches found for your teams</p>
				{#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
					<button
						onclick={() => filters.clear()}
						class="mt-4 text-court-gold hover:underline"
					>
						Clear filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="space-y-4">
				{#each timeBlocks as block (block.time)}
					<TimeBlock {block} conflicts={new Set()} showCoverageToggle={false} />
				{/each}
			</div>
		{/if}
	</ErrorBoundary>
</div>
