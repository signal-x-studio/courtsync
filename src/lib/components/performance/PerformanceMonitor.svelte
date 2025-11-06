<!--
  Purpose: Display performance metrics during development
  Note: Only shows in development mode, can be toggled with keyboard shortcut
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { performanceStore } from '$lib/stores/performance';
	import { formatMetricValue, getRatingColor, getRecommendations } from '$lib/utils/webVitals';
	import { getAPIStats, formatDuration, getDurationColor, getPerformanceAlerts } from '$lib/utils/apiPerformance';

	let showMonitor = $state(false);
	let expanded = $state(false);
	let activeTab = $state<'vitals' | 'api' | 'realtime'>('vitals');

	// Only show in development
	const isDev = import.meta.env.DEV;

	// Subscribe to performance data
	let performanceData = $state($performanceStore);

	$effect(() => {
		performanceData = $performanceStore;
	});

	// Derived data
	let summary = $derived(performanceStore.getSummary(performanceData));
	let apiStats = $derived(getAPIStats(performanceData.apiMetrics));
	let recommendations = $derived(getRecommendations(performanceData.webVitals));
	let alerts = $derived(getPerformanceAlerts(performanceData.apiMetrics));

	onMount(() => {
		// Toggle monitor with Ctrl+Shift+P
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				e.preventDefault();
				showMonitor = !showMonitor;
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	});

	function clearMetrics() {
		performanceStore.clear();
	}
</script>

{#if isDev && showMonitor}
	<div class="performance-monitor fixed bottom-4 right-4 z-50 w-96 rounded-lg border border-court-gold/30 bg-court-dark shadow-lg">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-court-gold/20 px-4 py-2">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
				<h3 class="font-semibold text-court-gold">Performance Monitor</h3>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={() => (expanded = !expanded)}
					class="text-gray-400 transition-colors hover:text-court-gold"
					title={expanded ? 'Collapse' : 'Expand'}
				>
					{expanded ? '▼' : '▲'}
				</button>
				<button
					onclick={clearMetrics}
					class="text-gray-400 transition-colors hover:text-court-gold"
					title="Clear metrics"
				>
					🗑️
				</button>
				<button
					onclick={() => (showMonitor = false)}
					class="text-gray-400 transition-colors hover:text-red-500"
					title="Close (Ctrl+Shift+P)"
				>
					✕
				</button>
			</div>
		</div>

		{#if expanded}
			<!-- Tabs -->
			<div class="flex border-b border-court-gold/20">
				<button
					onclick={() => (activeTab = 'vitals')}
					class="flex-1 px-4 py-2 text-sm transition-colors {activeTab === 'vitals'
						? 'bg-court-gold/10 text-court-gold'
						: 'text-gray-400 hover:text-court-gold'}"
				>
					Web Vitals
				</button>
				<button
					onclick={() => (activeTab = 'api')}
					class="flex-1 px-4 py-2 text-sm transition-colors {activeTab === 'api'
						? 'bg-court-gold/10 text-court-gold'
						: 'text-gray-400 hover:text-court-gold'}"
				>
					API
				</button>
				<button
					onclick={() => (activeTab = 'realtime')}
					class="flex-1 px-4 py-2 text-sm transition-colors {activeTab === 'realtime'
						? 'bg-court-gold/10 text-court-gold'
						: 'text-gray-400 hover:text-court-gold'}"
				>
					Realtime
				</button>
			</div>

			<!-- Content -->
			<div class="max-h-96 overflow-y-auto p-4">
				{#if activeTab === 'vitals'}
					<div class="space-y-3">
						{#each Object.entries(summary.webVitals) as [key, metric]}
							{#if metric}
								<div class="rounded border border-court-gold/20 p-2">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-gray-300">{metric.name}</span>
										<span class="text-sm {getRatingColor(metric.rating)}">
											{formatMetricValue(metric.name, metric.value)}
										</span>
									</div>
									<div class="mt-1 text-xs text-gray-500">
										Rating: <span class={getRatingColor(metric.rating)}>{metric.rating}</span>
									</div>
								</div>
							{/if}
						{/each}

						{#if recommendations.length > 0}
							<div class="mt-4 rounded border border-yellow-500/30 bg-yellow-500/10 p-3">
								<h4 class="text-sm font-semibold text-yellow-500">Recommendations</h4>
								<ul class="mt-2 space-y-1 text-xs text-gray-400">
									{#each recommendations as rec}
										<li>• {rec}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'api'}
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-2">
							<div class="rounded border border-court-gold/20 p-2">
								<div class="text-xs text-gray-500">Total Calls</div>
								<div class="text-lg font-semibold text-court-gold">{apiStats.count}</div>
							</div>
							<div class="rounded border border-court-gold/20 p-2">
								<div class="text-xs text-gray-500">Avg Duration</div>
								<div class="text-lg font-semibold {getDurationColor(apiStats.avgDuration)}">
									{formatDuration(apiStats.avgDuration)}
								</div>
							</div>
							<div class="rounded border border-court-gold/20 p-2">
								<div class="text-xs text-gray-500">P95 Duration</div>
								<div class="text-lg font-semibold {getDurationColor(apiStats.p95Duration)}">
									{formatDuration(apiStats.p95Duration)}
								</div>
							</div>
							<div class="rounded border border-court-gold/20 p-2">
								<div class="text-xs text-gray-500">Success Rate</div>
								<div class="text-lg font-semibold text-green-500">
									{(apiStats.successRate * 100).toFixed(1)}%
								</div>
							</div>
						</div>

						{#if alerts.length > 0}
							<div class="rounded border border-red-500/30 bg-red-500/10 p-3">
								<h4 class="text-sm font-semibold text-red-500">Alerts</h4>
								<ul class="mt-2 space-y-1 text-xs text-gray-400">
									{#each alerts as alert}
										<li>⚠️ {alert}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Recent API calls -->
						<div class="mt-4">
							<h4 class="mb-2 text-xs font-semibold text-gray-400">Recent Calls</h4>
							<div class="space-y-1">
								{#each performanceData.apiMetrics.slice(-5).reverse() as metric}
									<div class="rounded border border-court-gold/20 p-2 text-xs">
										<div class="flex items-center justify-between">
											<span class="font-mono text-gray-400">{metric.method}</span>
											<span class={getDurationColor(metric.duration)}>
												{formatDuration(metric.duration)}
											</span>
										</div>
										<div class="mt-1 truncate text-gray-500" title={metric.endpoint}>
											{metric.endpoint}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if activeTab === 'realtime'}
					<div class="space-y-3">
						<div class="rounded border border-court-gold/20 p-2">
							<div class="text-xs text-gray-500">Total Events</div>
							<div class="text-lg font-semibold text-court-gold">
								{summary.realtime.count}
							</div>
						</div>
						<div class="rounded border border-court-gold/20 p-2">
							<div class="text-xs text-gray-500">Avg Latency</div>
							<div class="text-lg font-semibold {getDurationColor(summary.realtime.avgLatency)}">
								{formatDuration(summary.realtime.avgLatency)}
							</div>
						</div>

						<!-- Recent events -->
						<div class="mt-4">
							<h4 class="mb-2 text-xs font-semibold text-gray-400">Recent Events</h4>
							<div class="space-y-1">
								{#each performanceData.realtimeMetrics.slice(-5).reverse() as metric}
									<div class="rounded border border-court-gold/20 p-2 text-xs">
										<div class="flex items-center justify-between">
											<span class="text-gray-400">{metric.event}</span>
											<span class={getDurationColor(metric.latency)}>
												{formatDuration(metric.latency)}
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-court-gold/20 px-4 py-2 text-xs text-gray-500">
				Session: {formatDuration(summary.sessionDuration)}
			</div>
		{:else}
			<!-- Collapsed summary -->
			<div class="px-4 py-2 text-xs">
				<div class="flex items-center justify-between">
					<span class="text-gray-400">Web Vitals</span>
					<span class="font-mono text-court-gold">
						{Object.values(summary.webVitals).filter(Boolean).length}/6
					</span>
				</div>
				<div class="mt-1 flex items-center justify-between">
					<span class="text-gray-400">API Calls</span>
					<span class="font-mono text-court-gold">{apiStats.count}</span>
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if isDev && !showMonitor}
	<!-- Floating button to show monitor -->
	<button
		onclick={() => (showMonitor = true)}
		class="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-court-gold text-court-dark shadow-lg transition-transform hover:scale-110"
		title="Performance Monitor (Ctrl+Shift+P)"
	>
		📊
	</button>
{/if}

<style>
	.performance-monitor {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
	}
</style>
