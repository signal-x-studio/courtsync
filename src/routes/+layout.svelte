<script lang="ts">
	import { onMount } from 'svelte';
</script>

<main>
	<!-- Content will be inserted here -->
	<slot />
</main>

<style>
	main {
		min-height: 100vh;
		background-color: #18181b;
	}
</style>

