<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { followedTeams } from '$lib/stores/followedTeams';
	import { createMatchClaiming } from '$lib/stores/matchClaiming';
	import MatchClaimButton from '$lib/components/MatchClaimButton.svelte';
	import Scorekeeper from '$lib/components/Scorekeeper.svelte';
	import LiveScoreIndicator from '$lib/components/LiveScoreIndicator.svelte';
	import { Star, Bell } from 'lucide-svelte';
	
	export let match: FilteredMatch;
	export let eventId: string;
	export let matches: FilteredMatch[] = [];
	
	let showScorekeeper = false;
	let watchLiveScore = false;
	
	const matchClaiming = createMatchClaiming({ eventId, userId: 'spectator' });
	
	$: teamId = getTeamIdentifier(match);
	$: isFollowingTeam = teamId ? followedTeams.isFollowing(teamId) : false;
	$: claimStatus = matchClaiming.getClaimStatus(match.MatchId);
	$: isClaimOwner = matchClaiming.isClaimOwner(match.MatchId);
	$: currentScore = matchClaiming.getScore(match.MatchId);
	$: hasScore = currentScore !== null;
	
	function handleFollowToggle() {
		if (teamId) {
			if (isFollowingTeam) {
				followedTeams.unfollowTeam(teamId);
			} else {
				followedTeams.followTeam(teamId, teamId);
			}
		}
	}
	
	function handleClaim(matchId: number) {
		// Claim handled by MatchClaimButton component
		if (isClaimOwner) {
			showScorekeeper = true;
		}
	}
	
	function handleRelease() {
		showScorekeeper = false;
	}
	
	function handleScoreUpdate(sets: any[], status: 'not-started' | 'in-progress' | 'completed') {
		matchClaiming.updateScore(match.MatchId, sets, status);
	}
</script>

<div class="space-y-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-charcoal-50">Scorekeeper Tools</h2>
	</div>
	
	<!-- Follow Team -->
	{#if teamId}
		<div>
			<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
				Follow Team
			</div>
			<button
				type="button"
				onclick={handleFollowToggle}
				class="w-full px-4 py-3 rounded-lg border transition-colors min-h-[44px] flex items-center justify-center gap-2 {isFollowingTeam ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-charcoal-700 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-50'}"
			>
				<Star size={18} class={isFollowingTeam ? 'fill-current' : ''} />
				<span class="font-medium">
					{isFollowingTeam ? 'Following Team' : 'Follow Team'}
				</span>
			</button>
		</div>
	{/if}
	
	<!-- Claim Scorekeeping -->
	<div>
		<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
			Scorekeeping
		</div>
		<MatchClaimButton
			{match}
			{eventId}
			onClaim={handleClaim}
			onRelease={handleRelease}
		/>
	</div>
	
	<!-- Live Score Watching -->
	<div>
		<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
			Watch Live Score
		</div>
		<label class="flex items-center justify-between px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800 cursor-pointer min-h-[44px]">
			<div class="flex items-center gap-2">
				<Bell size={18} class="text-charcoal-400" />
				<span class="text-sm text-charcoal-50">Follow live updates</span>
			</div>
			<input
				type="checkbox"
				bind:checked={watchLiveScore}
				class="w-5 h-5 rounded bg-charcoal-700 border-charcoal-600 text-gold-500 focus:ring-gold-500 focus:ring-offset-charcoal-950"
			/>
		</label>
	</div>
	
	<!-- Live Score Display -->
	{#if watchLiveScore && hasScore && currentScore}
		<div class="mt-4">
			<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
				<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
					Current Score
				</div>
				{#if currentScore.sets.length > 0}
					{@const currentSet = currentScore.sets[currentScore.sets.length - 1]}
					<div class="flex items-center justify-center gap-4">
						<div class="text-center">
							<div class="text-xs text-charcoal-400 mb-1">{match.FirstTeamText}</div>
							<div class="text-2xl font-bold text-charcoal-50">{currentSet.team1Score}</div>
						</div>
						<div class="text-charcoal-500">-</div>
						<div class="text-center">
							<div class="text-xs text-charcoal-400 mb-1">{match.SecondTeamText}</div>
							<div class="text-2xl font-bold text-charcoal-50">{currentSet.team2Score}</div>
						</div>
					</div>
					<div class="text-center mt-2">
						<LiveScoreIndicator
							isLive={currentScore.status === 'in-progress'}
							lastUpdated={currentScore.lastUpdated}
							source={currentScore.source}
						/>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Scorekeeper Modal -->
{#if showScorekeeper && isClaimOwner}
	<div class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="bg-charcoal-900 rounded-lg border border-charcoal-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
			<div class="sticky top-0 bg-charcoal-900 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-charcoal-50">Scorekeeping</h3>
				<button
					type="button"
					onclick={() => showScorekeeper = false}
					class="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors min-h-[44px]"
					aria-label="Close scorekeeper"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-4">
				<Scorekeeper
					matchId={match.MatchId}
					team1Name={match.FirstTeamText}
					team2Name={match.SecondTeamText}
					currentScore={currentScore}
					onScoreUpdate={handleScoreUpdate}
					onClose={() => showScorekeeper = false}
				/>
			</div>
		</div>
	</div>
{/if}

