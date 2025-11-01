<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	export let isLive: boolean;
	export let lastUpdated: number | undefined = undefined;
	export let className: string = '';
	export let source: 'ballertv' | 'manual' | undefined = undefined; // BallerTV or manual score source
	
	let hasUpdate = false;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	
	$: if (lastUpdated) {
		hasUpdate = true;
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			hasUpdate = false;
		}, 2000);
	}
	
	onDestroy(() => {
		if (timeoutId) clearTimeout(timeoutId);
	});
</script>

{#if isLive}
	<div class="flex items-center gap-1 {className}">
		<span
			class="px-1.5 py-0.5 text-[10px] font-medium rounded border transition-all {hasUpdate ? 'bg-green-500/30 text-green-300 border-green-500/50 animate-pulse' : 'bg-green-500/20 text-green-400 border-green-500/30'}"
		>
			LIVE
		</span>
		{#if source === 'ballertv'}
			<span
				class="px-1.5 py-0.5 text-[10px] font-medium rounded border bg-blue-500/20 text-blue-300 border-blue-500/30"
				title="Auto-updating from BallerTV"
			>
				BTV
			</span>
		{/if}
		{#if lastUpdated}
			<span class="text-[9px] text-[#9fa2ab] opacity-75">
				{new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
			</span>
		{/if}
	</div>
{/if}

