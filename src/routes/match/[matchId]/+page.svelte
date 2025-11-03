<!-- Reference: https://svelte.dev/docs/kit/routing -->
<!-- Reference: https://svelte.dev/docs/svelte/$effect -->
<!-- Purpose: Match detail page with live scoring and real-time updates -->
<!-- Note: Handles match locking, score updates, and live subscription -->

<script lang="ts">
	import { page } from '$app/stores';
	import { aesClient } from '$lib/api/aesClient';
	import { lockMatch, unlockMatch, updateScore, getMatchScore } from '$lib/supabase/actions';
	import { liveScore } from '$lib/stores/liveScore';
	import { clientId } from '$lib/stores/clientId';
	import { eventId } from '$lib/stores/event';
	import { persona } from '$lib/stores/persona';
	import { getMatchStatus } from '$lib/utils/filterMatches';
	import { format } from 'date-fns';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import type { Match } from '$lib/types/aes';

	let matchId = $derived(Number($page.params.matchId));
	let score = liveScore(matchId);

	let loading = $state(true);
	let error = $state('');
	let match = $state<Match | null>(null);
	let isLocked = $state(false);
	let canEdit = $state(false);
	let currentSet = $state(1);

	let status = $derived(match ? getMatchStatus(match) : 'upcoming');

	async function loadMatch() {
		if (!$eventId) {
			error = 'Please select an event first';
			loading = false;
			return;
		}

		loading = true;
		error = '';

		try {
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0];
			if (!dateStr) {
				throw new Error('Invalid date format');
			}

			const schedule = await aesClient.getCourtSchedule($eventId, dateStr, 1440);
			const foundMatch = schedule.Matches.find((m) => m.MatchId === matchId);

			if (!foundMatch) {
				error = 'Match not found';
				match = null;
			} else {
				match = foundMatch;

				// Check if match is locked
				const matchScore = await getMatchScore(matchId);
				isLocked = matchScore?.locked_by !== null;
				canEdit =
					($persona === 'media' || $persona === 'spectator') &&
					(!isLocked || matchScore?.locked_by === $clientId);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load match';
			match = null;
		} finally {
			loading = false;
		}
	}

	async function handleLock() {
		if (!$eventId) {
			error = 'Event ID is required';
			return;
		}
		try {
			await lockMatch(matchId, $clientId, $eventId);
			isLocked = true;
			canEdit = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to lock match';
		}
	}

	async function handleUnlock() {
		try {
			await unlockMatch(matchId);
			isLocked = false;
			canEdit = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to unlock match';
		}
	}

	async function handleScoreUpdate(setNumber: number, team: 1 | 2, delta: number) {
		if (!canEdit) return;

		try {
			await updateScore(matchId, setNumber, team, delta, $clientId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update score';
		}
	}

	function formatTime(timestamp: number): string {
		return format(timestamp, 'EEEE, MMMM d • h:mm a');
	}

	// Load match when component mounts
	$effect(() => {
		loadMatch();
	});
</script>

<div class="max-w-4xl mx-auto p-4">
	<ErrorBoundary {error} retry={loadMatch}>
		{#if loading}
			<div class="flex justify-center py-12">
				<div class="text-gray-400">Loading match details...</div>
			</div>
		{:else if match}
			<!-- Match Header -->
			<div class="mb-6">
				<button
					onclick={() => window.history.back()}
					class="text-court-gold hover:underline mb-4 flex items-center gap-2"
				>
					← Back
				</button>
				<div class="flex items-center gap-3 mb-2">
					<div
						class="w-4 h-4 rounded-full"
						style="background-color: {match.Division.ColorHex}"
						aria-hidden="true"
					></div>
					<h3 class="text-lg text-gray-400">{match.Division.Name}</h3>
					{#if status === 'live'}
						<span class="text-red-400 font-semibold">🔴 LIVE</span>
					{/if}
				</div>
				<p class="text-gray-400">{formatTime(match.ScheduledStartDateTime)}</p>
				{#if match.CourtName}
					<p class="text-gray-400">Court: {match.CourtName}</p>
				{/if}
			</div>

			<!-- Match Teams -->
			<div class="bg-court-charcoal border border-gray-700 rounded-lg p-6 mb-6">
				<div class="text-center">
					<div class="text-2xl font-bold mb-2">{match.FirstTeamText}</div>
					<div class="text-gray-400 text-lg mb-2">vs</div>
					<div class="text-2xl font-bold">{match.SecondTeamText}</div>
				</div>
			</div>

			<!-- Live Scoring (Media/Officials only) -->
			{#if $persona === 'media'}
				<div class="bg-court-charcoal border border-gray-700 rounded-lg p-6 mb-6">
					<h3 class="text-xl font-bold mb-4">Live Scoring</h3>

					{#if !isLocked}
						<button
							onclick={handleLock}
							class="w-full px-4 py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark transition-colors"
						>
							Lock Match for Scoring
						</button>
					{:else if canEdit}
						<div class="space-y-4">
							<!-- Set Selector -->
							<div class="flex gap-2 mb-4">
								{#each [1, 2, 3, 4, 5] as setNum}
									<button
										onclick={() => (currentSet = setNum)}
										class="flex-1 px-3 py-2 rounded transition-colors"
										class:bg-court-gold={currentSet === setNum}
										class:text-court-dark={currentSet === setNum}
										class:bg-gray-700={currentSet !== setNum}
									>
										Set {setNum}
									</button>
								{/each}
							</div>

							<!-- Score Display -->
							<div class="grid grid-cols-2 gap-4">
								<!-- Team 1 -->
								<div class="text-center">
									<div class="text-sm text-gray-400 mb-2">{match.FirstTeamText}</div>
									<div class="text-4xl font-bold mb-3">
										{$score?.sets[currentSet - 1]?.team1Score || 0}
									</div>
									<div class="flex gap-2 justify-center">
										<button
											onclick={() => handleScoreUpdate(currentSet - 1, 1, -1)}
											class="px-4 py-2 bg-red-900 text-red-400 rounded hover:bg-red-800 transition-colors"
										>
											-1
										</button>
										<button
											onclick={() => handleScoreUpdate(currentSet - 1, 1, 1)}
											class="px-4 py-2 bg-green-900 text-green-400 rounded hover:bg-green-800 transition-colors"
										>
											+1
										</button>
									</div>
								</div>

								<!-- Team 2 -->
								<div class="text-center">
									<div class="text-sm text-gray-400 mb-2">{match.SecondTeamText}</div>
									<div class="text-4xl font-bold mb-3">
										{$score?.sets[currentSet - 1]?.team2Score || 0}
									</div>
									<div class="flex gap-2 justify-center">
										<button
											onclick={() => handleScoreUpdate(currentSet - 1, 2, -1)}
											class="px-4 py-2 bg-red-900 text-red-400 rounded hover:bg-red-800 transition-colors"
										>
											-1
										</button>
										<button
											onclick={() => handleScoreUpdate(currentSet - 1, 2, 1)}
											class="px-4 py-2 bg-green-900 text-green-400 rounded hover:bg-green-800 transition-colors"
										>
											+1
										</button>
									</div>
								</div>
							</div>

							<!-- Unlock Button -->
							<button
								onclick={handleUnlock}
								class="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors mt-4"
							>
								Unlock Match
							</button>
						</div>
					{:else}
						<div class="text-center text-gray-400">
							This match is currently being scored by another user.
						</div>
					{/if}
				</div>
			{/if}

			<!-- Score Display (All Users) -->
			{#if $score && $score.sets.length > 0}
				<div class="bg-court-charcoal border border-gray-700 rounded-lg p-6">
					<h3 class="text-xl font-bold mb-4">Score</h3>
					<div class="space-y-3">
						{#each $score.sets as set, idx}
							<div
								class="flex justify-between items-center p-3 bg-court-dark rounded"
							>
								<div class="text-gray-400">Set {idx + 1}</div>
								<div class="flex gap-6">
									<div
										class="font-bold"
										class:text-court-gold={set.team1Score > set.team2Score}
									>
										{set.team1Score}
									</div>
									<div class="text-gray-600">-</div>
									<div
										class="font-bold"
										class:text-court-gold={set.team2Score > set.team1Score}
									>
										{set.team2Score}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg">Match not found</p>
			</div>
		{/if}
	</ErrorBoundary>
</div>
