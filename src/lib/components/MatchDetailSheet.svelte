<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { FilteredMatch } from '$lib/types';
	import { createSwipeHandler } from '$lib/utils/gestures';
	import TeamDetailPanel from '$lib/components/TeamDetailPanel.svelte';
	
	export let match: FilteredMatch | null = null;
	export let eventId: string;
	export let clubId: number;
	export let matches: FilteredMatch[] = [];
	export let onClose: () => void;
	
	let sheetElement: HTMLDivElement;
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
	
	onMount(() => {
		if (!sheetElement) return;
		
		swipeHandler = createSwipeHandler(
			(gesture) => {
				// Swipe down to dismiss
				if (gesture.direction === 'down' && gesture.distance > 100) {
					handleClose();
				}
				// Reset swipe state
				swipeOffset = 0;
				isSwiping = false;
			},
			{
				onMove: (distance, direction) => {
					if (direction === 'down') {
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
		
		sheetElement.addEventListener('touchstart', swipeHandler.handleTouchStart, { passive: true });
		sheetElement.addEventListener('touchmove', swipeHandler.handleTouchMove, { passive: true });
		sheetElement.addEventListener('touchend', swipeHandler.handleTouchEnd, { passive: true });
		sheetElement.addEventListener('touchcancel', swipeHandler.handleTouchCancel, { passive: true });
		
		// Prevent body scroll when sheet is open
		document.body.style.overflow = 'hidden';
		
		return () => {
			if (swipeHandler) {
				sheetElement.removeEventListener('touchstart', swipeHandler.handleTouchStart);
				sheetElement.removeEventListener('touchmove', swipeHandler.handleTouchMove);
				sheetElement.removeEventListener('touchend', swipeHandler.handleTouchEnd);
				sheetElement.removeEventListener('touchcancel', swipeHandler.handleTouchCancel);
				swipeHandler.destroy();
			}
			document.body.style.overflow = '';
		};
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
			class="fixed bottom-0 left-0 right-0 top-0 bg-charcoal-950 overflow-y-auto transition-transform duration-300"
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
			<!-- Header with Drag Handle -->
			<div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between z-10 shadow-lg"
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
			<div class="pb-8" style="padding-bottom: max(2rem, env(safe-area-inset-bottom));">
				{#if match}
					<TeamDetailPanel
						{match}
						{eventId}
						{clubId}
						onClose={handleClose}
						{matches}
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Smooth slide-up animation */
	:global(.match-detail-sheet-enter) {
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

