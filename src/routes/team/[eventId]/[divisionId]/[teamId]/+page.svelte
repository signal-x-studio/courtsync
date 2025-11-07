<!-- Reference: https://svelte.dev/docs/svelte/$state -->
<!-- Purpose: Team detail page with schedule, pool standings, and roster -->
<!-- Note: Shows multiple schedule types and team information -->

<script lang="ts">
	import type { PageData } from './$types';
	import { groupByTime } from '$lib/utils/filterMatches';
	import TimeBlock from '$lib/components/match/TimeBlock.svelte';
	import MatchCard from '$lib/components/match/MatchCard.svelte';

	// Get data from server-side load
	let { data }: { data: PageData } = $props();

	let activeTab = $state<'schedule' | 'pool' | 'roster'>('schedule');
	let scheduleType = $state<'current' | 'work' | 'future' | 'past'>('current');

	// Get team name from first match if available
	let teamName = $derived.by(() => {
		const allMatches = [
			...data.schedules.current,
			...data.schedules.work,
			...data.schedules.future,
			...data.schedules.past
		];
		if (allMatches.length > 0) {
			const match = allMatches[0];
			if (match?.FirstTeamId === data.teamId) return match.FirstTeamText;
			if (match?.SecondTeamId === data.teamId) return match.SecondTeamText;
			if (match?.WorkTeamId === data.teamId) return match.WorkTeamText;
		}
		return `Team ${data.teamId}`;
	});

	let currentMatches = $derived(data.schedules[scheduleType]);
	let timeBlocks = $derived(groupByTime(currentMatches));
</script>

<div class="max-w-screen-xl mx-auto p-4">
	<!-- Header -->
	<div class="mb-6">
		<button
			onclick={() => window.history.back()}
			class="text-court-gold hover:underline mb-4 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-gold focus-visible:ring-offset-2 focus-visible:ring-offset-court-dark rounded px-2 py-1 -ml-2"
			aria-label="Go back to previous page"
		>
			<span class="text-lg">←</span>
			<span class="font-medium">Back</span>
		</button>
		<h2 class="text-2xl font-bold text-court-gold mb-2">{teamName}</h2>
		<p class="text-gray-400 text-sm">{data.divisionName}</p>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2 mb-6 border-b border-gray-800">
		<button
			onclick={() => (activeTab = 'schedule')}
			class="px-4 py-2 font-medium transition-colors"
			class:text-court-gold={activeTab === 'schedule'}
			class:border-b-2={activeTab === 'schedule'}
			class:border-court-gold={activeTab === 'schedule'}
			class:text-gray-400={activeTab !== 'schedule'}
		>
			Schedule
		</button>
		{#if data.poolSheet}
			<button
				onclick={() => (activeTab = 'pool')}
				class="px-4 py-2 font-medium transition-colors"
				class:text-court-gold={activeTab === 'pool'}
				class:border-b-2={activeTab === 'pool'}
				class:border-court-gold={activeTab === 'pool'}
				class:text-gray-400={activeTab !== 'pool'}
			>
				Pool Standings
			</button>
		{/if}
		{#if data.roster.length > 0}
			<button
				onclick={() => (activeTab = 'roster')}
				class="px-4 py-2 font-medium transition-colors"
				class:text-court-gold={activeTab === 'roster'}
				class:border-b-2={activeTab === 'roster'}
				class:border-court-gold={activeTab === 'roster'}
				class:text-gray-400={activeTab !== 'roster'}
			>
				Roster
			</button>
		{/if}
	</div>

	<!-- Schedule Tab -->
	{#if activeTab === 'schedule'}
		<!-- Schedule Type Selector -->
		<div class="flex gap-2 mb-6">
			<button
				onclick={() => (scheduleType = 'current')}
				class="px-4 py-2 rounded transition-colors"
				class:bg-court-gold={scheduleType === 'current'}
				class:text-court-dark={scheduleType === 'current'}
				class:bg-court-charcoal={scheduleType !== 'current'}
				class:border={scheduleType !== 'current'}
				class:border-gray-700={scheduleType !== 'current'}
			>
				Current ({data.schedules.current.length})
			</button>
			<button
				onclick={() => (scheduleType = 'work')}
				class="px-4 py-2 rounded transition-colors"
				class:bg-court-gold={scheduleType === 'work'}
				class:text-court-dark={scheduleType === 'work'}
				class:bg-court-charcoal={scheduleType !== 'work'}
				class:border={scheduleType !== 'work'}
				class:border-gray-700={scheduleType !== 'work'}
			>
				Work Assignments ({data.schedules.work.length})
			</button>
			<button
				onclick={() => (scheduleType = 'future')}
				class="px-4 py-2 rounded transition-colors"
				class:bg-court-gold={scheduleType === 'future'}
				class:text-court-dark={scheduleType === 'future'}
				class:bg-court-charcoal={scheduleType !== 'future'}
				class:border={scheduleType !== 'future'}
				class:border-gray-700={scheduleType !== 'future'}
			>
				Future ({data.schedules.future.length})
			</button>
			<button
				onclick={() => (scheduleType = 'past')}
				class="px-4 py-2 rounded transition-colors"
				class:bg-court-gold={scheduleType === 'past'}
				class:text-court-dark={scheduleType === 'past'}
				class:bg-court-charcoal={scheduleType !== 'past'}
				class:border={scheduleType !== 'past'}
				class:border-gray-700={scheduleType !== 'past'}
			>
				Past ({data.schedules.past.length})
			</button>
		</div>

		<!-- Matches -->
		{#if timeBlocks.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400">No {scheduleType} matches</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each timeBlocks as block (block.time)}
					<TimeBlock {block} conflicts={new Set()} showCoverageToggle={false} />
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Pool Standings Tab -->
	{#if activeTab === 'pool' && data.poolSheet}
		<div class="bg-court-charcoal border border-gray-700 rounded-lg overflow-hidden">
			<table class="w-full">
				<thead class="bg-court-dark">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium">Rank</th>
						<th class="px-4 py-3 text-left text-sm font-medium">Team</th>
						<th class="px-4 py-3 text-center text-sm font-medium">W</th>
						<th class="px-4 py-3 text-center text-sm font-medium">L</th>
						<th class="px-4 py-3 text-center text-sm font-medium">Sets</th>
						<th class="px-4 py-3 text-center text-sm font-medium">Pts</th>
					</tr>
				</thead>
				<tbody>
					{#each data.poolSheet.Pool.Teams as team (team.TeamId)}
						<tr
							class="border-t border-gray-800"
							class:bg-court-gold={team.TeamId === data.teamId}
							class:bg-opacity-10={team.TeamId === data.teamId}
						>
							<td class="px-4 py-3">{team.FinishRank || '-'}</td>
							<td class="px-4 py-3 font-medium">{team.TeamName}</td>
							<td class="px-4 py-3 text-center">{team.MatchesWon}</td>
							<td class="px-4 py-3 text-center">{team.MatchesLost}</td>
							<td class="px-4 py-3 text-center">{team.SetsWon}-{team.SetsLost}</td>
							<td class="px-4 py-3 text-center">{team.PointRatio.toFixed(2)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Roster Tab -->
	{#if activeTab === 'roster'}
		<div class="bg-court-charcoal border border-gray-700 rounded-lg p-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each data.roster as player}
					<div class="flex justify-between items-center p-3 bg-court-dark rounded">
						<span class="font-medium">{player.FullName}</span>
						<span class="text-gray-400 text-sm">{player.RoleOrJersey}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
