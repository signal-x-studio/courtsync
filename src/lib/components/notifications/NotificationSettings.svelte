<!-- Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API -->
<!-- Purpose: UI for managing notification permissions and preferences -->
<!-- Note: Allows users to enable/disable match notifications -->

<script lang="ts">
	import { notificationPrefs } from '$lib/stores/notifications';
	import { requestNotificationPermission, supportsNotifications } from '$lib/utils/notifications';
	import { trackNotificationsEnable, trackNotificationsDisable } from '$lib/utils/analytics';

	let requesting = $state(false);
	let statusMessage = $state('');

	async function handleEnableNotifications() {
		if (!supportsNotifications()) {
			statusMessage = 'Notifications not supported in this browser';
			return;
		}

		requesting = true;
		statusMessage = '';

		try {
			const permission = await requestNotificationPermission();
			notificationPrefs.setPermission(permission);

			if (permission === 'granted') {
				notificationPrefs.enable();
				trackNotificationsEnable();
				statusMessage = 'Notifications enabled! You\'ll be notified 15 minutes before your favorite teams\' matches.';
			} else if (permission === 'denied') {
				statusMessage = 'Notifications blocked. Please enable them in your browser settings.';
			} else {
				statusMessage = 'Notification permission not granted.';
			}
		} catch (error) {
			statusMessage = 'Failed to request notification permission.';
			console.error(error);
		} finally {
			requesting = false;
		}
	}

	function handleDisableNotifications() {
		notificationPrefs.disable();
		trackNotificationsDisable();
		statusMessage = 'Notifications disabled.';
	}
</script>

<div class="rounded-lg border border-gray-700 bg-court-charcoal p-4">
	<div class="mb-3 flex items-start justify-between">
		<div class="flex-1">
			<h3 class="font-semibold text-gray-100">Match Notifications</h3>
			<p class="mt-1 text-sm text-gray-400">
				Get notified 15 minutes before your favorite teams' matches start
			</p>
		</div>

		<div class="ml-4">
			{#if !supportsNotifications()}
				<span class="text-xs text-gray-500">Not supported</span>
			{:else if $notificationPrefs.enabled && $notificationPrefs.permission === 'granted'}
				<button
					onclick={handleDisableNotifications}
					class="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
				>
					Disable
				</button>
			{:else}
				<button
					onclick={handleEnableNotifications}
					disabled={requesting}
					class="rounded-lg bg-court-gold px-4 py-2 text-sm font-medium text-court-dark transition-colors hover:bg-court-gold/90 disabled:opacity-50"
				>
					{requesting ? 'Requesting...' : 'Enable'}
				</button>
			{/if}
		</div>
	</div>

	{#if statusMessage}
		<div
			class={`mt-3 rounded border px-3 py-2 text-sm ${
				$notificationPrefs.enabled
					? 'border-green-600 bg-green-900/20 text-green-400'
					: 'border-yellow-600 bg-yellow-900/20 text-yellow-400'
			}`}
			role="status"
		>
			{statusMessage}
		</div>
	{/if}

	{#if $notificationPrefs.enabled && $notificationPrefs.permission === 'granted'}
		<div class="mt-3 rounded bg-court-dark p-3 text-sm text-gray-400">
			<div class="flex items-center gap-2">
				<svg class="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>Notifications active for favorite teams</span>
			</div>
		</div>
	{/if}
</div>
