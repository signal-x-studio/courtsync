import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { FilteredMatch } from '$lib/types';
import type { MatchScore } from '$lib/types';

export interface NotificationPreferences {
	upcomingMatchReminder: boolean;
	reminderMinutes: number;
	scoreUpdateNotification: boolean;
	browserNotifications: boolean;
}

const STORAGE_KEY_NOTIFICATIONS = 'notificationPreferences';
const DEFAULT_PREFERENCES: NotificationPreferences = {
	upcomingMatchReminder: true,
	reminderMinutes: 5,
	scoreUpdateNotification: true,
	browserNotifications: false
};

function createNotifications() {
	const { subscribe: subscribePrefs, set: setPrefs, update: updatePrefs } =
		writable<NotificationPreferences>(DEFAULT_PREFERENCES);
	const { subscribe: subscribePermission, set: setPermission } = writable<NotificationPermission>(
		'default'
	);

	// Load from localStorage
	if (browser) {
		try {
			const prefsData = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
			if (prefsData) {
				const parsed = JSON.parse(prefsData) as NotificationPreferences;
				setPrefs({ ...DEFAULT_PREFERENCES, ...parsed });
			}
		} catch (error) {
			console.error('Failed to load notification preferences:', error);
		}

		if ('Notification' in window) {
			setPermission(Notification.permission);
		}
	}

	const savePreferences = (prefs: NotificationPreferences) => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(prefs));
		} catch (error) {
			console.error('Failed to save notification preferences:', error);
		}
	};

	const showNotification = (title: string, body: string, useBrowser: boolean = false) => {
		if (!browser) return;
		let permission: NotificationPermission = 'default';
		subscribePermission((p) => {
			permission = p;
		})();

		if (useBrowser && permission === 'granted' && 'Notification' in window) {
			new Notification(title, {
				body,
				icon: '/favicon.ico',
				tag: 'courtsync-notification'
			});
		} else {
			console.log(`[Notification] ${title}: ${body}`);
		}
	};

	return {
		preferences: { subscribe: subscribePrefs },
		notificationPermission: { subscribe: subscribePermission },
		requestPermission: async (): Promise<boolean> => {
			if (!browser) return false;
			if ('Notification' in window) {
				let currentPermission: NotificationPermission = 'default';
				subscribePermission((p) => {
					currentPermission = p;
				})();

				if (currentPermission === 'default') {
					const permission = await Notification.requestPermission();
					setPermission(permission);
					return permission === 'granted';
				}
				return currentPermission === 'granted';
			}
			return false;
		},
		checkUpcomingMatches: (matches: FilteredMatch[], followedTeamIds: string[]) => {
			let prefs: NotificationPreferences = DEFAULT_PREFERENCES;
			subscribePrefs((p) => {
				prefs = p;
			})();

			if (!prefs.upcomingMatchReminder) return;

			const now = Date.now();
			const reminderTime = prefs.reminderMinutes * 60 * 1000;

			matches.forEach((match) => {
				const matchTime = match.ScheduledStartDateTime;
				const timeUntilMatch = matchTime - now;

				const teamId = match.FirstTeamText || match.SecondTeamText;
				if (followedTeamIds.includes(teamId) && timeUntilMatch > 0 && timeUntilMatch <= reminderTime) {
					const notificationKey = `reminder-${match.MatchId}`;
					const lastNotified = browser ? localStorage.getItem(notificationKey) : null;
					if (!lastNotified || Date.now() - parseInt(lastNotified) > reminderTime) {
						const minutesUntil = Math.floor(timeUntilMatch / 60000);
						showNotification(
							`Match starting in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`,
							`${match.FirstTeamText} vs ${match.SecondTeamText}\n${new Date(matchTime).toLocaleTimeString()} - ${match.CourtName}`,
							prefs.browserNotifications
						);
						if (browser) {
							localStorage.setItem(notificationKey, Date.now().toString());
						}
					}
				}
			});
		},
		notifyScoreUpdate: (match: FilteredMatch, score: MatchScore) => {
			let prefs: NotificationPreferences = DEFAULT_PREFERENCES;
			subscribePrefs((p) => {
				prefs = p;
			})();

			if (!prefs.scoreUpdateNotification) return;

			const currentSet =
				score.sets.find((s) => s.completedAt === 0) || score.sets[score.sets.length - 1];
			const completedSets = score.sets.filter((s) => s.completedAt > 0);
			const team1Wins = completedSets.filter((s) => s.team1Score > s.team2Score).length;
			const team2Wins = completedSets.filter((s) => s.team2Score > s.team1Score).length;

			let message = `Score: ${currentSet.team1Score}-${currentSet.team2Score}`;
			if (completedSets.length > 0) {
				message = `Sets: ${team1Wins}-${team2Wins} | ${message}`;
			}

			showNotification(
				`${match.FirstTeamText} vs ${match.SecondTeamText}`,
				message,
				prefs.browserNotifications
			);
		},
		updatePreferences: (newPreferences: Partial<NotificationPreferences>) => {
			updatePrefs((prev) => {
				const next = { ...prev, ...newPreferences };
				savePreferences(next);
				return next;
			});
		}
	};
}

export const notifications = createNotifications();

