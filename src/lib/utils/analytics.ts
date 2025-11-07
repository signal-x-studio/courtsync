// Purpose: Analytics tracking utilities
// Note: Privacy-focused - no PII collected

import { analyticsStore } from '$lib/stores/analytics';
import { browser } from '$app/environment';

/**
 * Track page view
 * Call this in page components or layout
 */
export function trackPageView(path: string, title?: string) {
	if (!browser) return;
	analyticsStore.trackPageView(path, title);
}

/**
 * Track when user selects an event
 */
export function trackEventSelection(eventId: string) {
	analyticsStore.trackFeature('event', 'select', {
		eventId
	});
}

/**
 * Track when user selects a club
 */
export function trackClubSelection(clubId: number, clubName: string) {
	analyticsStore.trackFeature('club', 'select', {
		clubId,
		clubName
	});
}

/**
 * Track when user selects a persona
 */
export function trackPersonaSelection(persona: 'media' | 'spectator') {
	analyticsStore.trackFeature('persona', 'select', {
		persona
	});
}

/**
 * Track when user adds a favorite team
 */
export function trackFavoriteTeamAdd(teamId: number, teamName: string) {
	analyticsStore.trackFeature('favorites', 'add_team', {
		teamId,
		teamName
	});
}

/**
 * Track when user removes a favorite team
 */
export function trackFavoriteTeamRemove(teamId: number) {
	analyticsStore.trackFeature('favorites', 'remove_team', {
		teamId
	});
}

/**
 * Track when user adds a match to coverage
 */
export function trackCoverageAdd(matchId: number) {
	analyticsStore.trackFeature('coverage', 'add_match', {
		matchId
	});
}

/**
 * Track when user removes a match from coverage
 */
export function trackCoverageRemove(matchId: number) {
	analyticsStore.trackFeature('coverage', 'remove_match', {
		matchId
	});
}

/**
 * Track when user exports coverage plan
 */
export function trackCoverageExport(format: 'csv' | 'json') {
	analyticsStore.trackFeature('coverage', 'export', {
		format
	});
}

/**
 * Track when user locks a match for scoring
 */
export function trackMatchLock(matchId: number) {
	analyticsStore.trackFeature('scoring', 'lock_match', {
		matchId
	});
}

/**
 * Track when user unlocks a match
 */
export function trackMatchUnlock(matchId: number) {
	analyticsStore.trackFeature('scoring', 'unlock_match', {
		matchId
	});
}

/**
 * Track when user updates a score
 */
export function trackScoreUpdate(matchId: number, setNumber: number) {
	analyticsStore.trackFeature('scoring', 'update_score', {
		matchId,
		setNumber
	});
}

/**
 * Track when user completes a set
 */
export function trackSetComplete(matchId: number, setNumber: number) {
	analyticsStore.trackFeature('scoring', 'complete_set', {
		matchId,
		setNumber
	});
}

/**
 * Track when user uses share functionality
 */
export function trackShare(contentType: 'match' | 'team' | 'coverage', method: 'share' | 'copy') {
	analyticsStore.trackFeature('share', method, {
		contentType
	});
}

/**
 * Track when user filters matches
 */
export function trackMatchFilter(filterType: string, value: string | number) {
	analyticsStore.trackFeature('filter', 'apply', {
		filterType,
		value: String(value)
	});
}

/**
 * Track when user views team details
 */
export function trackTeamView(teamId: number, teamName: string) {
	analyticsStore.trackFeature('team', 'view_details', {
		teamId,
		teamName
	});
}

/**
 * Track when user views match details
 */
export function trackMatchView(matchId: number) {
	analyticsStore.trackFeature('match', 'view_details', {
		matchId
	});
}

/**
 * Track when user installs PWA
 */
export function trackPWAInstall() {
	analyticsStore.trackFeature('pwa', 'install', {
		platform: browser ? navigator.platform : 'unknown'
	});
}

/**
 * Track when user enables notifications
 */
export function trackNotificationsEnable() {
	analyticsStore.trackFeature('notifications', 'enable', {
		permission: browser ? Notification.permission : 'unknown'
	});
}

/**
 * Track when user disables notifications
 */
export function trackNotificationsDisable() {
	analyticsStore.trackFeature('notifications', 'disable');
}

/**
 * Track JavaScript errors
 */
export function trackError(error: Error, context?: string) {
	analyticsStore.trackError(error.message, context);
}

/**
 * Track API errors
 */
export function trackAPIError(endpoint: string, status: number, message: string) {
	analyticsStore.trackError(`API Error: ${message}`, `${endpoint} (${status})`);
}

/**
 * Track when user searches
 */
export function trackSearch(query: string, resultsCount: number) {
	analyticsStore.trackFeature('search', 'query', {
		queryLength: query.length,
		resultsCount
	});
}

/**
 * Initialize global error tracking
 * Call this once in your app initialization
 */
export function initErrorTracking() {
	if (!browser) return;

	// Track unhandled errors
	window.addEventListener('error', (event) => {
		trackError(new Error(event.message), `${event.filename}:${event.lineno}`);
	});

	// Track unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		trackError(new Error(String(event.reason)), 'Unhandled Promise Rejection');
	});
}

/**
 * Format session duration for display
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}

/**
 * Get event type color class
 */
export function getEventTypeColor(type: string): string {
	switch (type) {
		case 'page_view':
			return 'text-blue-500';
		case 'feature_usage':
			return 'text-green-500';
		case 'persona_selection':
			return 'text-purple-500';
		case 'error':
			return 'text-red-500';
		default:
			return 'text-gray-500';
	}
}
