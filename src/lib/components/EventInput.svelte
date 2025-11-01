<script lang="ts">
	import { tournamentDelay } from '$lib/stores/tournamentDelay';
	import { onMount } from 'svelte';
	
	export let eventId: string;
	export let date: string;
	export let timeWindow: number;
	export let onLoad: (eventId: string, date: string, timeWindow: number) => Promise<void>;
	export let loading: boolean = false;
	export let onClose: (() => void) | undefined = undefined;

	let localEventId = eventId;
	let localDate = date;
	let localTimeWindow = timeWindow;
	let localDelay = $tournamentDelay;
	let delayJustChanged = false;

	// Generate delay options (0-120 minutes in 15min increments)
	const delayOptions = Array.from({ length: 9 }, (_, i) => i * 15);

	// Sync from props when they change
	$: {
		if (eventId !== localEventId) localEventId = eventId;
		if (date !== localDate) localDate = date;
		if (timeWindow !== localTimeWindow) localTimeWindow = timeWindow;
	}

	// Sync delay from store when component mounts or store changes externally
	onMount(() => {
		localDelay = $tournamentDelay;
		
		// Subscribe to store changes (only sync if user hasn't manually changed localDelay)
		const unsubscribe = tournamentDelay.subscribe(value => {
			// Only sync if the value actually changed and we're not in the middle of user input
			if (value !== localDelay && !delayJustChanged) {
				localDelay = value;
			}
		});
		
		return unsubscribe;
	});

	// Handle delay change from user input
	function handleDelayChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newDelay = parseInt(target.value, 10);
		localDelay = newDelay;
		
		// Update store immediately
		tournamentDelay.set(newDelay);
		delayJustChanged = true;
		setTimeout(() => {
			delayJustChanged = false;
		}, 2000);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		await onLoad(localEventId, localDate, localTimeWindow);
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}
</script>

<form data-event-input onsubmit={handleSubmit} class="space-y-3 sm:space-y-4">
	<!-- Header with Close Button (Mobile) -->
	<div class="flex items-center justify-between mb-2 sm:hidden">
		<h2 class="text-lg font-semibold text-charcoal-50">Event Settings</h2>
		<button
			type="button"
			onclick={handleClose}
			class="p-2 text-charcoal-400 hover:text-charcoal-50 transition-colors rounded-lg hover:bg-charcoal-700"
			aria-label="Close settings"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

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
		<div class="flex items-center justify-between mb-1 sm:mb-1.5">
			<label for="tournamentDelay" class="block text-xs text-charcoal-300">
				Tournament Delay Offset
			</label>
			{#if delayJustChanged}
				<span class="text-xs text-gold-400 font-medium animate-pulse">Applied</span>
			{/if}
		</div>
		<select
			id="tournamentDelay"
			value={localDelay}
			onchange={handleDelayChange}
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
			Adjust for schedules running behind. Past time groups will be dimmed. <span class="text-gold-400 font-medium">Applied automatically.</span>
		</p>
	</div>

	<!-- Close Button (Desktop) -->
	<div class="hidden sm:flex items-end">
		<button
			type="button"
			onclick={handleClose}
			class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px] sm:min-h-[44px] text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-700"
			aria-label="Close settings"
		>
			Done
		</button>
	</div>
</form>

