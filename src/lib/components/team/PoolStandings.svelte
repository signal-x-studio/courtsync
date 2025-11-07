<!-- Reference: https://svelte.dev/docs/svelte/what-are-runes -->
<!-- Purpose: Display pool standings table for a team's pool -->
<!-- Note: Shows rank, team name, record, sets, and point ratio -->

<script lang="ts">
	import type { PoolTeam } from '$lib/types/aes';

	interface Props {
		teams: PoolTeam[];
		highlightTeamId?: number;
		loading?: boolean;
		error?: string;
	}

	let { teams = [], highlightTeamId, loading = false, error = '' }: Props = $props();

	// Sort teams by finish rank
	let sortedTeams = $derived(teams.sort((a, b) => a.FinishRank - b.FinishRank));
</script>

{#if loading}
	<div class="flex justify-center py-8">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-court-gold border-t-transparent"></div>
	</div>
{:else if error}
	<div class="rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
		{error}
	</div>
{:else if sortedTeams.length === 0}
	<div class="rounded-lg bg-court-charcoal p-4 text-center text-sm text-gray-400">
		No standings available yet
	</div>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-700 text-left text-xs uppercase text-gray-400">
					<th class="pb-3 pr-4 font-medium">Rank</th>
					<th class="pb-3 pr-4 font-medium">Team</th>
					<th class="hidden pb-3 pr-4 text-center font-medium sm:table-cell">Matches</th>
					<th class="pb-3 pr-4 text-center font-medium">W-L</th>
					<th class="hidden pb-3 pr-4 text-center font-medium md:table-cell">Sets</th>
					<th class="hidden pb-3 text-center font-medium lg:table-cell">Ratio</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedTeams as team}
					<tr
						class={`border-b border-gray-800 transition-colors hover:bg-court-charcoal/30 ${
					team.TeamId === highlightTeamId ? 'bg-court-gold/10 border-court-gold/30' : ''
				}`}
					>
						<td class="py-3 pr-4">
							<span
								class="inline-flex h-7 w-7 items-center justify-center rounded font-semibold"
								class:bg-court-gold={team.FinishRank === 1}
								class:text-court-dark={team.FinishRank === 1}
								class:bg-gray-700={team.FinishRank > 1}
								class:text-gray-300={team.FinishRank > 1}
							>
								{team.FinishRank}
							</span>
						</td>
						<td class="py-3 pr-4">
							<div class="font-medium text-gray-100">{team.TeamName}</div>
							<div class="text-xs text-gray-500">{team.Club.Name}</div>
						</td>
						<td class="hidden py-3 pr-4 text-center sm:table-cell">
							<div class="text-gray-300">{team.MatchesWon + team.MatchesLost}</div>
							<div class="text-xs text-gray-500">
								{(team.MatchPercent * 100).toFixed(0)}%
							</div>
						</td>
						<td class="py-3 pr-4 text-center">
							<div class="font-medium text-gray-100">
								{team.MatchesWon}-{team.MatchesLost}
							</div>
						</td>
						<td class="hidden py-3 pr-4 text-center md:table-cell">
							<div class="text-gray-300">{team.SetsWon}-{team.SetsLost}</div>
							<div class="text-xs text-gray-500">
								{(team.SetPercent * 100).toFixed(0)}%
							</div>
						</td>
						<td class="hidden py-3 text-center lg:table-cell">
							<div class="font-mono text-gray-300">{team.PointRatio.toFixed(2)}</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
