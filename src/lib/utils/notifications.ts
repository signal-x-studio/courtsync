// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
// Purpose: Utility functions for managing match notifications
// Note: Schedules notifications for favorite teams' matches

import type { Match } from '$lib/types/aes';

/**
 * Check if browser supports notifications
 */
export function supportsNotifications(): boolean {
	return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!supportsNotifications()) {
		return 'denied';
	}

	try {
		const permission = await Notification.requestPermission();
		return permission;
	} catch (error) {
		console.error('Error requesting notification permission:', error);
		return 'denied';
	}
}

/**
 * Show a notification for an upcoming match
 */
export function showMatchNotification(match: Match, minutesUntil: number): void {
	if (!supportsNotifications() || Notification.permission !== 'granted') {
		return;
	}

	const title = `Match Starting ${minutesUntil === 0 ? 'Now' : `in ${minutesUntil} min`}`;
	const body = `${match.FirstTeamText} vs ${match.SecondTeamText}\n${match.CourtName ? `Court: ${match.CourtName}` : ''}`;

	const notification = new Notification(title, {
		body,
		icon: '/icon-192.png',
		badge: '/icon-192.png',
		tag: `match-${match.MatchId}`, // Prevents duplicate notifications
		requireInteraction: false,
		vibrate: [200, 100, 200],
		data: {
			matchId: match.MatchId,
			url: `/match/${match.MatchId}`
		}
	});

	// Handle notification click - open match detail page
	notification.onclick = (event) => {
		event.preventDefault();
		const data = (event.target as Notification).data;
		if (data?.url) {
			window.open(data.url, '_blank');
		}
		notification.close();
	};

	// Auto-close after 10 seconds
	setTimeout(() => {
		notification.close();
	}, 10000);
}

/**
 * Schedule a notification for a match
 * Returns the timeout ID so it can be cancelled
 */
export function scheduleMatchNotification(
	match: Match,
	minutesBefore: number
): number | null {
	if (!supportsNotifications() || Notification.permission !== 'granted') {
		return null;
	}

	const matchStart = match.ScheduledStartDateTime;
	const now = Date.now();
	const notifyAt = matchStart - minutesBefore * 60 * 1000;
	const delay = notifyAt - now;

	// Only schedule if it's in the future and within the next 24 hours
	if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
		const timeoutId = window.setTimeout(() => {
			showMatchNotification(match, minutesBefore);
		}, delay);

		return timeoutId;
	}

	return null;
}

/**
 * Schedule notifications for all favorite team matches
 */
export function scheduleNotificationsForMatches(
	matches: Match[],
	favoriteTeamIds: number[],
	minutesBefore: number
): number[] {
	const timeoutIds: number[] = [];

	for (const match of matches) {
		// Check if match involves a favorite team
		const isFavorite =
			(match.FirstTeamId && favoriteTeamIds.includes(match.FirstTeamId)) ||
			(match.SecondTeamId && favoriteTeamIds.includes(match.SecondTeamId));

		if (isFavorite) {
			const timeoutId = scheduleMatchNotification(match, minutesBefore);
			if (timeoutId !== null) {
				timeoutIds.push(timeoutId);
			}
		}
	}

	return timeoutIds;
}

/**
 * Cancel all scheduled notifications
 */
export function cancelNotifications(timeoutIds: number[]): void {
	for (const id of timeoutIds) {
		window.clearTimeout(id);
	}
}
