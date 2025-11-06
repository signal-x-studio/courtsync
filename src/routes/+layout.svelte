<!-- Reference: https://svelte.dev/docs/kit/load -->
<!-- Reference: https://svelte.dev/docs/kit/layouts -->
<!-- Purpose: Root layout with dark mode, app.css import, and global structure -->
<!-- Note: BottomNav is included here for consistent navigation across all pages -->

<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import BottomNav from '$lib/components/navigation/BottomNav.svelte';
	import InstallPrompt from '$lib/components/pwa/InstallPrompt.svelte';
	import OfflineIndicator from '$lib/components/ui/OfflineIndicator.svelte';
	import NotificationScheduler from '$lib/components/notifications/NotificationScheduler.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>CourtSync - Volleyball Tournament Hub</title>
	<meta name="description" content="Real-time volleyball tournament schedules and coverage" />
</svelte:head>

<div class="min-h-screen bg-court-dark text-white flex flex-col">
	<OfflineIndicator />

	<header class="bg-court-charcoal border-b border-gray-800 p-4">
		<div class="max-w-screen-xl mx-auto">
			<h1 class="text-2xl font-bold text-court-gold">CourtSync</h1>
		</div>
	</header>

	<main class="flex-1 pb-20 md:pb-4">
		{@render children()}
	</main>

	<BottomNav />
	<InstallPrompt />
	<NotificationScheduler />
</div>
