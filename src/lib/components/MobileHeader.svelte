<script lang="ts">
	import { formatMatchDate } from '$lib/utils/dateUtils';
	
	export let eventName: string | null = null;
	export let matchCount: number = 0;
	export let conflictCount: number = 0;
	export let collapsed: boolean = true;
	export let onToggle: () => void;
	
	// Scroll handling is now managed by parent component
</script>

<header
	class="sticky top-0 z-40 border-b border-charcoal-700 bg-charcoal-950 transition-all duration-300"
	class:collapsed={collapsed}
	style="backdrop-filter: blur(10px); background-color: rgba(24, 24, 27, 0.95);"
>
	<div class="px-4 py-3">
		<!-- Collapsed State -->
		<div class="flex items-center justify-between gap-2" class:hidden={!collapsed}>
			<div class="flex items-center gap-2 min-w-0 flex-1">
				<h1 class="text-base font-semibold truncate text-charcoal-50">
					630 Volleyball
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
			<button
				type="button"
				onclick={onToggle}
				class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900 hover:bg-charcoal-800 min-h-[44px]"
				aria-label={collapsed ? 'Expand header' : 'Collapse header'}
			>
				<span class="text-lg">{collapsed ? '▼' : '▲'}</span>
			</button>
		</div>
		
		<!-- Expanded State -->
		<div class="flex flex-col gap-2" class:hidden={collapsed}>
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2 min-w-0 flex-1">
					<h1 class="text-base font-semibold truncate text-charcoal-50">
						630 Volleyball Coverage
					</h1>
					{#if matchCount > 0}
						<span class="text-xs whitespace-nowrap text-charcoal-300">
							{matchCount} matches
							{#if conflictCount > 0}
								<span class="ml-2 text-warning-500">• {conflictCount} conflicts</span>
							{/if}
						</span>
					{/if}
				</div>
				<button
					type="button"
					onclick={onToggle}
					class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900 hover:bg-charcoal-800 min-h-[44px]"
					aria-label="Collapse header"
				>
					<span class="text-lg">▲</span>
				</button>
			</div>
			
			{#if eventName}
				<div class="text-xs text-charcoal-300 truncate">
					{eventName}
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	header.collapsed {
		max-height: 56px;
		overflow: hidden;
	}
	
	header:not(.collapsed) {
		max-height: 200px;
	}
</style>

