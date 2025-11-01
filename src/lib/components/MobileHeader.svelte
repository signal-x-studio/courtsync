<script lang="ts">
	import { formatMatchDate } from '$lib/utils/dateUtils';
	
	export let eventName: string | null = null;
	export let matchCount: number = 0;
	export let conflictCount: number = 0;
	// Removed collapsed/onToggle props - mobile header is always visible and simple
</script>

<header
	class="sticky top-0 z-40 border-b border-charcoal-700 bg-charcoal-950"
	style="backdrop-filter: blur(10px); background-color: rgba(24, 24, 27, 0.95);"
>
	<div class="px-4 py-3">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-2 min-w-0 flex-1">
				<h1 class="text-base font-semibold truncate text-charcoal-50">
					{eventName || '630 Volleyball'}
				</h1>
				{#if matchCount > 0}
					<span class="text-xs whitespace-nowrap text-charcoal-300">
						{matchCount}
						{#if conflictCount > 0}
							<span class="ml-1 text-warning-500">• {conflictCount}</span>
						{/if}
					</span>
				{/if}
			</div>
		</div>
	</div>
</header>

