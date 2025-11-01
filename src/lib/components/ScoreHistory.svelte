<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getScoreHistory, type ScoreHistoryEntry } from '$lib/utils/scoreStats';
	
	export let matchId: number;
	
	let history: ScoreHistoryEntry[] = [];
	let intervalId: ReturnType<typeof setInterval> | null = null;
	
	function loadHistory() {
		history = getScoreHistory(matchId);
	}
	
	onMount(() => {
		loadHistory();
		intervalId = setInterval(loadHistory, 5000);
	});
	
	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});
</script>

{#if history.length === 0}
	<div class="text-center py-8 text-charcoal-300 text-sm">
		No score history available
	</div>
{:else}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-charcoal-50 mb-3">Score History</h3>
		<div class="space-y-2 max-h-64 overflow-y-auto">
			{#each history.slice().reverse() as entry, index}
				{@const completedSets = entry.sets.filter(s => s.completedAt > 0)}
				{@const team1SetsWon = completedSets.filter(s => s.team1Score > s.team2Score).length}
				{@const team2SetsWon = completedSets.filter(s => s.team2Score > s.team1Score).length}
				{@const currentSet = entry.sets.find(s => s.completedAt === 0) || entry.sets[entry.sets.length - 1]}
				
				<div class="px-3 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 text-xs">
					<div class="flex items-center justify-between mb-1">
						<div class="text-charcoal-300">
							{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
						</div>
						<div class="px-2 py-0.5 rounded text-[10px] font-medium {entry.status === 'completed' ? 'bg-green-500/20 text-green-400' : entry.status === 'in-progress' ? 'bg-gold-500/20 text-[#facc15]' : 'bg-charcoal-700 text-charcoal-300'}">
							{entry.status}
						</div>
					</div>
					
					{#if completedSets.length > 0}
						<div class="text-charcoal-200 mb-1">
							Sets: {team1SetsWon}-{team2SetsWon}
						</div>
					{/if}
					
					<div class="text-charcoal-50 font-semibold">
						Current: {currentSet.team1Score}-{currentSet.team2Score}
					</div>
					
					<div class="text-[10px] text-charcoal-400 mt-1">
						Updated by {entry.updatedBy}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

