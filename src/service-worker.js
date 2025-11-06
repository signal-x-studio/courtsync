// Reference: https://kit.svelte.dev/docs/service-workers
// Purpose: Service worker for offline support with intelligent caching
// Note: Caches app shell and API responses, but not real-time score data

import { build, files, version } from '$service-worker';

// Create a unique cache name for this version
const CACHE = `cache-${version}`;

// Assets to cache immediately on install
const ASSETS = [
	...build, // Generated SvelteKit build files
	...files  // Static files from /static
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
	// Ignore non-GET requests
	if (event.request.method !== 'GET') return;

	const { request } = event;
	const url = new URL(request.url);

	// Strategy 1: Cache-first for build assets and static files
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	// Strategy 2: Network-only for Supabase (real-time scores)
	if (url.hostname.includes('supabase')) {
		event.respondWith(networkOnly(request));
		return;
	}

	// Strategy 3: Network-first for AES API (tournament data)
	if (url.pathname.startsWith('/api/aes/') || url.hostname.includes('advancedeventsystems.com')) {
		event.respondWith(networkFirst(request));
		return;
	}

	// Strategy 4: Network-first for same-origin requests (SvelteKit pages)
	if (url.origin === self.location.origin) {
		event.respondWith(networkFirst(request));
		return;
	}

	// Default: network-only for everything else
	event.respondWith(networkOnly(request));
});

/**
 * Cache-first strategy: Check cache first, then network
 * Best for static assets that don't change often
 */
async function cacheFirst(request) {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		// Return a basic offline page or error
		return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
	}
}

/**
 * Network-first strategy: Try network first, fallback to cache
 * Best for dynamic content that should be fresh but can be stale
 */
async function networkFirst(request) {
	const cache = await caches.open(CACHE);

	try {
		const response = await fetch(request);
		if (response.ok) {
			// Cache successful responses for offline access
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		// Network failed, try cache
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}
		// No cache available
		return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
	}
}

/**
 * Network-only strategy: Always use network, no caching
 * Best for real-time data that must always be fresh
 */
async function networkOnly(request) {
	try {
		return await fetch(request);
	} catch {
		return new Response('Network Error', { status: 503, statusText: 'Service Unavailable' });
	}
}
