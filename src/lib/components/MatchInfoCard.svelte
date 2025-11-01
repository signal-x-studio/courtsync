<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { Clock, MapPin, Trophy } from 'lucide-svelte';
	
	export let match: FilteredMatch;
</script>

<div class="border border-charcoal-700 rounded-lg bg-charcoal-800 p-4">
	<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-3">
		Match Information
	</div>
	
	<div class="space-y-3">
		<!-- Date & Time -->
		<div class="flex items-start gap-3">
			<Clock size={16} class="text-charcoal-400 flex-shrink-0 mt-0.5" />
			<div class="flex-1 min-w-0">
				<div class="text-xs text-charcoal-400 mb-0.5">Date & Time</div>
				<div class="text-sm font-medium text-charcoal-50">
					{formatMatchDate(match.ScheduledStartDateTime)} • {formatMatchTime(match.ScheduledStartDateTime)}
				</div>
			</div>
		</div>
		
		<!-- Court -->
		<div class="flex items-start gap-3">
			<MapPin size={16} class="text-gold-500 flex-shrink-0 mt-0.5" />
			<div class="flex-1 min-w-0">
				<div class="text-xs text-charcoal-400 mb-0.5">Court</div>
				<div class="text-sm font-medium text-gold-500">
					{match.CourtName}
				</div>
			</div>
		</div>
		
		<!-- Division -->
		{#if match.Division}
			<div class="flex items-start gap-3">
				<Trophy size={16} class="text-charcoal-400 flex-shrink-0 mt-0.5" />
				<div class="flex-1 min-w-0">
					<div class="text-xs text-charcoal-400 mb-0.5">Division</div>
					<div class="text-sm font-medium text-charcoal-50">
						{match.Division.CompleteShortName || match.Division.CodeAlias}
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Teams -->
		<div class="pt-2 border-t border-charcoal-700">
			<div class="text-xs text-charcoal-400 mb-2">Teams</div>
			<div class="space-y-1">
				<div class="text-sm text-charcoal-50">
					{match.FirstTeamText}
				</div>
				{#if match.SecondTeamText}
					<div class="text-xs text-charcoal-400">vs</div>
					<div class="text-sm text-charcoal-50">
						{match.SecondTeamText}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

