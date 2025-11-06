<!-- Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API -->
<!-- Purpose: Background component that schedules notifications for upcoming matches -->
<!-- Note: Runs in layout, checks every 5 minutes for new matches to notify about -->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { aesClient } from '$lib/api/aesClient';
	import { eventId } from '$lib/stores/event';
	import { favoriteTeams } from '$lib/stores/favorites';
	import { notificationPrefs } from '$lib/stores/notifications';
	import { scheduleNotificationsForMatches, cancelNotifications } from '$lib/utils/notifications';
	import type { Match } from '$lib/types/aes';

	let scheduledTimeouts: number[] = [];
	let checkInterval: number | null = null;

	async function scheduleUpcomingNotifications() {
		// Only schedule if notifications are enabled
		if (!$notificationPrefs.enabled || !$eventId) {
			return;
		}

		try {
			// Get today's matches
			const today = new Date();
			const dateStr = today.toISOString().split('T')[0];
			if (!dateStr) return;

			const schedule = await aesClient.getCourtSchedule($eventId, dateStr, 1440);
			const matches = schedule.Matches;

			// Cancel existing scheduled notifications
			cancelNotifications(scheduledTimeouts);

			// Schedule new notifications for favorite team matches
			scheduledTimeouts = scheduleNotificationsForMatches(
				matches,
				$favoriteTeams,
				$notificationPrefs.minutesBefore
			);

			console.log(`Scheduled ${scheduledTimeouts.length} notifications for favorite team matches`);
		} catch (error) {
			console.error('Failed to schedule notifications:', error);
		}
	}

	onMount(() => {
		// Schedule notifications when component mounts
		scheduleUpcomingNotifications();

		// Re-schedule every 5 minutes to catch new matches
		checkInterval = window.setInterval(() => {
			scheduleUpcomingNotifications();
		}, 5 * 60 * 1000);
	});

	onDestroy(() => {
		// Clean up on unmount
		if (checkInterval) {
			window.clearInterval(checkInterval);
		}
		cancelNotifications(scheduledTimeouts);
	});

	// Re-schedule when prefs change or favorite teams change
	$effect(() => {
		if ($notificationPrefs.enabled) {
			scheduleUpcomingNotifications();
		} else {
			// Cancel all when disabled
			cancelNotifications(scheduledTimeouts);
			scheduledTimeouts = [];
		}
	});

	$effect(() => {
		// Re-schedule when favorite teams change
		if ($favoriteTeams.length > 0 && $notificationPrefs.enabled) {
			scheduleUpcomingNotifications();
		}
	});
</script>

<!-- This component has no UI, it just runs in the background -->
