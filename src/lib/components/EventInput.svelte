<script lang="ts">
	import { tournamentDelay } from '$lib/stores/tournamentDelay';
	
	export let eventId: string;
	export let date: string;
	export let timeWindow: number;
	export let onLoad: (eventId: string, date: string, timeWindow: number) => Promise<void>;
	export let loading: boolean = false;

	let localEventId = eventId;
	let localDate = date;
	let localTimeWindow = timeWindow;
	let localDelay = $tournamentDelay;

	// Generate delay options (0-120 minutes in 15min increments)
	const delayOptions = Array.from({ length: 9 }, (_, i) => i * 15);

	$: {
		if (eventId !== localEventId) localEventId = eventId;
		if (date !== localDate) localDate = date;
		if (timeWindow !== localTimeWindow) localTimeWindow = timeWindow;
		if ($tournamentDelay !== localDelay) localDelay = $tournamentDelay;
	}

	$: tournamentDelay.set(localDelay);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		await onLoad(localEventId, localDate, localTimeWindow);
	}
</script>

<form data-event-input on:submit={handleSubmit} class="space-y-3 sm:space-y-4">
	<!-- Mobile: Horizontal Compact Layout -->
	<div class="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:gap-4">
		<div class="flex-1 min-w-0">
			<label for="eventId" class="block text-xs text-charcoal-300 mb-1 sm:mb-1.5">Event ID</label>
			<input
				id="eventId"
				type="text"
				bind:value={localEventId}
				disabled={loading}
				class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[40px] sm:min-h-[44px] focus:border-gold-500 focus:outline-none"
				style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
				placeholder="Event ID"
			/>
		</div>

		<div class="flex-1 sm:min-w-[140px]">
			<label for="date" class="block text-xs text-charcoal-300 mb-1 sm:mb-1.5">Date</label>
			<input
				id="date"
				type="date"
				bind:value={localDate}
				disabled={loading}
				class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[40px] sm:min-h-[44px] focus:border-gold-500 focus:outline-none"
				style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
			/>
		</div>

		<div class="flex-1 sm:min-w-[100px]">
			<label for="timeWindow" class="block text-xs text-charcoal-300 mb-1 sm:mb-1.5">Window</label>
			<input
				id="timeWindow"
				type="number"
				bind:value={localTimeWindow}
				disabled={loading}
				min="1"
				class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[40px] sm:min-h-[44px] focus:border-gold-500 focus:outline-none"
				style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
				placeholder="Mins"
			/>
		</div>

		<div class="flex items-end">
			<button
				type="submit"
				disabled={loading}
				class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px] sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
				style="background-color: {loading ? '#ca8a04' : '#eab308'}; color: #18181b;"
			>
				{loading ? 'Loading...' : 'Load'}
			</button>
		</div>
	</div>
	
	<!-- Tournament Delay Offset -->
	<div class="flex-1 min-w-0">
		<label for="tournamentDelay" class="block text-xs text-charcoal-300 mb-1 sm:mb-1.5">
			Tournament Delay Offset
		</label>
		<select
			id="tournamentDelay"
			bind:value={localDelay}
			disabled={loading}
			class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[40px] sm:min-h-[44px] focus:border-gold-500 focus:outline-none"
			style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
		>
			{#each delayOptions as delay}
				<option value={delay}>
					{delay === 0 ? 'No delay' : delay === 60 ? '1 hour' : delay === 120 ? '2 hours' : `${delay} mins`}
				</option>
			{/each}
		</select>
		<p class="text-xs text-charcoal-400 mt-1">
			Adjust for schedules running behind. Past time groups will be dimmed.
		</p>
	</div>
</form>

