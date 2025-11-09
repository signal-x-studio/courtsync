<!--
  Purpose: Analytics consent banner
  Note: Privacy-focused - asks for consent before tracking
-->

<script lang="ts">
	import { analyticsPreferences } from '$lib/stores/analytics';

	let showBanner = $state(false);
	let prefs = $state($analyticsPreferences);

	$effect(() => {
		prefs = $analyticsPreferences;
		// Show banner if consent not given yet
		if (!prefs.consentGiven) {
			showBanner = true;
		}
	});

	function acceptAnalytics() {
		analyticsPreferences.giveConsent();
		showBanner = false;
	}

	function declineAnalytics() {
		analyticsPreferences.revokeConsent();
		showBanner = false;
	}
</script>

{#if showBanner}
	<div class="analytics-consent fixed inset-x-0 bottom-0 z-50 border-t border-court-gold/30 bg-(--subtle) p-4 shadow-lg">
		<div class="mx-auto max-w-screen-xl">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex-1">
					<h3 class="mb-1 font-semibold text-primary-600 dark:text-primary-400">Privacy-Focused Analytics</h3>
					<p class="text-sm text-(--fg)">
						We use privacy-focused analytics to understand how you use CourtSync and improve your
						experience. We don't collect any personally identifiable information (PII). We track
						page views, feature usage, and errors to make the app better.
					</p>
				</div>
				<div class="flex gap-3">
					<button
						onclick={declineAnalytics}
						class="rounded border border-default px-4 py-2 text-sm text-(--fg) transition-colors hover:bg-(--subtle)"
					>
						Decline
					</button>
					<button
						onclick={acceptAnalytics}
						class="rounded bg-court-gold px-4 py-2 text-sm font-semibold text-(--fg) transition-colors hover:bg-court-gold/90"
					>
						Accept
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.analytics-consent {
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
