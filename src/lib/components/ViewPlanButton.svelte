<script lang="ts">
	export let selectedCount: number;
	export let onClick: () => void;
</script>

{#if selectedCount > 0}
	<button
		type="button"
		onclick={onClick}
		class="fixed bottom-16 left-0 right-0 mx-4 px-4 py-3 bg-brand-500 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 z-40 min-h-[44px] flex items-center justify-center gap-2"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
		aria-label={`View plan with ${selectedCount} ${selectedCount === 1 ? 'match' : 'matches'}`}
	>
		<span>View Plan ({selectedCount})</span>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</button>
{/if}

