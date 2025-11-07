<!-- Reference: https://svelte.dev/docs/kit/load -->
<!-- Reference: https://svelte.dev/docs/kit/layouts -->
<!-- Purpose: Root layout with dark mode, app.css import, and global structure -->
<!-- Note: BottomNav is included here for consistent navigation across all pages -->

<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import BottomNav from '$lib/components/navigation/BottomNav.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>CourtSync - Volleyball Tournament Hub</title>
	<meta name="description" content="Real-time volleyball tournament schedules and coverage" />
</svelte:head>

<div class="h-screen bg-court-dark text-white flex flex-col overflow-hidden">
	<header class="bg-court-charcoal border-b border-gray-800 p-4 flex-shrink-0">
		<div class="max-w-screen-xl mx-auto">
			<a
				href="/"
				class="text-2xl font-bold text-court-gold hover:text-court-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-gold focus-visible:ring-offset-2 focus-visible:ring-offset-court-charcoal rounded inline-block"
				aria-label="Return to home page"
			>
				<h1>CourtSync</h1>
			</a>
		</div>
	</header>

	<main class="flex-1 overflow-y-auto pb-20 md:pb-4">
		{@render children()}
	</main>

	<BottomNav />
	<Toast />
</div>
