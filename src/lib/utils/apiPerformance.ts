// Purpose: Monitor API performance and response times
// Note: Tracks AES API and Supabase query performance

import { performanceStore, type APIMetric, type RealtimeMetric } from '$lib/stores/performance';

/**
 * Measure API request performance
 * Wrap fetch calls with this function to track performance
 */
export async function measureAPICall<T>(
	endpoint: string,
	method: string,
	apiCall: () => Promise<T>
): Promise<T> {
	const startTime = performance.now();
	let success = false;
	let status = 0;

	try {
		const result = await apiCall();
		success = true;
		status = 200; // Assuming success means 200
		return result;
	} catch (error) {
		success = false;
		status = 500; // Assuming error means 500
		throw error;
	} finally {
		const duration = performance.now() - startTime;

		const metric: APIMetric = {
			endpoint,
			method,
			duration,
			status,
			timestamp: Date.now(),
			success
		};

		performanceStore.addAPIMetric(metric);

		// Log slow requests in development
		if (import.meta.env.DEV && duration > 1000) {
			console.warn(`[API Performance] Slow request: ${method} ${endpoint} took ${Math.round(duration)}ms`);
		}

		// Alert on very slow requests
		if (duration > 5000) {
			console.error(`[API Performance] Very slow request: ${method} ${endpoint} took ${Math.round(duration)}ms`);
		}
	}
}

/**
 * Create a wrapper for fetch that automatically tracks performance
 */
export function createPerformanceTrackedFetch(
	originalFetch: typeof fetch = fetch
): typeof fetch {
	return async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		const method = init?.method || 'GET';
		const startTime = performance.now();

		try {
			const response = await originalFetch(input, init);
			const duration = performance.now() - startTime;

			const metric: APIMetric = {
				endpoint: url,
				method,
				duration,
				status: response.status,
				timestamp: Date.now(),
				success: response.ok
			};

			performanceStore.addAPIMetric(metric);

			return response;
		} catch (error) {
			const duration = performance.now() - startTime;

			const metric: APIMetric = {
				endpoint: url,
				method,
				duration,
				status: 0,
				timestamp: Date.now(),
				success: false
			};

			performanceStore.addAPIMetric(metric);

			throw error;
		}
	};
}

/**
 * Track real-time subscription latency
 * Call this when receiving real-time events
 */
export function trackRealtimeLatency(event: string, eventTimestamp: number) {
	const now = Date.now();
	const latency = now - eventTimestamp;

	const metric: RealtimeMetric = {
		event,
		latency,
		timestamp: now
	};

	performanceStore.addRealtimeMetric(metric);

	// Log high latency in development
	if (import.meta.env.DEV && latency > 1000) {
		console.warn(
			`[Realtime Performance] High latency for ${event}: ${latency}ms`
		);
	}
}

/**
 * Get API performance statistics
 */
export function getAPIStats(metrics: APIMetric[]) {
	if (metrics.length === 0) {
		return {
			count: 0,
			avgDuration: 0,
			minDuration: 0,
			maxDuration: 0,
			p50Duration: 0,
			p95Duration: 0,
			p99Duration: 0,
			successRate: 0,
			errorRate: 0
		};
	}

	const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
	const successCount = metrics.filter((m) => m.success).length;

	return {
		count: metrics.length,
		avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
		minDuration: durations[0] || 0,
		maxDuration: durations[durations.length - 1] || 0,
		p50Duration: durations[Math.floor(durations.length * 0.5)] || 0,
		p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
		p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
		successRate: successCount / metrics.length,
		errorRate: (metrics.length - successCount) / metrics.length
	};
}

/**
 * Get alerts for performance degradation
 */
export function getPerformanceAlerts(metrics: APIMetric[]): string[] {
	const alerts: string[] = [];
	const stats = getAPIStats(metrics);

	// Alert on high average duration
	if (stats.avgDuration > 2000) {
		alerts.push(`High average API response time: ${Math.round(stats.avgDuration)}ms`);
	}

	// Alert on high p95 duration
	if (stats.p95Duration > 5000) {
		alerts.push(`95th percentile response time is very slow: ${Math.round(stats.p95Duration)}ms`);
	}

	// Alert on high error rate
	if (stats.errorRate > 0.1) {
		alerts.push(`High API error rate: ${(stats.errorRate * 100).toFixed(1)}%`);
	}

	// Alert on slow recent requests (last 10)
	const recentMetrics = metrics.slice(-10);
	const recentAvg = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
	if (recentAvg > 3000) {
		alerts.push(`Recent API calls are slow: ${Math.round(recentAvg)}ms average`);
	}

	return alerts;
}

/**
 * Format duration for display
 */
export function formatDuration(duration: number): string {
	if (duration < 1000) {
		return `${Math.round(duration)}ms`;
	}
	return `${(duration / 1000).toFixed(2)}s`;
}

/**
 * Get duration color class based on performance
 */
export function getDurationColor(duration: number): string {
	if (duration < 500) return 'text-green-500';
	if (duration < 1000) return 'text-yellow-500';
	if (duration < 2000) return 'text-orange-500';
	return 'text-red-500';
}
