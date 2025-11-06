<!-- Reference: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine -->
<!-- Purpose: Offline indicator to show connection status -->
<!-- Note: Warns users when viewing cached/stale data -->

<script lang="ts">
	import { onMount } from 'svelte';

	let isOnline = $state(true);

	onMount(() => {
		// Set initial state
		isOnline = navigator.onLine;

		// Listen for online/offline events
		const handleOnline = () => {
			isOnline = true;
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

{#if !isOnline}
	<div
		class="fixed left-0 right-0 top-0 z-50 bg-yellow-900/90 px-4 py-2 text-center text-sm font-medium text-yellow-100"
		role="alert"
		aria-live="polite"
	>
		<div class="flex items-center justify-center gap-2">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
				/>
			</svg>
			<span>You're offline. Viewing cached data.</span>
		</div>
	</div>
{/if}
