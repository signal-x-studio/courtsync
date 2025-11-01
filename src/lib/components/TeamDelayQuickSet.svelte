<script lang="ts">
	import { getTeamDelay, setTeamDelay, removeTeamDelay } from '$lib/stores/teamDelays';
	import { tournamentDelay } from '$lib/stores/tournamentDelay';
	import { formatMatchDate } from '$lib/utils/dateUtils';
	import { X } from 'lucide-svelte';
	
	export let teamId: string;
	export let teamName: string;
	export let matchStartTime: number;
	export let onClose: () => void;
	
	// Generate delay options (0-120 minutes in 15min increments)
	const delayOptions = Array.from({ length: 9 }, (_, i) => i * 15);
	
	// Get current delay for this team/date
	$: currentTeamDelay = getTeamDelay(teamId, matchStartTime);
	$: globalDelay = $tournamentDelay;
	$: selectedDelay = currentTeamDelay !== null ? currentTeamDelay : null;
	$: isUsingGlobal = selectedDelay === null;
	$: matchDate = formatMatchDate(matchStartTime);
	
	let delayJustChanged = false;
	
	function handleDelayChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value;
		
		if (value === '') {
			// Use global delay
			removeTeamDelay(teamId, matchStartTime);
			selectedDelay = null;
		} else {
			const delay = parseInt(value, 10);
			setTeamDelay(teamId, matchStartTime, delay);
			selectedDelay = delay;
		}
		
		delayJustChanged = true;
		setTimeout(() => {
			delayJustChanged = false;
		}, 2000);
	}
	
	function handleBackdropClick(event: MouseEvent | TouchEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
	onclick={handleBackdropClick}
	ontouchstart={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-labelledby="delay-modal-title"
>
	<!-- Modal -->
	<div
		class="bg-charcoal-800 rounded-lg border border-charcoal-700 shadow-xl w-full max-w-sm"
		onclick={(e) => e.stopPropagation()}
		ontouchstart={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-charcoal-700">
			<div>
				<h2 id="delay-modal-title" class="text-lg font-semibold text-charcoal-50">
					Set Delay for {teamName}
				</h2>
				<p class="text-xs text-charcoal-400 mt-0.5">{matchDate}</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="p-1 text-charcoal-400 hover:text-charcoal-50 transition-colors rounded hover:bg-charcoal-700"
				aria-label="Close"
			>
				<X size={20} />
			</button>
		</div>
		
		<!-- Content -->
		<div class="p-4 space-y-4">
			<!-- Current Status -->
			<div class="bg-charcoal-700/50 rounded-lg p-3">
				<div class="text-xs text-charcoal-300 mb-1">Current Delay</div>
				<div class="text-base font-semibold text-charcoal-50">
					{#if isUsingGlobal}
						Using global delay: {globalDelay} mins
					{:else}
						Custom delay: {selectedDelay} mins
					{/if}
				</div>
			</div>
			
			<!-- Delay Selector -->
			<div>
				<label for="delay-select" class="block text-xs text-charcoal-300 mb-2">
					Tournament Delay
				</label>
				<div class="flex items-center gap-2">
					<select
						id="delay-select"
						value={selectedDelay?.toString() || ''}
						onchange={handleDelayChange}
						class="flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] focus:border-gold-500 focus:outline-none"
						style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
					>
						<option value="">Use global ({globalDelay} mins)</option>
						{#each delayOptions as delay}
							<option value={delay}>
								{delay === 0 ? 'No delay' : delay === 60 ? '1 hour' : delay === 120 ? '2 hours' : `${delay} mins`}
							</option>
						{/each}
					</select>
					{#if delayJustChanged}
						<span class="text-xs text-gold-400 font-medium animate-pulse">Applied</span>
					{/if}
				</div>
				<p class="text-xs text-charcoal-400 mt-1">
					This delay applies to all matches for {teamName} on {matchDate}
				</p>
			</div>
		</div>
		
		<!-- Footer -->
		<div class="p-4 border-t border-charcoal-700 flex justify-end">
			<button
				type="button"
				onclick={onClose}
				class="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 min-h-[44px]"
			>
				Done
			</button>
		</div>
	</div>
</div>

