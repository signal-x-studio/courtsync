<!-- Reference: https://svelte.dev/docs/svelte/$state -->
<!-- Reference: https://svelte.dev/docs/kit/goto -->
<!-- Purpose: Club selection page - entry point for users to select event and club -->
<!-- Note: Loads event info and team assignments, stores event ID, navigates to club hub -->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchEventInfo } from '$lib/services/aes';
	import { eventId as eventIdStore, clubId as clubIdStore } from '$lib/stores/event';
	import type { EventInfo } from '$lib/types/aes';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';

	let eventId = $state('');
	let selectedClubId = $state<number | null>(null);
	let loading = $state(false);
	let error = $state('');
	let eventInfo = $state<EventInfo | null>(null);
	let clubs = $state<Array<{ ClubId: number; Name: string }>>([]);

	async function loadEvent() {
		if (!eventId.trim()) {
			error = 'Please enter an event ID';
			return;
		}

		loading = true;
		error = '';
		eventInfo = null;
		clubs = [];

		try {
			// Load event info (includes Clubs array)
			const info = await fetchEventInfo(eventId);
			eventInfo = info;

			// Extract clubs from event info
			clubs = (info.Clubs || []).sort((a, b) => a.Name.localeCompare(b.Name));

			if (clubs.length === 0) {
				error = 'No clubs found for this event';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load event';
			eventInfo = null;
			clubs = [];
		} finally {
			loading = false;
		}
	}

	function selectClub() {
		if (!selectedClubId) {
			error = 'Please select a club';
			return;
		}

		// Store event ID and club ID in stores
		eventIdStore.set(eventId);
		clubIdStore.set(selectedClubId);

		// Navigate to club hub
		goto(`/club/${eventId}?clubId=${selectedClubId}`);
	}
</script>

<div class="max-w-2xl mx-auto p-4">
	<div class="mb-8">
		<h2 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">Welcome to CourtSync</h2>
		<p class="text-muted">Enter your event ID to get started</p>
	</div>

	<ErrorBoundary {error} retry={() => (error = '')}>
		<div class="space-y-6">
			<!-- Event ID Input -->
			<div>
				<label for="event-id" class="block text-sm font-medium mb-2">Event ID</label>
				<div class="flex gap-2">
					<input
						id="event-id"
						type="text"
						bind:value={eventId}
						placeholder="e.g., 2024-nationals"
						class="input flex-1"
						disabled={loading}
					/>
					<button
						onclick={loadEvent}
						disabled={loading || !eventId.trim()}
						class="btn btn-primary"
					>
						{loading ? 'Loading...' : 'Load Event'}
					</button>
				</div>
			</div>

			{#if eventInfo}
				<div class="card">
					<h3 class="text-xl font-semibold text-primary-600 dark:text-primary-400 mb-2">{eventInfo.Name}</h3>
					{#if eventInfo.Location}
						<p class="text-muted text-sm">{eventInfo.Location}</p>
					{/if}
				</div>
			{/if}

			{#if clubs.length > 0}
				<div>
					<label for="club-select" class="block text-sm font-medium mb-2"
						>Select Your Club</label
					>
					<select
						id="club-select"
						bind:value={selectedClubId}
						class="select"
					>
						<option value={null}>Choose a club...</option>
						{#each clubs as club (club.ClubId)}
							<option value={club.ClubId}>{club.Name}</option>
						{/each}
					</select>
				</div>

				<button
					onclick={selectClub}
					disabled={!selectedClubId}
					class="btn btn-primary w-full btn-lg"
				>
					Continue to Schedule
				</button>
			{/if}
		</div>
	</ErrorBoundary>
</div>
