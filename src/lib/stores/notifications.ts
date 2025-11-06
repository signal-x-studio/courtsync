// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
// Purpose: Store for notification preferences and permission status
// Note: Tracks whether user wants notifications for favorite teams

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface NotificationPreferences {
	enabled: boolean;
	permission: NotificationPermission;
	minutesBefore: number; // How many minutes before match to notify
}

const DEFAULT_PREFS: NotificationPreferences = {
	enabled: false,
	permission: 'default',
	minutesBefore: 15
};

function createNotificationPrefs() {
	const stored = browser ? localStorage.getItem('notification-prefs') : null;
	const initial = stored ? JSON.parse(stored) : DEFAULT_PREFS;

	const { subscribe, set, update } = writable<NotificationPreferences>(initial);

	// Sync to localStorage
	if (browser) {
		subscribe((value) => {
			localStorage.setItem('notification-prefs', JSON.stringify(value));
		});
	}

	return {
		subscribe,
		set,
		update,
		enable: () => update((prefs) => ({ ...prefs, enabled: true })),
		disable: () => update((prefs) => ({ ...prefs, enabled: false })),
		setPermission: (permission: NotificationPermission) =>
			update((prefs) => ({ ...prefs, permission })),
		setMinutesBefore: (minutes: number) =>
			update((prefs) => ({ ...prefs, minutesBefore: minutes }))
	};
}

export const notificationPrefs = createNotificationPrefs();
