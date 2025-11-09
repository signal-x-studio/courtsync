<!-- Reference: https://svelte.dev/docs/svelte/snippet -->
<!-- Purpose: Error boundary component with retry capability -->
<!-- Note: Uses slot for content, shows error state when error prop is provided -->

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		error?: string;
		retry?: (() => void) | null;
		children?: Snippet;
	}

	let { error = '', retry = null, children }: Props = $props();
</script>

{#if error}
	<div class="bg-red-900/20 border border-error-500 rounded-lg p-6 text-center" role="alert">
		<p class="text-error-500 mb-4">{error}</p>
		{#if retry}
			<button
				onclick={retry}
				class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
			>
				Try Again
			</button>
		{/if}
	</div>
{:else}
	{@render children?.()}
{/if}
