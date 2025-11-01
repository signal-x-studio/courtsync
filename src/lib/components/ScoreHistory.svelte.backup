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
	<div class="text-center py-8 text-[#9fa2ab] text-sm">
		No score history available
	</div>
{:else}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-[#f8f8f9] mb-3">Score History</h3>
		<div class="space-y-2 max-h-64 overflow-y-auto">
			{#each history.slice().reverse() as entry, index}
				{@const completedSets = entry.sets.filter(s => s.completedAt > 0)}
				{@const team1SetsWon = completedSets.filter(s => s.team1Score > s.team2Score).length}
				{@const team2SetsWon = completedSets.filter(s => s.team2Score > s.team1Score).length}
				{@const currentSet = entry.sets.find(s => s.completedAt === 0) || entry.sets[entry.sets.length - 1]}
				
				<div class="px-3 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] text-xs">
					<div class="flex items-center justify-between mb-1">
						<div class="text-[#9fa2ab]">
							{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
						</div>
						<div class="px-2 py-0.5 rounded text-[10px] font-medium {entry.status === 'completed' ? 'bg-green-500/20 text-green-400' : entry.status === 'in-progress' ? 'bg-[#eab308]/20 text-[#facc15]' : 'bg-[#454654] text-[#9fa2ab]'}">
							{entry.status}
						</div>
					</div>
					
					{#if completedSets.length > 0}
						<div class="text-[#c0c2c8] mb-1">
							Sets: {team1SetsWon}-{team2SetsWon}
						</div>
					{/if}
					
					<div class="text-[#f8f8f9] font-semibold">
						Current: {currentSet.team1Score}-{currentSet.team2Score}
					</div>
					
					<div class="text-[10px] text-[#808593] mt-1">
						Updated by {entry.updatedBy}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

