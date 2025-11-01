<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, getMatchWave } from '$lib/utils/dateUtils';
	import { createSwipeHandler } from '$lib/utils/gestures';
	import { coveragePlan } from '$lib/stores/coveragePlan';
	import { priority } from '$lib/stores/priority';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import { followedTeams } from '$lib/stores/followedTeams';
	import type { createMatchClaiming } from '$lib/stores/matchClaiming';
	import { Star, AlertTriangle, ClipboardList, Check, Circle, X } from 'lucide-svelte';
	
	export let match: FilteredMatch;
	export let hasConflict: boolean = false;
	export let matchClaiming: ReturnType<typeof createMatchClaiming> | null = null;
	export let onTap: (match: FilteredMatch) => void;
	export let onSwipeRight: ((match: FilteredMatch) => void) | null = null;
	export let onSwipeLeft: ((match: FilteredMatch) => void) | null = null;
	export let scanningMode: boolean = false;
	
	let cardElement: HTMLDivElement;
	let swipeOffset = 0;
	let isSwiping = false;
	let swipeDirection: 'left' | 'right' | null = null;
	let swipeHandler: ReturnType<typeof createSwipeHandler> | null = null;
	
	function getTeamId(match: FilteredMatch): string {
		const teamText = match.InvolvedTeam === 'first' 
			? match.FirstTeamText 
			: match.SecondTeamText;
		const matchResult = teamText.match(/(\d+-\d+)/);
		return matchResult ? matchResult[1] : '';
	}
	
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
	
	$: teamId = getTeamId(match);
	$: opponent = getOpponent(match);
	$: matchPriority = priority.getPriority(match.MatchId);
	$: teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : 'not-covered';
	$: isCovered = teamCoverageStatus === 'covered' || teamCoverageStatus === 'partially-covered';
	$: isPlanned = teamCoverageStatus === 'planned';
	$: isUncovered = teamCoverageStatus === 'not-covered';
	$: shouldDim = scanningMode && isCovered;
	$: currentPlan = get(coveragePlan);
	$: isSelected = currentPlan.has(match.MatchId);
	$: isMediaValue = $isMedia;
	$: isSpectatorValue = $isSpectator;
	$: isCoachValue = $isCoach;
	$: followedTeamsList = $followedTeams || [];
	$: isFollowingTeam = teamId ? followedTeamsList.some(t => t.teamId === teamId) : false;
	$: matchWave = getMatchWave(match.ScheduledStartDateTime);
	
	// Match status calculation
	$: now = typeof window !== 'undefined' ? Date.now() : 0;
	$: matchStatus = (() => {
		if (match.HasOutcome) return 'completed';
		if (now >= match.ScheduledStartDateTime && now <= match.ScheduledEndDateTime) return 'in-progress';
		if (now > match.ScheduledEndDateTime) return 'completed';
		return 'upcoming';
	})();
	
	// Live score data
	$: score = matchClaiming ? matchClaiming.getScore(match.MatchId) : null;
	$: currentSetScore = score && score.sets.length > 0 ? score.sets[score.sets.length - 1] : null;
	$: isLive = score && score.status === 'in-progress';
	$: showLiveScore = isLive && currentSetScore;
	
	// Compute card classes with opacity support and wave indicator
	$: cardClasses = [
		'relative rounded-xl px-3 py-2.5 transition-colors border-l-4',
		hasConflict || matchPriority === 'must-cover' ? 'border-2' : 'border',
		// Wave indicator: left border
		matchWave === 'morning' ? 'border-l-warning-500' : 'border-l-brand-500',
		hasConflict ? 'border-warning-500 bg-warning-500/10' : '',
		matchPriority === 'must-cover' && !hasConflict ? 'border-gold-500 bg-gold-500/10' : '',
		isPlanned && !hasConflict && matchPriority !== 'must-cover' ? 'border-gold-500/50 bg-gold-500/10' : '',
		isCovered && !hasConflict && !isPlanned && matchPriority !== 'must-cover' ? 'border-success-500/30 bg-success-500/5' : '',
		isUncovered && !hasConflict && !isPlanned && matchPriority !== 'must-cover' && isSelected ? 'border-gold-500 bg-gold-500/5' : '',
		!hasConflict && !isCovered && !isPlanned && !isSelected && matchPriority !== 'must-cover' ? 'border-charcoal-700 bg-charcoal-900' : '',
		!isSwiping ? 'hover:border-charcoal-600 hover:bg-charcoal-800' : ''
	].filter(Boolean).join(' ');
	
	// Wave background tint (only apply if no other status colors override it)
	$: cardStyle = !hasConflict && matchPriority !== 'must-cover' && !isPlanned && !isCovered && !isSelected
		? (matchWave === 'morning' 
			? 'background-color: rgba(245, 158, 11, 0.05);' 
			: 'background-color: rgba(91, 124, 255, 0.05);')
		: '';
	
	onMount(() => {
		if (!cardElement) return;
		
		swipeHandler = createSwipeHandler(
			(gesture) => {
				if (gesture.direction === 'right' && onSwipeRight) {
					onSwipeRight(match);
				} else if (gesture.direction === 'left' && onSwipeLeft) {
					onSwipeLeft(match);
				}
				// Reset swipe state
				swipeOffset = 0;
				isSwiping = false;
				swipeDirection = null;
			},
			{
				onMove: (distance, direction) => {
					isSwiping = true;
					swipeDirection = direction === 'left' || direction === 'right' ? direction : null;
					swipeOffset = direction === 'left' || direction === 'right' ? distance : 0;
				},
				onCancel: () => {
					swipeOffset = 0;
					isSwiping = false;
					swipeDirection = null;
				}
			}
		);
		
		cardElement.addEventListener('touchstart', swipeHandler.handleTouchStart, { passive: true });
		cardElement.addEventListener('touchmove', swipeHandler.handleTouchMove, { passive: true });
		cardElement.addEventListener('touchend', swipeHandler.handleTouchEnd, { passive: true });
		cardElement.addEventListener('touchcancel', swipeHandler.handleTouchCancel, { passive: true });
		
		return () => {
			if (swipeHandler) {
				cardElement.removeEventListener('touchstart', swipeHandler.handleTouchStart);
				cardElement.removeEventListener('touchmove', swipeHandler.handleTouchMove);
				cardElement.removeEventListener('touchend', swipeHandler.handleTouchEnd);
				cardElement.removeEventListener('touchcancel', swipeHandler.handleTouchCancel);
				swipeHandler.destroy();
			}
		};
	});
	
	function handleTap() {
		if (!isSwiping) {
			onTap(match);
		}
	}
	
	function handleSelect(e: MouseEvent) {
		e.stopPropagation();
		coveragePlan.toggleMatch(match.MatchId);
	}
</script>

<div
	bind:this={cardElement}
	class="relative w-full rounded-xl transition-all duration-200 cursor-pointer touch-pan-y"
	class:opacity-30={shouldDim}
	style="transform: translateX({swipeOffset * (swipeDirection === 'left' ? -1 : swipeDirection === 'right' ? 1 : 0)}px);"
	onclick={handleTap}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTap(e); }}
	role="button"
	tabindex="0"
	data-match-card
	data-match-id={match.MatchId}
>
	<!-- Swipe Action Indicators -->
	{#if swipeOffset > 20}
		<div
			class="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center rounded-l-xl transition-opacity"
			class:bg-gold-500={swipeDirection === 'right'}
			class:bg-charcoal-700={swipeDirection === 'left'}
			style="opacity: {Math.min(swipeOffset / 100, 1)};"
		>
			{#if swipeDirection === 'right'}
				<Check size={20} class="text-charcoal-950" />
			{:else if swipeDirection === 'left'}
				<X size={20} class="text-charcoal-200" />
			{/if}
		</div>
	{/if}
	
	<!-- Card Content -->
	<div class={cardClasses} style={cardStyle}>
		<div class="flex items-start gap-3">
			<!-- Main Content -->
			<div class="flex-1 min-w-0">
				<!-- Team Name and Court - Most Prominent -->
				<div class="flex items-center gap-2 mb-1">
					{#if match.InvolvedTeam === 'work'}
						<!-- Work Assignment Indicator -->
						<span class="text-xs font-semibold px-1.5 py-0.5 rounded bg-charcoal-700 text-charcoal-300 border border-charcoal-600">
							WORK
						</span>
					{:else}
						<div class="text-base font-bold text-charcoal-50 truncate">
							{teamId || match.Division.CodeAlias}
						</div>
					{/if}
					<span class="text-base font-bold text-gold-500 flex-shrink-0">
						{match.CourtName}
					</span>
					{#if isSpectatorValue && match.ScoreKioskCode}
						<!-- ScoreKioskCode Badge -->
						<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal-700 text-charcoal-300 border border-charcoal-600">
							{match.ScoreKioskCode}
						</span>
					{/if}
					{#if hasConflict}
						<AlertTriangle size={14} class="text-warning-500 flex-shrink-0" />
					{/if}
					{#if matchPriority === 'must-cover'}
						<Star size={14} class="text-gold-500 flex-shrink-0" />
					{/if}
					{#if matchStatus === 'completed'}
						<!-- Completed Match Indicator -->
						<div class="w-2 h-2 rounded-full bg-charcoal-600 flex-shrink-0" title="Match completed"></div>
					{:else if matchStatus === 'in-progress'}
						<!-- In Progress Indicator -->
						<div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" title="Match in progress"></div>
					{/if}
				</div>
				
				<!-- Opponent -->
				<div class="text-sm text-charcoal-300 truncate mb-1">
					{#if match.InvolvedTeam === 'work'}
						{match.WorkTeamText || match.Division.CompleteShortName}
					{:else}
						vs {opponent}
					{/if}
					{#if showLiveScore}
						<span class="ml-2 text-xs font-semibold text-green-400">
							{currentSetScore.team1Score}-{currentSetScore.team2Score}
						</span>
					{/if}
				</div>
				
				<!-- Division and Status -->
				<div class="flex items-center gap-2 mt-1">
					<span class="text-xs text-charcoal-400">{match.Division.CodeAlias}</span>
					{#if teamCoverageStatus === 'covered'}
						<span class="text-xs text-success-500">
							<Check size={12} class="inline" />
							Covered
						</span>
					{:else if teamCoverageStatus === 'partially-covered'}
						<span class="text-xs text-warning-500">◐ Partial</span>
					{:else if teamCoverageStatus === 'planned'}
						<span class="text-xs text-gold-500">
							<ClipboardList size={12} class="inline" />
							Planned
						</span>
					{/if}
					{#if isLive}
						<span class="px-1.5 py-0.5 text-[10px] font-medium rounded border bg-green-500/20 text-green-400 border-green-500/30">
							LIVE
						</span>
					{/if}
				</div>
			</div>
			
			<!-- Action Button -->
			<div class="flex-shrink-0 flex flex-col items-center gap-1">
				{#if isMediaValue}
					<!-- Selection Checkbox -->
					<button
						type="button"
						onclick={handleSelect}
						class="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors touch-target {isSelected ? 'border-gold-500 bg-gold-500/20' : 'border-charcoal-600 hover:border-charcoal-700'}"
						aria-label={isSelected ? 'Remove from plan' : 'Add to plan'}
					>
						{#if isSelected}
							<svg class="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{:else}
							<span class="text-xs text-charcoal-400">+</span>
						{/if}
					</button>
				{:else if isSpectatorValue && teamId}
					<!-- Favorite/Follow Button -->
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							if (isFollowingTeam) {
								followedTeams.unfollowTeam(teamId);
							} else {
								followedTeams.followTeam(teamId, teamId);
							}
						}}
						class="w-6 h-6 flex items-center justify-center transition-colors touch-target"
						class:text-gold-500={isFollowingTeam}
						class:text-charcoal-400={!isFollowingTeam}
						class:hover:text-gold-400={!isFollowingTeam}
						aria-label={isFollowingTeam ? 'Unfollow team' : 'Follow team'}
						title={isFollowingTeam ? 'Unfollow team' : 'Follow team'}
					>
						<Star size={16} class={isFollowingTeam ? 'fill-current' : ''} />
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	[data-match-card] {
		touch-action: pan-y;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	
	[data-match-card]:active {
		transform: scale(0.98);
	}
	
	/* Touch targets for mobile */
	.touch-target {
		min-height: 36px;
		min-width: 36px;
	}
	
	@media (min-width: 640px) {
		.touch-target {
			min-height: 0;
			min-width: 0;
		}
	}
</style>

