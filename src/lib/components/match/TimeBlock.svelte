<!-- Reference: https://svelte.dev/docs/svelte/$state -->
<!-- Purpose: Collapsible time block component grouping matches by start time -->
<!-- Note: Uses Svelte 5 $state rune for expanded/collapsed state -->

<script lang="ts">
	import type { TimeBlock } from '$lib/types/app';
	import MatchCard from './MatchCard.svelte';

	interface Props {
		block: TimeBlock;
		conflicts: Set<number>;
		showCoverageToggle?: boolean;
	}

	let { block, conflicts, showCoverageToggle = false }: Props = $props();

	let expanded = $state(true); // Default expanded for better UX
</script>

<div class="time-block mb-4">
	<button
		onclick={() => (expanded = !expanded)}
		class="w-full flex justify-between items-center bg-court-charcoal p-4 rounded-t-lg hover:bg-gray-800 transition-colors"
		aria-expanded={expanded}
		aria-label="{expanded ? 'Collapse' : 'Expand'} matches at {block.time}"
	>
		<div class="flex items-center gap-4">
			<span class="text-lg font-semibold text-court-gold">{block.time}</span>
			<span class="text-sm text-gray-400">
				{block.matches.length}
				{block.matches.length === 1 ? 'match' : 'matches'}
			</span>
		</div>
		<span
			class="text-gray-400 transition-transform duration-200"
			class:rotate-180={expanded}
			aria-hidden="true"
		>
			▼
		</span>
	</button>

	{#if expanded}
		<div class="grid gap-3 p-4 bg-court-dark rounded-b-lg">
			{#each block.matches as match (match.MatchId)}
				<MatchCard {match} isConflict={conflicts.has(match.MatchId)} {showCoverageToggle} />
			{/each}
		</div>
	{/if}
</div>
