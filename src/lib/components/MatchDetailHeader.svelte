<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { Clock, MapPin, Trophy } from 'lucide-svelte';
	
	export let match: FilteredMatch;
	export let matchStatus: 'upcoming' | 'in-progress' | 'completed';
	
	function getTeamId(match: FilteredMatch): string {
		const teamId = getTeamIdentifier(match);
		if (teamId) return teamId;
		
		if (match.InvolvedTeam === 'first') {
			return match.FirstTeamText;
		} else if (match.InvolvedTeam === 'second') {
			return match.SecondTeamText;
		}
		return match.Division.CodeAlias;
	}
	
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'work') {
			return match.WorkTeamText || match.Division.CompleteShortName;
		}
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
	
	$: teamId = getTeamId(match);
	$: opponent = getOpponent(match);
</script>

<div class="space-y-4">
	<!-- Match Title -->
	<div>
		<h1 class="text-2xl font-bold text-charcoal-50 mb-2">
			{#if match.InvolvedTeam === 'work'}
				Work Assignment
			{:else}
				{teamId}
				<span class="text-charcoal-400 font-normal"> vs </span>
				{opponent}
			{/if}
		</h1>
		<div class="text-sm text-charcoal-300">
			{match.Division.CodeAlias}
		</div>
	</div>
	
	<!-- Match Status Badge -->
	<div class="flex items-center gap-2">
		{#if matchStatus === 'completed'}
			<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-charcoal-700 text-charcoal-300 border border-charcoal-600">
				Completed
			</span>
		{:else if matchStatus === 'in-progress'}
			<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/50 flex items-center gap-1.5">
				<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
				LIVE
			</span>
		{:else}
			<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/50">
				Upcoming
			</span>
		{/if}
	</div>
	
	<!-- Match Info Grid -->
	<div class="grid grid-cols-1 gap-3">
		<!-- Date & Time -->
		<div class="flex items-center gap-2 text-sm text-charcoal-300">
			<Clock size={16} class="text-charcoal-400 flex-shrink-0" />
			<span>{formatMatchDate(match.ScheduledStartDateTime)}</span>
			<span class="text-charcoal-500">•</span>
			<span class="font-medium text-charcoal-50">{formatMatchTime(match.ScheduledStartDateTime)}</span>
		</div>
		
		<!-- Court -->
		<div class="flex items-center gap-2 text-sm text-charcoal-300">
			<MapPin size={16} class="text-gold-500 flex-shrink-0" />
			<span class="font-medium text-gold-500">{match.CourtName}</span>
		</div>
		
		<!-- Division/Pool -->
		{#if match.Division}
			<div class="flex items-center gap-2 text-sm text-charcoal-300">
				<Trophy size={16} class="text-charcoal-400 flex-shrink-0" />
				<span>{match.Division.CompleteShortName || match.Division.CodeAlias}</span>
			</div>
		{/if}
	</div>
</div>

