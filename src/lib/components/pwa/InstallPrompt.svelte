<!-- Reference: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent -->
<!-- Purpose: PWA install prompt component with beforeinstallprompt handling -->
<!-- Note: Shows install banner when app is installable, handles user choice -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { trackPWAInstall } from '$lib/utils/analytics';

	let deferredPrompt = $state<any>(null);
	let showInstallPrompt = $state(false);
	let isInstalled = $state(false);

	onMount(() => {
		// Check if already installed
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled = true;
			return;
		}

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			// Prevent the default mini-infobar
			e.preventDefault();
			// Store the event for later use
			deferredPrompt = e;
			// Show our custom install prompt
			showInstallPrompt = true;
		});

		// Listen for successful installation
		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			showInstallPrompt = false;
			deferredPrompt = null;
			// Track analytics
			trackPWAInstall();
		});
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user's response
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
		} else {
			console.log('User dismissed the install prompt');
		}

		// Clear the deferred prompt
		deferredPrompt = null;
		showInstallPrompt = false;
	}

	function dismissPrompt() {
		showInstallPrompt = false;
		// Hide for this session, but it can show again later
	}
</script>

{#if showInstallPrompt && !isInstalled}
	<div
		class="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
		role="dialog"
		aria-labelledby="install-title"
		aria-describedby="install-description"
	>
		<div class="rounded-lg border border-court-gold bg-(--subtle) p-4 shadow-xl">
			<div class="mb-3 flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-court-gold">
						<svg
							class="h-7 w-7 text-(--fg)"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<circle cx="12" cy="12" r="10" stroke-width="2" />
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 12h8M12 8v8"
							/>
						</svg>
					</div>
					<div>
						<h3 id="install-title" class="font-semibold text-gray-100">Install CourtSync</h3>
						<p id="install-description" class="text-sm text-muted">
							Quick access from your home screen
						</p>
					</div>
				</div>
				<button
					onclick={dismissPrompt}
					class="rounded p-1 text-muted transition-colors hover:bg-(--subtle) hover:text-gray-200"
					aria-label="Dismiss install prompt"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="flex gap-2">
				<button
					onclick={handleInstall}
					class="flex-1 rounded-lg bg-court-gold px-4 py-2 font-medium text-(--fg) transition-colors hover:bg-court-gold/90"
				>
					Install
				</button>
				<button
					onclick={dismissPrompt}
					class="rounded-lg bg-(--subtle) px-4 py-2 font-medium text-(--fg) transition-colors hover:bg-gray-600"
				>
					Not Now
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isInstalled}
	<!-- Optional: Show a subtle indicator that app is installed -->
	<div class="sr-only" aria-live="polite">CourtSync is installed</div>
{/if}
