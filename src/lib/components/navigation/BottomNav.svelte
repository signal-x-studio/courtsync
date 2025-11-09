<!-- Reference: https://svelte.dev/docs/kit/$app-stores -->
<!-- Reference: https://svelte.dev/docs/svelte/$derived -->
<!-- Purpose: Bottom navigation bar with persona-based routes -->
<!-- Note: Shows coverage link only for media persona -->

<script lang="ts">
	import { page } from '$app/stores';
	import { persona } from '$lib/stores/persona';
	import { filters } from '$lib/stores/filters';
	import { eventId, clubId } from '$lib/stores/event';

	let currentPath = $derived($page.url.pathname);
	let isMedia = $derived($persona === 'media');
	let hasActiveFilters = $derived(
		$filters.divisionIds.length > 0 ||
			$filters.teamIds.length > 0 ||
			$filters.showOnlyUncovered
	);
</script>

<nav
	class="fixed bottom-0 left-0 right-0 bg-(--subtle) border-t border-default md:relative md:border-0 z-50"
	aria-label="Main navigation"
>
	<div class="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
		<a
			href="/club/{$eventId}?clubId={$clubId}"
			class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
			class:text-primary-600={currentPath.includes('/club')}
			class:dark:text-primary-400={currentPath.includes('/club')}
			class:text-muted={!currentPath.includes('/club')}
			aria-label="All Matches"
			aria-current={currentPath.includes('/club') ? 'page' : undefined}
		>
			<span class="text-xl" aria-hidden="true">📋</span>
			<span class="text-xs">All Matches</span>
		</a>

		<a
			href="/my-teams?eventId={$eventId}&clubId={$clubId}"
			class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
			class:text-primary-600={currentPath.includes('/my-teams')}
			class:dark:text-primary-400={currentPath.includes('/my-teams')}
			class:text-muted={!currentPath.includes('/my-teams')}
			aria-label="My Teams"
			aria-current={currentPath.includes('/my-teams') ? 'page' : undefined}
		>
			<span class="text-xl" aria-hidden="true">⭐</span>
			<span class="text-xs">My Teams</span>
		</a>

		{#if isMedia}
			<a
				href="/coverage?eventId={$eventId}&clubId={$clubId}"
				class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
				class:text-primary-600={currentPath.includes('/coverage')}
				class:dark:text-primary-400={currentPath.includes('/coverage')}
				class:text-muted={!currentPath.includes('/coverage')}
				aria-label="Coverage Plan"
				aria-current={currentPath.includes('/coverage') ? 'page' : undefined}
			>
				<span class="text-xl" aria-hidden="true">📷</span>
				<span class="text-xs">Coverage</span>
			</a>
		{/if}

		<a
			href="/filters"
			class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px] relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
			class:text-primary-600={currentPath.includes('/filters')}
			class:dark:text-primary-400={currentPath.includes('/filters')}
			class:text-muted={!currentPath.includes('/filters')}
			aria-label="Filters{hasActiveFilters ? ' (active)' : ''}"
			aria-current={currentPath.includes('/filters') ? 'page' : undefined}
		>
			<span class="text-xl" aria-hidden="true">🔍</span>
			<span class="text-xs">Filters</span>
			{#if hasActiveFilters}
				<span
					class="absolute top-1 right-2 w-2 h-2 bg-primary-500 rounded-full"
					aria-hidden="true"
				></span>
			{/if}
		</a>

		<a
			href="/settings"
			class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
			class:text-primary-600={currentPath.includes('/settings')}
			class:dark:text-primary-400={currentPath.includes('/settings')}
			class:text-muted={!currentPath.includes('/settings')}
			aria-label="Settings"
			aria-current={currentPath.includes('/settings') ? 'page' : undefined}
		>
			<span class="text-xl" aria-hidden="true">⚙️</span>
			<span class="text-xs">Settings</span>
		</a>
	</div>
</nav>
