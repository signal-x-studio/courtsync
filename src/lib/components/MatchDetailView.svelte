<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { FilteredMatch } from '$lib/types';
	import { createSwipeHandler } from '$lib/utils/gestures';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { userRole, isMedia, isSpectator, isCoach } from '$lib/stores/userRole';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import MatchDetailHeader from '$lib/components/MatchDetailHeader.svelte';
	import MediaMatchActions from '$lib/components/MediaMatchActions.svelte';
	import SpectatorMatchActions from '$lib/components/SpectatorMatchActions.svelte';
	import CoachMatchActions from '$lib/components/CoachMatchActions.svelte';
	import MatchInfoCard from '$lib/components/MatchInfoCard.svelte';
	
	export let match: FilteredMatch | null = null;
	export let eventId: string;
	export let clubId: number;
	export let matches: FilteredMatch[] = [];
	export let onClose: () => void;
	export let onOpenFullSchedule: () => void;
	
	let sheetElement: HTMLDivElement;
	let scrollContainer: HTMLDivElement;
	let swipeHandler: ReturnType<typeof createSwipeHandler> | null = null;
	let swipeOffset = 0;
	let isSwiping = false;
	let isVisible = false;
	
	// Animate in when match is set
	$: if (match) {
		setTimeout(() => {
			isVisible = true;
		}, 10);
	} else {
		isVisible = false;
	}
	
	function handleClose() {
		isVisible = false;
		// Wait for animation before actually closing
		setTimeout(() => {
			onClose();
		}, 300);
	}
	
	$: isMediaValue = $isMedia;
	$: isSpectatorValue = $isSpectator;
	$: isCoachValue = $isCoach;
	
	// Get match status
	$: now = typeof window !== 'undefined' ? Date.now() : 0;
	$: matchStatus = match ? (() => {
		if (match.HasOutcome) return 'completed';
		if (now >= match.ScheduledStartDateTime && now <= match.ScheduledEndDateTime) return 'in-progress';
		if (now > match.ScheduledEndDateTime) return 'completed';
		return 'upcoming';
	})() : 'upcoming';
	
	onMount(() => {
		if (!sheetElement || !scrollContainer) return;
		
		swipeHandler = createSwipeHandler(
			(gesture) => {
				// Swipe down to dismiss - only if at top of scroll
				if (gesture.direction === 'down' && gesture.distance > 100) {
					if (scrollContainer.scrollTop === 0) {
						handleClose();
					}
				}
				// Reset swipe state
				swipeOffset = 0;
				isSwiping = false;
			},
			{
				onMove: (distance, direction) => {
					// Only allow swipe-to-dismiss if at top of scroll
					if (direction === 'down' && scrollContainer.scrollTop === 0) {
						isSwiping = true;
						swipeOffset = Math.min(distance, 200); // Max 200px swipe
					}
				},
				onCancel: () => {
					swipeOffset = 0;
					isSwiping = false;
				}
			}
		);
		
		// Only attach swipe handler to header area, not scroll container
		const headerElement = sheetElement.querySelector('[data-header]') as HTMLElement;
		if (headerElement) {
			headerElement.addEventListener('touchstart', swipeHandler.handleTouchStart, { passive: true });
			headerElement.addEventListener('touchmove', swipeHandler.handleTouchMove, { passive: true });
			headerElement.addEventListener('touchend', swipeHandler.handleTouchEnd, { passive: true });
			headerElement.addEventListener('touchcancel', swipeHandler.handleTouchCancel, { passive: true });
			
			// Prevent body scroll when sheet is open
			document.body.style.overflow = 'hidden';
			
			return () => {
				if (swipeHandler && headerElement) {
					headerElement.removeEventListener('touchstart', swipeHandler.handleTouchStart);
					headerElement.removeEventListener('touchmove', swipeHandler.handleTouchMove);
					headerElement.removeEventListener('touchend', swipeHandler.handleTouchEnd);
					headerElement.removeEventListener('touchcancel', swipeHandler.handleTouchCancel);
					swipeHandler.destroy();
				}
				document.body.style.overflow = '';
			};
		} else {
			// Fallback: prevent body scroll even if header not found
			document.body.style.overflow = 'hidden';
			return () => {
				if (swipeHandler) {
					swipeHandler.destroy();
				}
				document.body.style.overflow = '';
			};
		}
	});
	
	onDestroy(() => {
		document.body.style.overflow = '';
	});
</script>

{#if match}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
		class:opacity-0={!isVisible}
		class:opacity-100={isVisible}
		onclick={handleClose}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog"
		aria-modal="true"
		aria-label="Match details"
		tabindex="-1"
	>
		<!-- Full-Screen Sheet -->
		<div
			bind:this={sheetElement}
			class="fixed bottom-0 left-0 right-0 top-0 bg-charcoal-950 transition-transform duration-300"
			style="transform: translateY({isVisible ? swipeOffset : '100%'}%);"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					handleClose();
				}
			}}
			role="dialog"
			tabindex="0"
		>
			<!-- Scrollable Content Container -->
			<div bind:this={scrollContainer} class="h-full overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
				<!-- Header with Drag Handle -->
				<div data-header class="sticky top-0 bg-charcoal-950 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between z-10 shadow-lg"
					style="padding-top: max(1rem, env(safe-area-inset-top));"
				>
					<!-- Drag Handle -->
					<div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full"></div>
					
					<!-- Close Button -->
					<button
						type="button"
						onclick={handleClose}
						class="ml-auto w-10 h-10 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors min-h-[44px]"
						aria-label="Close match details"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<!-- Content -->
				<div class="px-4 py-6 pb-8" style="padding-bottom: max(2rem, env(safe-area-inset-bottom));">
					{#if match}
						<!-- Match Header -->
						<MatchDetailHeader
							{match}
							{matchStatus}
						/>
						
						<!-- Role-Specific Actions - Key block to force re-render on role change -->
						{#key $userRole}
							<div class="mt-6">
								{#if isMediaValue}
									<MediaMatchActions
										{match}
										{eventId}
										{matches}
									/>
								{:else if isSpectatorValue}
									<SpectatorMatchActions
										{match}
										{eventId}
										{matches}
									/>
								{:else if isCoachValue}
									<CoachMatchActions
										{match}
										{eventId}
										{clubId}
										{matches}
									/>
								{/if}
							</div>
						{/key}
						
						<!-- General Match Information -->
						<div class="mt-6">
							<MatchInfoCard
								{match}
							/>
						</div>
						
						<!-- Link to Full Schedule -->
						<div class="mt-6">
							<button
								type="button"
								onclick={() => {
									handleClose();
									setTimeout(() => {
										onOpenFullSchedule();
									}, 350);
								}}
								class="w-full px-4 py-3 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px] flex items-center justify-center gap-2"
								aria-label="View full schedule, pool sheet, and standings"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								<span class="font-medium">View Full Schedule & Pool Sheet</span>
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Smooth slide-up animation */
	:global(.match-detail-view-enter) {
		animation: slideUp 0.3s ease-out;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>

