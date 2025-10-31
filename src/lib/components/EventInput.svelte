<script lang="ts">
	export let eventId: string;
	export let date: string;
	export let timeWindow: number;
	export let onLoad: (eventId: string, date: string, timeWindow: number) => Promise<void>;
	export let loading: boolean = false;

	let localEventId = eventId;
	let localDate = date;
	let localTimeWindow = timeWindow;

	$: {
		localEventId = eventId;
		localDate = date;
		localTimeWindow = timeWindow;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		await onLoad(localEventId, localDate, localTimeWindow);
	}
</script>

<form on:submit={handleSubmit} class="space-y-4">
	<div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
		<div class="flex-1">
			<label for="eventId" class="block text-xs text-[#9fa2ab] mb-1.5">Event ID</label>
			<input
				id="eventId"
				type="text"
				bind:value={localEventId}
				disabled={loading}
				class="w-full px-3 py-2 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0"
				style="background-color: #454654; color: #c0c2c8; border: 1px solid #525463;"
				placeholder="Enter Event ID"
			/>
		</div>

		<div class="flex-1">
			<label for="date" class="block text-xs text-[#9fa2ab] mb-1.5">Date</label>
			<input
				id="date"
				type="date"
				bind:value={localDate}
				disabled={loading}
				class="w-full px-3 py-2 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0"
				style="background-color: #454654; color: #c0c2c8; border: 1px solid #525463;"
			/>
		</div>

		<div class="flex-1">
			<label for="timeWindow" class="block text-xs text-[#9fa2ab] mb-1.5">Time Window (minutes)</label>
			<input
				id="timeWindow"
				type="number"
				bind:value={localTimeWindow}
				disabled={loading}
				min="60"
				max="1440"
				step="30"
				class="w-full px-3 py-2 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0"
				style="background-color: #454654; color: #c0c2c8; border: 1px solid #525463;"
			/>
		</div>

		<div class="flex items-end">
			<button
				type="submit"
				disabled={loading}
				class="px-4 py-2 sm:py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
				style="background-color: #eab308; color: #18181b;"
			>
				{loading ? 'Loading...' : 'Load Schedule'}
			</button>
		</div>
	</div>
</form>

