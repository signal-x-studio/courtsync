<script lang="ts">
	import { Search, X, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { filters, updateFilter } from '$lib/stores/filters';

	let searchQuery = '';
	let isExpanded = false;

	$: if (searchQuery !== $filters.searchQuery) {
		searchQuery = $filters.searchQuery || '';
		// Auto-expand if there's a search query
		if (searchQuery) {
			isExpanded = true;
		}
	}

	function handleSearch(value: string) {
		searchQuery = value;
		updateFilter('searchQuery', value);
	}

	function clearSearch() {
		searchQuery = '';
		updateFilter('searchQuery', '');
	}
</script>

<div class="border-b border-charcoal-700 bg-charcoal-950 transition-all duration-200">
	<!-- Collapsed State: Search Button -->
	{#if !isExpanded}
		<button
			type="button"
			onclick={() => isExpanded = true}
			class="w-full px-4 py-2.5 flex items-center justify-between text-sm text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors min-h-[44px]"
			aria-label="Open search"
		>
			<div class="flex items-center gap-2">
				<Search size={16} class="text-charcoal-400" />
				<span class="text-charcoal-400">Search by team or court</span>
			</div>
			<ChevronDown size={16} class="text-charcoal-400" />
		</button>
	{:else}
		<!-- Expanded State: Search Input -->
		<div class="px-4 py-3">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
					<Search size={16} class="text-charcoal-400" />
				</div>
				<input
					type="text"
					value={searchQuery}
					oninput={(e) => handleSearch(e.currentTarget.value)}
					placeholder="Search by team or court"
					class="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg transition-colors min-h-[44px] bg-charcoal-800 text-charcoal-50 border border-charcoal-600 placeholder:text-charcoal-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
					aria-label="Search matches by team name or court"
					autofocus
				/>
				<div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
					{#if searchQuery}
						<button
							type="button"
							onclick={clearSearch}
							class="text-charcoal-400 hover:text-charcoal-200 transition-colors p-1"
							aria-label="Clear search"
						>
							<X size={16} />
						</button>
					{/if}
					<button
						type="button"
						onclick={() => {
							isExpanded = false;
							if (!searchQuery) {
								clearSearch();
							}
						}}
						class="text-charcoal-400 hover:text-charcoal-200 transition-colors p-1"
						aria-label="Collapse search"
					>
						<ChevronUp size={16} />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
