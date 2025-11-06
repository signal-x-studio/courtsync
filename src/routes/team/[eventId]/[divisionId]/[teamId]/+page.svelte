<!-- Reference: https://svelte.dev/docs/kit/routing -->
<!-- Purpose: Team detail page with schedule, pool standings, and roster -->
<!-- Note: Shows comprehensive team information for spectators and media -->

<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { aesClient } from '$lib/api/aesClient';
	import PoolStandings from '$lib/components/team/PoolStandings.svelte';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import ShareButton from '$lib/components/ui/ShareButton.svelte';
	import { formatTeamShare } from '$lib/utils/share';
	import type { PoolTeam, Play } from '$lib/types/aes';

	let eventId = $derived($page.params.eventId);
	let divisionId = $derived(Number($page.params.divisionId));
	let teamId = $derived(Number($page.params.teamId));

	let activeTab = $state<'schedule' | 'standings' | 'roster'>('standings');
	let loading = $state(true);
	let error = $state('');

	// Team info from URL or fetched data
	let teamName = $state('');
	let divisionName = $state('');

	// Pool standings data
	let poolTeams = $state<PoolTeam[]>([]);
	let poolName = $state('');

	// Roster data
	let roster = $state<Array<{ FullName: string; RoleOrJersey: string }>>([]);

	// Schedule data
	let currentMatches = $state<any[]>([]);
	let futureMatches = $state<any[]>([]);
	let pastMatches = $state<any[]>([]);

	async function loadTeamData() {
		loading = true;
		error = '';

		try {
			// Fetch division plays to get pool info
			const plays = await aesClient.getDivisionPlays(eventId, divisionId);

			// Find the pool play (Type 0 = Pool)
			const poolPlay = plays.find((play: Play) => play.Type === 0);

			if (poolPlay) {
				poolName = poolPlay.FullName;

				// Fetch pool standings
				const poolSheet = await aesClient.getPoolSheet(eventId, poolPlay.PlayId);
				poolTeams = poolSheet.Pool.Teams;

				// Get team name and division from pool data
				const currentTeam = poolTeams.find((t) => t.TeamId === teamId);
				if (currentTeam) {
					teamName = currentTeam.TeamName;
					divisionName = currentTeam.Division.Name;
				}
			}

			// Fetch roster
			roster = await aesClient.getTeamRoster(eventId, divisionId, teamId);

			// Fetch schedule (all types)
			const [current, future, past] = await Promise.all([
				aesClient.getTeamSchedule(eventId, divisionId, teamId, 'current'),
				aesClient.getTeamSchedule(eventId, divisionId, teamId, 'future'),
				aesClient.getTeamSchedule(eventId, divisionId, teamId, 'past')
			]);

			currentMatches = current;
			futureMatches = future;
			pastMatches = past;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load team data';
			console.error('Error loading team data:', err);
		} finally {
			loading = false;
		}
	}

	// Load data on mount
	$effect(() => {
		if (eventId && divisionId && teamId) {
			loadTeamData();
		}
	});
</script>

<ErrorBoundary>
	<div class="min-h-screen bg-court-dark pb-20 text-white">
		<!-- Header -->
		<div class="border-b border-gray-800 bg-court-charcoal">
			<div class="mx-auto max-w-4xl px-4 py-4">
				<button
					onclick={() => goto(-1)}
					class="mb-3 flex items-center gap-2 text-sm text-court-gold transition-colors hover:text-court-gold/80"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Back
				</button>

				{#if loading}
					<div class="h-8 w-48 animate-pulse rounded bg-gray-700"></div>
					<div class="mt-1 h-4 w-32 animate-pulse rounded bg-gray-800"></div>
				{:else}
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h1 class="text-2xl font-bold text-gray-100">{teamName || 'Team Details'}</h1>
							<div class="mt-1 flex items-center gap-2 text-sm text-gray-400">
								{#if divisionName}
									<span
										class="rounded px-2 py-0.5"
										style="background-color: {poolTeams.find((t) => t.TeamId === teamId)?.Division
											.ColorHex || '#6B7280'}; color: #111827;"
									>
										{divisionName}
									</span>
								{/if}
								{#if poolName}
									<span>•</span>
									<span>{poolName}</span>
								{/if}
							</div>
						</div>
						<div class="ml-4">
							<ShareButton
								shareData={formatTeamShare(
									teamName || 'Team',
									divisionName || '',
									currentMatches.length + futureMatches.length + pastMatches.length
								)}
								variant="ghost"
								size="sm"
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Tabs -->
		<div class="border-b border-gray-800 bg-court-charcoal">
			<div class="mx-auto max-w-4xl px-4">
				<div class="flex gap-1">
					<button
						onclick={() => (activeTab = 'standings')}
						class="border-b-2 px-4 py-3 text-sm font-medium transition-colors"
						class:border-court-gold={activeTab === 'standings'}
						class:text-court-gold={activeTab === 'standings'}
						class:border-transparent={activeTab !== 'standings'}
						class:text-gray-400={activeTab !== 'standings'}
						class:hover:text-gray-300={activeTab !== 'standings'}
					>
						Pool Standings
					</button>
					<button
						onclick={() => (activeTab = 'schedule')}
						class="border-b-2 px-4 py-3 text-sm font-medium transition-colors"
						class:border-court-gold={activeTab === 'schedule'}
						class:text-court-gold={activeTab === 'schedule'}
						class:border-transparent={activeTab !== 'schedule'}
						class:text-gray-400={activeTab !== 'schedule'}
						class:hover:text-gray-300={activeTab !== 'schedule'}
					>
						Schedule
					</button>
					<button
						onclick={() => (activeTab = 'roster')}
						class="border-b-2 px-4 py-3 text-sm font-medium transition-colors"
						class:border-court-gold={activeTab === 'roster'}
						class:text-court-gold={activeTab === 'roster'}
						class:border-transparent={activeTab !== 'roster'}
						class:text-gray-400={activeTab !== 'roster'}
						class:hover:text-gray-300={activeTab !== 'roster'}
					>
						Roster
					</button>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="mx-auto max-w-4xl px-4 py-6">
			{#if error}
				<div class="rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
					<p class="font-medium">Error loading team data</p>
					<p class="mt-1">{error}</p>
					<button
						onclick={loadTeamData}
						class="mt-3 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
					>
						Retry
					</button>
				</div>
			{:else if activeTab === 'standings'}
				<div class="rounded-lg bg-court-charcoal p-4">
					<h2 class="mb-4 text-lg font-semibold text-gray-100">
						{poolName || 'Pool Standings'}
					</h2>
					<PoolStandings teams={poolTeams} highlightTeamId={teamId} {loading} />
				</div>
			{:else if activeTab === 'schedule'}
				<div class="space-y-4">
					{#if loading}
						<div class="flex justify-center py-12">
							<div class="h-8 w-8 animate-spin rounded-full border-4 border-court-gold border-t-transparent"></div>
						</div>
					{:else}
						<!-- Current Matches -->
						{#if currentMatches.length > 0}
							<div class="rounded-lg bg-court-charcoal p-4">
								<h3 class="mb-3 text-sm font-semibold uppercase text-gray-400">Current</h3>
								<p class="text-sm text-gray-500">Schedule display coming soon</p>
							</div>
						{/if}

						<!-- Future Matches -->
						{#if futureMatches.length > 0}
							<div class="rounded-lg bg-court-charcoal p-4">
								<h3 class="mb-3 text-sm font-semibold uppercase text-gray-400">Upcoming</h3>
								<p class="text-sm text-gray-500">Schedule display coming soon</p>
							</div>
						{/if}

						<!-- Past Matches -->
						{#if pastMatches.length > 0}
							<div class="rounded-lg bg-court-charcoal p-4">
								<h3 class="mb-3 text-sm font-semibold uppercase text-gray-400">Past</h3>
								<p class="text-sm text-gray-500">Schedule display coming soon</p>
							</div>
						{/if}

						{#if currentMatches.length === 0 && futureMatches.length === 0 && pastMatches.length === 0}
							<div class="rounded-lg bg-court-charcoal p-8 text-center text-gray-400">
								No scheduled matches found
							</div>
						{/if}
					{/if}
				</div>
			{:else if activeTab === 'roster'}
				<div class="rounded-lg bg-court-charcoal p-4">
					<h2 class="mb-4 text-lg font-semibold text-gray-100">Roster</h2>
					{#if loading}
						<div class="flex justify-center py-8">
							<div class="h-8 w-8 animate-spin rounded-full border-4 border-court-gold border-t-transparent"></div>
						</div>
					{:else if roster.length === 0}
						<p class="text-center text-sm text-gray-400">No roster information available</p>
					{:else}
						<div class="space-y-2">
							{#each roster as player}
								<div class="flex items-center justify-between border-b border-gray-800 py-3 last:border-0">
									<span class="text-gray-100">{player.FullName}</span>
									<span class="text-sm text-gray-400">{player.RoleOrJersey}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</ErrorBoundary>
