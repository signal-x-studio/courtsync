<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { MatchScore, SetScore } from '$lib/types';
	import ScoreHistory from '$lib/components/ScoreHistory.svelte';
	
	export let matchId: number;
	export let team1Name: string;
	export let team2Name: string;
	export let currentScore: MatchScore | null;
	export let onScoreUpdate: (sets: SetScore[], status: 'not-started' | 'in-progress' | 'completed') => void;
	export let onClose: () => void;
	
	// Score validation constants
	const MIN_SET_SCORE = 0;
	const MAX_SET_SCORE = 50;
	const WINNING_SCORE = 25;
	const MIN_POINT_DIFFERENCE = 2;
	
	function validateSetScore(team1Score: number, team2Score: number): { valid: boolean; warning?: string } {
		if (team1Score < MIN_SET_SCORE || team1Score > MAX_SET_SCORE) {
			return { valid: false, warning: `Score must be between ${MIN_SET_SCORE} and ${MAX_SET_SCORE}` };
		}
		if (team2Score < MIN_SET_SCORE || team2Score > MAX_SET_SCORE) {
			return { valid: false, warning: `Score must be between ${MIN_SET_SCORE} and ${MAX_SET_SCORE}` };
		}

		const maxScore = Math.max(team1Score, team2Score);
		const minScore = Math.min(team1Score, team2Score);
		
		if (maxScore >= WINNING_SCORE) {
			if (maxScore - minScore < MIN_POINT_DIFFERENCE) {
				return { 
					valid: true, 
					warning: `Set requires winning by at least ${MIN_POINT_DIFFERENCE} points. Current: ${maxScore - minScore}` 
				};
			}
			
			if (maxScore > WINNING_SCORE + 5) {
				return { 
					valid: true, 
					warning: `High score (${maxScore}). Verify this is correct.` 
				};
			}
		}

		return { valid: true };
	}
	
	let sets: SetScore[] = currentScore?.sets || [];
	let status: 'not-started' | 'in-progress' | 'completed' = currentScore?.status || 'not-started';
	let validationWarning: string | null = null;
	let isSaving = false;
	let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
	
	// Initialize sets if not started
	$: if (sets.length === 0 && status === 'not-started') {
		sets = [{
			setNumber: 1,
			team1Score: 0,
			team2Score: 0,
			completedAt: 0,
		}];
	}
	
	$: currentSet = sets.find(s => s.completedAt === 0) || sets[sets.length - 1];
	$: completedSets = sets.filter(s => s.completedAt > 0);
	
	function handleStartMatch() {
		const newStatus = 'in-progress';
		status = newStatus;
		
		if (sets.length === 0) {
			sets = [{
				setNumber: 1,
				team1Score: 0,
				team2Score: 0,
				completedAt: 0,
			}];
		}
		
		isSaving = true;
		onScoreUpdate(sets, newStatus);
		setTimeout(() => isSaving = false, 500);
	}
	
	function handleAddSet() {
		const nextSetNumber = sets.length + 1;
		sets = [...sets, {
			setNumber: nextSetNumber,
			team1Score: 0,
			team2Score: 0,
			completedAt: 0,
		}];
	}
	
	function handleUpdateSetScore(setNumber: number, team1: number, team2: number) {
		const validation = validateSetScore(team1, team2);
		validationWarning = validation.warning || null;
		
		if (!validation.valid) {
			return;
		}
		
		sets = sets.map(set => 
			set.setNumber === setNumber
				? { ...set, team1Score: team1, team2Score: team2 }
				: set
		);
		
		if (status === 'in-progress') {
			if (saveTimeoutId) {
				clearTimeout(saveTimeoutId);
			}
			saveTimeoutId = setTimeout(() => {
				isSaving = true;
				onScoreUpdate(sets, status);
				setTimeout(() => isSaving = false, 300);
			}, 1000);
		}
	}
	
	function handleCompleteSet(setNumber: number) {
		sets = sets.map(set => 
			set.setNumber === setNumber
				? { ...set, completedAt: Date.now() }
				: set
		);
		
		if (status === 'in-progress') {
			isSaving = true;
			onScoreUpdate(sets, status);
			setTimeout(() => isSaving = false, 500);
		}
	}
	
	function handleCompleteMatch() {
		status = 'completed';
		onScoreUpdate(sets, 'completed');
	}
	
	function handleSave() {
		isSaving = true;
		onScoreUpdate(sets, status);
		setTimeout(() => isSaving = false, 500);
	}
	
	onDestroy(() => {
		if (saveTimeoutId) {
			clearTimeout(saveTimeoutId);
		}
	});
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
	<div class="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="sticky top-0 bg-[#3b3c48] border-b border-[#454654] px-4 py-3 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold text-[#f8f8f9]">Scorekeeper</h2>
				<p class="text-sm text-[#9fa2ab]">{team1Name} vs {team2Name}</p>
			</div>
			<button
				onclick={onClose}
				class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
				aria-label="Close scorekeeper"
			>
				✕
			</button>
		</div>

		<!-- Content -->
		<div class="p-4 space-y-4">
			<!-- Status -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Status:</span>
				<select
					bind:value={status}
					class="px-3 py-1 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
				>
					<option value="not-started">Not Started</option>
					<option value="in-progress">In Progress</option>
					<option value="completed">Completed</option>
				</select>
			</div>

			<!-- Start Match Button -->
			{#if status === 'not-started'}
				<button
					onclick={handleStartMatch}
					class="w-full px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
				>
					Start Match
				</button>
			{/if}

			<!-- Validation Warning -->
			{#if validationWarning}
				<div class="px-4 py-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-sm">
					⚠️ {validationWarning}
				</div>
			{/if}

			<!-- Current Set Score -->
			{#if status === 'in-progress' && currentSet}
				<div class="bg-[#454654] rounded-lg border border-[#525463] p-4">
					<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">
						Set {currentSet.setNumber}
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="text-center">
							<div class="text-xs text-[#9fa2ab] mb-1">{team1Name}</div>
							<div class="flex items-center justify-center gap-2">
								<button
									onclick={() => {
										const newScore = Math.max(0, currentSet.team1Score - 1);
										handleUpdateSetScore(currentSet.setNumber, newScore, currentSet.team2Score);
									}}
									class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
								>
									−
								</button>
								<div class="text-3xl font-bold text-[#f8f8f9] w-12 text-center">
									{currentSet.team1Score}
								</div>
								<button
									onclick={() => {
										const newScore = currentSet.team1Score + 1;
										handleUpdateSetScore(currentSet.setNumber, newScore, currentSet.team2Score);
									}}
									class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
								>
									+
								</button>
							</div>
						</div>
						<div class="text-center">
							<div class="text-xs text-[#9fa2ab] mb-1">{team2Name}</div>
							<div class="flex items-center justify-center gap-2">
								<button
									onclick={() => {
										const newScore = Math.max(0, currentSet.team2Score - 1);
										handleUpdateSetScore(currentSet.setNumber, currentSet.team1Score, newScore);
									}}
									class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
								>
									−
								</button>
								<div class="text-3xl font-bold text-[#f8f8f9] w-12 text-center">
									{currentSet.team2Score}
								</div>
								<button
									onclick={() => {
										const newScore = currentSet.team2Score + 1;
										handleUpdateSetScore(currentSet.setNumber, currentSet.team1Score, newScore);
									}}
									class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold"
								>
									+
								</button>
							</div>
						</div>
					</div>
					<div class="flex gap-2 mt-4">
						<button
							onclick={() => handleCompleteSet(currentSet.setNumber)}
							class="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors"
						>
							Complete Set
						</button>
						{#if sets.length < 5}
							<button
								onclick={handleAddSet}
								class="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors"
							>
								Add Set
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Completed Sets -->
			{#if completedSets.length > 0}
				<div>
					<div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">Completed Sets</div>
					<div class="space-y-2">
						{#each completedSets as set}
							<div class="flex items-center justify-between px-3 py-2 bg-[#454654] rounded border border-[#525463]">
								<span class="text-sm text-[#9fa2ab]">Set {set.setNumber}</span>
								<div class="flex items-center gap-4">
									<span class="text-sm font-medium text-[#f8f8f9]">{team1Name}: {set.team1Score}</span>
									<span class="text-sm text-[#9fa2ab]">vs</span>
									<span class="text-sm font-medium text-[#f8f8f9]">{team2Name}: {set.team2Score}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Complete Match -->
			{#if status === 'in-progress' && completedSets.length > 0}
				<button
					onclick={handleCompleteMatch}
					class="w-full px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
				>
					Complete Match
				</button>
			{/if}

			<!-- Save Button -->
			<button
				onclick={handleSave}
				disabled={isSaving}
				class="w-full px-4 py-2 text-sm font-medium rounded transition-colors border {isSaving ? 'bg-[#525463] text-[#9fa2ab] cursor-not-allowed' : 'bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border-[#525463]'}"
			>
				{isSaving ? 'Saving...' : 'Save Score'}
			</button>
			
			<!-- Auto-save indicator -->
			{#if status === 'in-progress'}
				<div class="text-xs text-[#9fa2ab] text-center">
					{isSaving ? '💾 Saving...' : '✓ Auto-save enabled'}
				</div>
			{/if}

			<!-- Score History -->
			{#if currentScore}
				<div class="border-t border-[#454654] pt-4">
					<ScoreHistory {matchId} />
				</div>
			{/if}
		</div>
	</div>
</div>

