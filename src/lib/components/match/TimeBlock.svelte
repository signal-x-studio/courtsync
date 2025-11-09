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
		wave?: 'am' | 'pm';
		clubTeamIds?: number[];
	}

	let { block, conflicts, showCoverageToggle = false, wave, clubTeamIds = [] }: Props = $props();

	let expanded = $state(false); // Default collapsed for cleaner overview

	// Determine colors based on wave
	let waveColors = $derived({
		border: wave === 'am' ? 'border-l-amber-500' : wave === 'pm' ? 'border-l-indigo-500' : 'border-l-court-gold',
		text: wave === 'am' ? 'text-amber-400' : wave === 'pm' ? 'text-indigo-400' : 'text-primary-600 dark:text-primary-400',
		icon: wave === 'am' ? '☀️' : wave === 'pm' ? '🌙' : ''
	});
</script>

<div class="time-block mb-4 border-l-4 {waveColors.border}" role="region" aria-label="Matches at {block.time}">
	<button
		onclick={() => (expanded = !expanded)}
		class="w-full flex justify-between items-center bg-(--subtle) p-4 rounded-tr-lg hover:bg-(--subtle) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg)"
		aria-expanded={expanded}
		aria-controls="timeblock-{block.time.replace(/[^a-zA-Z0-9]/g, '-')}"
		aria-label="{expanded ? 'Collapse' : 'Expand'} {block.matches.length} matches at {block.time}"
	>
		<div class="flex items-center gap-4">
			{#if waveColors.icon}
				<span class="text-lg" aria-hidden="true">{waveColors.icon}</span>
			{/if}
			<span class="text-lg font-semibold {waveColors.text}">{block.time}</span>
			<span class="text-sm text-(--fg)">
				{block.matches.length}
				{block.matches.length === 1 ? 'match' : 'matches'}
			</span>
		</div>
		<span
			class="text-(--fg) transition-transform duration-200"
			class:rotate-180={expanded}
			aria-hidden="true"
		>
			▼
		</span>
	</button>

	{#if expanded}
		<div id="timeblock-{block.time.replace(/[^a-zA-Z0-9]/g, '-')}" class="grid gap-3 p-4 bg-(--bg) rounded-br-lg">
			{#each block.matches as match (match.MatchId)}
				<MatchCard {match} isConflict={conflicts.has(match.MatchId)} {showCoverageToggle} {clubTeamIds} />
			{/each}
		</div>
	{/if}
</div>
