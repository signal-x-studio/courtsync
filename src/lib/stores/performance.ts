// Reference: https://web.dev/vitals/
// Purpose: Store and manage performance metrics
// Note: Collects Web Vitals and API performance data for monitoring

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Web Vitals metrics
export interface WebVitalsMetric {
	name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
	value: number;
	rating: 'good' | 'needs-improvement' | 'poor';
	delta: number;
	id: string;
	timestamp: number;
}

// API performance metrics
export interface APIMetric {
	endpoint: string;
	method: string;
	duration: number;
	status: number;
	timestamp: number;
	success: boolean;
}

// Real-time subscription metrics
export interface RealtimeMetric {
	event: string;
	latency: number;
	timestamp: number;
}

// Performance summary
export interface PerformanceData {
	webVitals: WebVitalsMetric[];
	apiMetrics: APIMetric[];
	realtimeMetrics: RealtimeMetric[];
	startTime: number;
}

const DEFAULT_DATA: PerformanceData = {
	webVitals: [],
	apiMetrics: [],
	realtimeMetrics: [],
	startTime: Date.now()
};

// Load from sessionStorage (performance data is session-specific)
function loadPerformanceData(): PerformanceData {
	if (!browser) return DEFAULT_DATA;

	try {
		const stored = sessionStorage.getItem('performance-data');
		if (stored) {
			const data = JSON.parse(stored);
			return { ...DEFAULT_DATA, ...data };
		}
	} catch (error) {
		console.warn('Failed to load performance data:', error);
	}

	return DEFAULT_DATA;
}

// Create performance store
function createPerformanceStore() {
	const { subscribe, set, update } = writable<PerformanceData>(loadPerformanceData());

	// Save to sessionStorage on update
	if (browser) {
		subscribe((data) => {
			try {
				// Only keep last 100 metrics of each type to prevent memory issues
				const trimmedData = {
					...data,
					webVitals: data.webVitals.slice(-100),
					apiMetrics: data.apiMetrics.slice(-100),
					realtimeMetrics: data.realtimeMetrics.slice(-100)
				};
				sessionStorage.setItem('performance-data', JSON.stringify(trimmedData));
			} catch (error) {
				console.warn('Failed to save performance data:', error);
			}
		});
	}

	return {
		subscribe,
		set,
		update,

		// Add Web Vitals metric
		addWebVital: (metric: WebVitalsMetric) => {
			update((data) => ({
				...data,
				webVitals: [...data.webVitals, metric]
			}));
		},

		// Add API metric
		addAPIMetric: (metric: APIMetric) => {
			update((data) => ({
				...data,
				apiMetrics: [...data.apiMetrics, metric]
			}));
		},

		// Add realtime metric
		addRealtimeMetric: (metric: RealtimeMetric) => {
			update((data) => ({
				...data,
				realtimeMetrics: [...data.realtimeMetrics, metric]
			}));
		},

		// Clear all metrics
		clear: () => {
			set({
				webVitals: [],
				apiMetrics: [],
				realtimeMetrics: [],
				startTime: Date.now()
			});
		},

		// Get performance summary
		getSummary: (data: PerformanceData) => {
			return {
				webVitals: {
					cls: data.webVitals.find((m) => m.name === 'CLS'),
					fid: data.webVitals.find((m) => m.name === 'FID'),
					fcp: data.webVitals.find((m) => m.name === 'FCP'),
					lcp: data.webVitals.find((m) => m.name === 'LCP'),
					ttfb: data.webVitals.find((m) => m.name === 'TTFB'),
					inp: data.webVitals.find((m) => m.name === 'INP')
				},
				api: {
					count: data.apiMetrics.length,
					avgDuration:
						data.apiMetrics.length > 0
							? data.apiMetrics.reduce((sum, m) => sum + m.duration, 0) /
								data.apiMetrics.length
							: 0,
					errorRate:
						data.apiMetrics.length > 0
							? data.apiMetrics.filter((m) => !m.success).length / data.apiMetrics.length
							: 0
				},
				realtime: {
					count: data.realtimeMetrics.length,
					avgLatency:
						data.realtimeMetrics.length > 0
							? data.realtimeMetrics.reduce((sum, m) => sum + m.latency, 0) /
								data.realtimeMetrics.length
							: 0
				},
				sessionDuration: Date.now() - data.startTime
			};
		}
	};
}

export const performanceStore = createPerformanceStore();
