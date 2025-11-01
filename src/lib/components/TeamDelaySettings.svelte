<script lang="ts">
	import { getTeamDelay, setTeamDelay, removeTeamDelay, getTeamDelaysForTeam, getTeamDelayEntry } from '$lib/stores/teamDelays';
	import { tournamentDelay } from '$lib/stores/tournamentDelay';
	import { formatMatchDate } from '$lib/utils/dateUtils';
	import { X } from 'lucide-svelte';
	import type { FilteredMatch } from '$lib/types';
	import { getTeamIdentifier } from '$lib/stores/filters';
	
	export let teamId: string;
	export let teamName: string; // Used in template for display
	export let matches: FilteredMatch[] = [];
	
	// Generate delay options (0-120 minutes in 15min increments)
	const delayOptions = Array.from({ length: 9 }, (_, i) => i * 15);
	
	// Get team matches sorted by date
	$: teamMatches = matches
		.filter(m => getTeamIdentifier(m) === teamId)
		.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
	
	// Get unique dates for this team
	$: teamDates = Array.from(new Set(
		teamMatches.map(m => {
			const date = new Date(m.ScheduledStartDateTime);
			return date.toISOString().split('T')[0];
		})
	)).sort();
	
	// Get all delays set for this team
	$: teamDelays = getTeamDelaysForTeam(teamId);
	$: globalDelay = $tournamentDelay;
	
	// Get today's date
	$: today = new Date().toISOString().split('T')[0];
	$: todayDelay = getTeamDelay(teamId, new Date().getTime());
	
	function setDelayForDate(date: string, delay: number | null) {
		const dateObj = new Date(date);
		dateObj.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
		
		if (delay === null) {
			removeTeamDelay(teamId, dateObj.getTime());
		} else {
			setTeamDelay(teamId, dateObj.getTime(), delay);
		}
	}
	
	function getDelayForDate(date: string): number | null {
		const dateObj = new Date(date);
		dateObj.setHours(12, 0, 0, 0);
		return getTeamDelay(teamId, dateObj.getTime());
	}
	
	function getDelayEntryForDate(date: string) {
		const dateObj = new Date(date);
		dateObj.setHours(12, 0, 0, 0);
		return getTeamDelayEntry(teamId, dateObj.getTime());
	}
</script>

<div class="space-y-4">
	<h3 class="text-base font-semibold text-charcoal-50">Delay Settings</h3>
	<p class="text-xs text-charcoal-400 mb-2">Manage delays for {teamName}</p>
	
	<!-- Today's Delay (Prominent) -->
	<div class="bg-charcoal-700/50 rounded-lg p-3 border border-charcoal-600">
		<div class="flex items-center justify-between mb-2">
			<div>
				<div class="text-xs text-charcoal-300 mb-0.5">Today ({formatMatchDate(new Date().getTime())})</div>
				<div class="text-sm font-semibold text-charcoal-50">
					{#if todayDelay !== null}
						{@const delayEntry = getTeamDelayEntry(teamId, new Date().getTime())}
						{#if delayEntry && delayEntry.source === 'auto'}
							<span class="text-gold-400">Auto-detected delay: {todayDelay} mins</span>
						{:else}
							<span>Custom delay: {todayDelay} mins</span>
						{/if}
					{:else}
						Using global delay: {globalDelay} mins
					{/if}
				</div>
			</div>
			<select
				value={todayDelay?.toString() || ''}
				onchange={(e) => {
					const value = (e.target as HTMLSelectElement).value;
					setDelayForDate(today, value === '' ? null : parseInt(value, 10));
				}}
				class="px-2 py-1 text-xs rounded transition-colors min-h-[32px] focus:border-gold-500 focus:outline-none"
				style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
			>
				<option value="">Use global</option>
				{#each delayOptions as delay}
					<option value={delay}>
						{delay} mins
					</option>
				{/each}
			</select>
		</div>
	</div>
	
	<!-- Upcoming Dates -->
	{#if teamDates.length > 0}
		<div>
			<div class="text-xs text-charcoal-300 mb-2">Upcoming Dates</div>
			<div class="space-y-2">
				{#each teamDates as date}
					{@const delay = getDelayForDate(date)}
					{@const dateObj = new Date(date)}
					{@const isToday = date === today}
					{@const isPast = dateObj < new Date() && date !== today}
					
					{#if !isPast}
						<div class="flex items-center justify-between p-2 bg-charcoal-800 rounded border border-charcoal-700">
							<div class="flex-1 min-w-0">
								<div class="text-xs font-medium text-charcoal-50">
									{formatMatchDate(dateObj.getTime())}
									{#if isToday}
										<span class="ml-1 text-gold-400">(Today)</span>
									{/if}
								</div>
								<div class="text-xs text-charcoal-400">
									{#if delay !== null}
										{@const delayEntry = getTeamDelayEntry(teamId, dateObj.getTime())}
										{#if delayEntry && delayEntry.source === 'auto'}
											<span class="text-gold-400">Auto: {delay} mins</span>
										{:else}
											<span>Custom: {delay} mins</span>
										{/if}
									{:else}
										Global: {globalDelay} mins
									{/if}
								</div>
							</div>
							<select
								value={delay?.toString() || ''}
								onchange={(e) => {
									const value = (e.target as HTMLSelectElement).value;
									setDelayForDate(date, value === '' ? null : parseInt(value, 10));
								}}
								class="px-2 py-1 text-xs rounded transition-colors min-h-[32px] focus:border-gold-500 focus:outline-none ml-2"
								style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
							>
								<option value="">Global</option>
								{#each delayOptions as opt}
									<option value={opt}>
										{opt} mins
									</option>
								{/each}
							</select>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Info Text -->
	<div class="text-xs text-charcoal-400 pt-2 border-t border-charcoal-700">
		<p>Team-specific delays override the global delay setting. Each day resets automatically.</p>
	</div>
</div>

