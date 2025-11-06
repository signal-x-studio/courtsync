// Purpose: Store and manage analytics events
// Note: Privacy-focused - no PII collected

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Analytics event types
export interface AnalyticsEvent {
	type: 'page_view' | 'feature_usage' | 'persona_selection' | 'error';
	name: string;
	properties?: Record<string, string | number | boolean>;
	timestamp: number;
	sessionId: string;
}

// Analytics summary
export interface AnalyticsSummary {
	totalEvents: number;
	pageViews: number;
	featureUsage: number;
	errors: number;
	topPages: Array<{ page: string; count: number }>;
	topFeatures: Array<{ feature: string; count: number }>;
	sessionDuration: number;
}

// Generate session ID (persists for session)
function getSessionId(): string {
	if (!browser) return '';

	let sessionId = sessionStorage.getItem('analytics-session-id');
	if (!sessionId) {
		sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
		sessionStorage.setItem('analytics-session-id', sessionId);
	}
	return sessionId;
}

// Analytics preferences
export interface AnalyticsPreferences {
	enabled: boolean;
	consentGiven: boolean;
}

const DEFAULT_PREFS: AnalyticsPreferences = {
	enabled: true,
	consentGiven: false
};

// Load preferences from localStorage
function loadPreferences(): AnalyticsPreferences {
	if (!browser) return DEFAULT_PREFS;

	try {
		const stored = localStorage.getItem('analytics-preferences');
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.warn('Failed to load analytics preferences:', error);
	}

	return DEFAULT_PREFS;
}

// Create analytics preferences store
function createPreferencesStore() {
	const { subscribe, set, update } = writable<AnalyticsPreferences>(loadPreferences());

	if (browser) {
		subscribe((prefs) => {
			try {
				localStorage.setItem('analytics-preferences', JSON.stringify(prefs));
			} catch (error) {
				console.warn('Failed to save analytics preferences:', error);
			}
		});
	}

	return {
		subscribe,
		set,
		update,
		enable: () => update((prefs) => ({ ...prefs, enabled: true })),
		disable: () => update((prefs) => ({ ...prefs, enabled: false })),
		giveConsent: () => update((prefs) => ({ ...prefs, consentGiven: true, enabled: true })),
		revokeConsent: () => update((prefs) => ({ ...prefs, consentGiven: false, enabled: false }))
	};
}

export const analyticsPreferences = createPreferencesStore();

// Create analytics events store
function createAnalyticsStore() {
	const events = writable<AnalyticsEvent[]>([]);

	return {
		subscribe: events.subscribe,

		// Track an event
		track: (
			type: AnalyticsEvent['type'],
			name: string,
			properties?: Record<string, string | number | boolean>
		) => {
			if (!browser) return;

			// Check if analytics is enabled
			const prefs = loadPreferences();
			if (!prefs.enabled || !prefs.consentGiven) {
				if (import.meta.env.DEV) {
					console.log('[Analytics] Tracking disabled or no consent');
				}
				return;
			}

			const event: AnalyticsEvent = {
				type,
				name,
				properties,
				timestamp: Date.now(),
				sessionId: getSessionId()
			};

			events.update((current) => {
				// Keep only last 1000 events
				const updated = [...current, event].slice(-1000);

				// Store in sessionStorage
				try {
					sessionStorage.setItem('analytics-events', JSON.stringify(updated.slice(-100)));
				} catch (error) {
					console.warn('Failed to save analytics events:', error);
				}

				return updated;
			});

			// Log in development
			if (import.meta.env.DEV) {
				console.log('[Analytics]', type, name, properties);
			}

			// Send to analytics service (if configured)
			sendToAnalyticsService(event);
		},

		// Track page view
		trackPageView: (path: string, title?: string) => {
			analyticsStore.track('page_view', path, {
				title: title || path,
				referrer: browser ? document.referrer : ''
			});
		},

		// Track feature usage
		trackFeature: (feature: string, action: string, metadata?: Record<string, string | number | boolean>) => {
			analyticsStore.track('feature_usage', `${feature}:${action}`, metadata);
		},

		// Track error
		trackError: (error: string, context?: string) => {
			analyticsStore.track('error', error, {
				context: context || 'unknown',
				userAgent: browser ? navigator.userAgent : ''
			});
		},

		// Get summary
		getSummary: (events: AnalyticsEvent[]): AnalyticsSummary => {
			const pageViews = events.filter((e) => e.type === 'page_view');
			const featureUsage = events.filter((e) => e.type === 'feature_usage');
			const errors = events.filter((e) => e.type === 'error');

			// Count page views
			const pageViewCounts = new Map<string, number>();
			pageViews.forEach((e) => {
				const count = pageViewCounts.get(e.name) || 0;
				pageViewCounts.set(e.name, count + 1);
			});

			// Count feature usage
			const featureCounts = new Map<string, number>();
			featureUsage.forEach((e) => {
				const count = featureCounts.get(e.name) || 0;
				featureCounts.set(e.name, count + 1);
			});

			// Sort and limit
			const topPages = Array.from(pageViewCounts.entries())
				.map(([page, count]) => ({ page, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			const topFeatures = Array.from(featureCounts.entries())
				.map(([feature, count]) => ({ feature, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			// Calculate session duration
			const firstEvent = events[0];
			const lastEvent = events[events.length - 1];
			const sessionDuration = firstEvent && lastEvent
				? lastEvent.timestamp - firstEvent.timestamp
				: 0;

			return {
				totalEvents: events.length,
				pageViews: pageViews.length,
				featureUsage: featureUsage.length,
				errors: errors.length,
				topPages,
				topFeatures,
				sessionDuration
			};
		},

		// Clear all events
		clear: () => {
			events.set([]);
			if (browser) {
				sessionStorage.removeItem('analytics-events');
			}
		}
	};
}

export const analyticsStore = createAnalyticsStore();

/**
 * Send event to analytics service
 * Override this function to integrate with Plausible, Fathom, or custom endpoint
 */
function sendToAnalyticsService(event: AnalyticsEvent) {
	// Example: Plausible integration
	// if (window.plausible) {
	//   window.plausible(event.name, { props: event.properties });
	// }

	// Example: Fathom integration
	// if (window.fathom) {
	//   window.fathom.trackEvent(event.name, event.properties);
	// }

	// Example: Custom endpoint
	// fetch('/api/analytics', {
	//   method: 'POST',
	//   headers: { 'Content-Type': 'application/json' },
	//   body: JSON.stringify(event),
	// });

	// For now, just log that it would be sent
	if (import.meta.env.DEV) {
		console.log('[Analytics] Would send to service:', event);
	}
}
