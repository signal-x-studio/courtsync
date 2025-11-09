<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Moon, Sun } from 'lucide-svelte';

	const isDark = $derived(themeStore.isDark);
</script>

<button
	onclick={() => themeStore.toggle()}
	class="btn btn-ghost px-3 py-2"
	aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if isDark}
		<Sun class="w-5 h-5" />
	{:else}
		<Moon class="w-5 h-5" />
	{/if}
</button>
