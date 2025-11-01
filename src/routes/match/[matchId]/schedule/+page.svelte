<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { FilteredMatch } from '$lib/types';
	import TeamDetailPanel from '$lib/components/TeamDetailPanel.svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	
	let { data } = $page;
	
	$: match = data.match;
	$: eventId = data.eventId;
	$: clubId = data.clubId;
	$: matches = data.matches || [];
	
	function handleBack() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Match Schedule - {match ? `Match ${match.MatchId}` : 'Not Found'}</title>
</svelte:head>

{#if !match}
	<div class="min-h-screen bg-charcoal-950 text-charcoal-50 flex items-center justify-center p-4">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">Match Not Found</h1>
			<p class="text-charcoal-400 mb-6">The requested match could not be found.</p>
			<button
				type="button"
				onclick={handleBack}
				class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400 transition-colors min-h-[44px]"
			>
				Back to Matches
			</button>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-charcoal-950">
		<!-- Mobile Header -->
		<div class="lg:hidden">
			<MobileHeader />
		</div>
		
		<!-- Desktop Header -->
		<header class="hidden lg:block sticky top-0 z-40 bg-charcoal-950 border-b border-charcoal-700 px-6 py-4">
			<div class="flex items-center justify-between">
				<h1 class="text-xl font-semibold text-charcoal-50">Match Schedule</h1>
				<button
					type="button"
					onclick={handleBack}
					class="px-4 py-2 text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-800 rounded-lg transition-colors"
					aria-label="Back to matches"
				>
					Back
				</button>
			</div>
		</header>
		
		<!-- Content -->
		<main class="pb-8" style="padding-bottom: max(2rem, env(safe-area-inset-bottom));">
			<TeamDetailPanel
				{match}
				{eventId}
				{clubId}
				{matches}
			/>
		</main>
	</div>
{/if}

