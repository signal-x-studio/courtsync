<script lang="ts">
	import { getTeamDelay } from '$lib/stores/teamDelays';
	import { tournamentDelay } from '$lib/stores/tournamentDelay';
	import type { FilteredMatch } from '$lib/types';
	import { getTeamIdentifier } from '$lib/stores/filters';
	
	export let match: FilteredMatch;
	export let onClick: (() => void) | undefined = undefined;
	
	// Get team ID from match
	$: teamId = getTeamIdentifier(match);
	
	// Get delay for this team/match
	$: teamDelay = getTeamDelay(teamId, match.ScheduledStartDateTime);
	$: globalDelay = $tournamentDelay;
	$: displayDelay = teamDelay !== null ? teamDelay : globalDelay;
	$: isCustom = teamDelay !== null;
	
	function handleClick() {
		if (onClick) {
			onClick();
		}
	}
</script>

<button
	type="button"
	onclick={handleClick}
	class="px-2 py-0.5 text-xs font-medium rounded transition-colors {isCustom ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-charcoal-700 text-charcoal-300 border border-charcoal-600'}"
	title={isCustom ? `Custom delay: ${displayDelay} mins` : `Using global delay: ${displayDelay} mins`}
	aria-label={isCustom ? `Custom delay: ${displayDelay} mins` : `Using global delay: ${displayDelay} mins`}
>
	{displayDelay}m
	{#if isCustom}
		<span class="ml-0.5">*</span>
	{/if}
</button>

