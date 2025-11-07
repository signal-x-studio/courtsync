<!-- Reference: https://svelte.dev/docs/svelte/svelte-motion -->
<!-- Purpose: Toast notification component for user feedback -->
<!-- Note: Displays at bottom of screen, auto-dismisses, animated entry/exit -->

<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';

	function getToastStyles(type: 'success' | 'error' | 'info') {
		switch (type) {
			case 'success':
				return 'bg-green-900/90 border-green-500 text-green-100';
			case 'error':
				return 'bg-red-900/90 border-red-500 text-red-100';
			case 'info':
			default:
				return 'bg-blue-900/90 border-blue-500 text-blue-100';
		}
	}

	function getToastIcon(type: 'success' | 'error' | 'info') {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'info':
			default:
				return 'ℹ';
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
	{#each $toast as item (item.id)}
		<div
			in:fly={{ y: 50, duration: 300 }}
			out:fly={{ y: 50, duration: 200 }}
			class="pointer-events-auto px-4 py-3 rounded-lg border-2 shadow-lg backdrop-blur-sm flex items-center gap-3 min-w-[300px] max-w-[500px] {getToastStyles(
				item.type
			)}"
			role="alert"
		>
			<span class="text-xl font-bold">{getToastIcon(item.type)}</span>
			<span class="flex-1">{item.message}</span>
			<button
				onclick={() => toast.dismiss(item.id)}
				class="text-xl hover:opacity-70 transition-opacity"
				aria-label="Dismiss"
			>
				×
			</button>
		</div>
	{/each}
</div>
