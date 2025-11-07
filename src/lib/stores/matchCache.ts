// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Cached match data store with TTL to reduce API calls
// Note: Only real-time updates for individual match scoring view

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Match } from '$lib/types/aes';

interface CachedMatchData {
	matches: Match[];
	timestamp: number;
	eventId: string;
	clubId: number;
}

// Cache TTL: 5 minutes (in milliseconds)
const CACHE_TTL = 5 * 60 * 1000;

function createMatchCacheStore() {
	const stored = browser ? localStorage.getItem('match-cache') : null;
	let initial: CachedMatchData | null = null;

	if (stored) {
		try {
			initial = JSON.parse(stored);
		} catch (err) {
			console.error('Failed to parse cached match data:', err);
		}
	}

	const { subscribe, set, update } = writable<CachedMatchData | null>(initial);

	return {
		subscribe,

		// Get cached data if valid
		get: (eventId: string, clubId: number): Match[] | null => {
			if (!initial) return null;

			// Check if cache is for the same event/club
			if (initial.eventId !== eventId || initial.clubId !== clubId) {
				return null;
			}

			// Check if cache is still valid (within TTL)
			const now = Date.now();
			const age = now - initial.timestamp;
			if (age > CACHE_TTL) {
				return null; // Cache expired
			}

			return initial.matches;
		},

		// Save matches to cache
		save: (matches: Match[], eventId: string, clubId: number) => {
			const cacheData: CachedMatchData = {
				matches,
				timestamp: Date.now(),
				eventId,
				clubId
			};

			set(cacheData);
			initial = cacheData;

			if (browser) {
				try {
					localStorage.setItem('match-cache', JSON.stringify(cacheData));
				} catch (err) {
					console.error('Failed to save match cache:', err);
				}
			}
		},

		// Clear cache (for manual refresh)
		clear: () => {
			set(null);
			initial = null;
			if (browser) {
				localStorage.removeItem('match-cache');
			}
		},

		// Check if cache is valid
		isValid: (eventId: string, clubId: number): boolean => {
			if (!initial) return false;
			if (initial.eventId !== eventId || initial.clubId !== clubId) return false;

			const now = Date.now();
			const age = now - initial.timestamp;
			return age <= CACHE_TTL;
		},

		// Get cache age in seconds
		getAge: (): number | null => {
			if (!initial) return null;
			const now = Date.now();
			return Math.floor((now - initial.timestamp) / 1000);
		}
	};
}

export const matchCache = createMatchCacheStore();
