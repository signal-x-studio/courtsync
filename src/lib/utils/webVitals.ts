// Reference: https://github.com/GoogleChrome/web-vitals
// Purpose: Track Web Vitals performance metrics
// Note: Monitors CLS, FID, FCP, LCP, TTFB, INP for real user monitoring

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { performanceStore, type WebVitalsMetric } from '$lib/stores/performance';

// Rating thresholds based on Web Vitals recommendations
const THRESHOLDS = {
	CLS: { good: 0.1, poor: 0.25 },
	FID: { good: 100, poor: 300 },
	FCP: { good: 1800, poor: 3000 },
	LCP: { good: 2500, poor: 4000 },
	TTFB: { good: 800, poor: 1800 },
	INP: { good: 200, poor: 500 }
};

/**
 * Get rating for a metric value
 */
function getRating(
	name: keyof typeof THRESHOLDS,
	value: number
): 'good' | 'needs-improvement' | 'poor' {
	const threshold = THRESHOLDS[name];
	if (value <= threshold.good) return 'good';
	if (value <= threshold.poor) return 'needs-improvement';
	return 'poor';
}

/**
 * Convert web-vitals Metric to our WebVitalsMetric type
 */
function convertMetric(metric: Metric): WebVitalsMetric {
	return {
		name: metric.name as WebVitalsMetric['name'],
		value: metric.value,
		rating: getRating(metric.name as keyof typeof THRESHOLDS, metric.value),
		delta: metric.delta,
		id: metric.id,
		timestamp: Date.now()
	};
}

/**
 * Handle metric callback and store in performanceStore
 */
function handleMetric(metric: Metric) {
	const webVital = convertMetric(metric);
	performanceStore.addWebVital(webVital);

	// Log to console in development
	if (import.meta.env.DEV) {
		console.log(`[Web Vitals] ${webVital.name}:`, {
			value: webVital.value,
			rating: webVital.rating,
			delta: webVital.delta
		});
	}

	// Send to analytics or monitoring service (optional)
	reportToAnalytics(webVital);
}

/**
 * Report metric to analytics/monitoring service
 * Override this function to integrate with your analytics provider
 */
function reportToAnalytics(metric: WebVitalsMetric) {
	// Example: Send to Google Analytics
	// if (window.gtag) {
	//   window.gtag('event', metric.name, {
	//     value: Math.round(metric.value),
	//     metric_rating: metric.rating,
	//     metric_delta: metric.delta,
	//   });
	// }

	// Example: Send to custom endpoint
	// fetch('/api/analytics/vitals', {
	//   method: 'POST',
	//   headers: { 'Content-Type': 'application/json' },
	//   body: JSON.stringify(metric),
	// });

	// For now, just log that it would be reported
	if (import.meta.env.DEV) {
		console.log('[Web Vitals] Would report to analytics:', metric);
	}
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app, typically in +layout.svelte
 */
export function initWebVitals() {
	// Only run in browser
	if (typeof window === 'undefined') return;

	// Track all Core Web Vitals
	onCLS(handleMetric, { reportAllChanges: true });
	onFID(handleMetric);
	onFCP(handleMetric);
	onLCP(handleMetric, { reportAllChanges: true });
	onTTFB(handleMetric);
	onINP(handleMetric, { reportAllChanges: true });

	if (import.meta.env.DEV) {
		console.log('[Web Vitals] Tracking initialized');
	}
}

/**
 * Get performance recommendations based on metrics
 */
export function getRecommendations(metrics: WebVitalsMetric[]): string[] {
	const recommendations: string[] = [];

	metrics.forEach((metric) => {
		if (metric.rating === 'poor' || metric.rating === 'needs-improvement') {
			switch (metric.name) {
				case 'CLS':
					recommendations.push(
						'Layout Shift: Consider adding size attributes to images/videos, avoid inserting content above existing content'
					);
					break;
				case 'FID':
					recommendations.push(
						'Input Delay: Break up long JavaScript tasks, use web workers for heavy computation'
					);
					break;
				case 'FCP':
					recommendations.push(
						'First Contentful Paint: Optimize server response time, eliminate render-blocking resources'
					);
					break;
				case 'LCP':
					recommendations.push(
						'Largest Contentful Paint: Optimize images, preload critical resources, improve server response'
					);
					break;
				case 'TTFB':
					recommendations.push(
						'Time to First Byte: Optimize server performance, use CDN, implement caching'
					);
					break;
				case 'INP':
					recommendations.push(
						'Interaction to Next Paint: Optimize event handlers, reduce main thread work'
					);
					break;
			}
		}
	});

	return recommendations;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: string, value: number): string {
	switch (name) {
		case 'CLS':
			return value.toFixed(3);
		case 'FID':
		case 'FCP':
		case 'LCP':
		case 'TTFB':
		case 'INP':
			return `${Math.round(value)}ms`;
		default:
			return value.toString();
	}
}

/**
 * Get color class for rating
 */
export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
	switch (rating) {
		case 'good':
			return 'text-green-500';
		case 'needs-improvement':
			return 'text-yellow-500';
		case 'poor':
			return 'text-red-500';
	}
}
