// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Coverage plan store for Media persona
// Note: Syncs with Supabase for authenticated users, localStorage for anonymous

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import { auth } from './auth';

interface CoverageMatch {
	matchId: number;
	eventId?: string;
	courtName?: string;
	matchTime?: string;
}

function createCoverageStore() {
	const stored = browser ? localStorage.getItem('coverage-plan') : null;
	const initial: number[] = stored ? JSON.parse(stored) : [];

	const { subscribe, set, update } = writable<number[]>(initial);
	let initialized = false;

	// Sync from Supabase when user authenticates
	async function syncFromSupabase() {
		const authState = get(auth);
		if (!authState.user || !browser) return;

		try {
			const { data, error } = await supabase
				.from('user_coverage')
				.select('match_id')
				.eq('user_id', authState.user.id);

			if (error) throw error;

			if (data) {
				const matchIds = data.map((row) => row.match_id);
				set(matchIds);
				// Also update localStorage
				localStorage.setItem('coverage-plan', JSON.stringify(matchIds));
			}
		} catch (error) {
			console.error('Failed to sync coverage from Supabase:', error);
		}
	}

	// Initialize sync when auth state changes
	if (browser) {
		auth.subscribe((authState) => {
			if (authState.initialized && !initialized && authState.user) {
				initialized = true;
				syncFromSupabase();
			}
		});
	}

	return {
		subscribe,
		addMatch: async (
			matchId: number,
			eventId?: string,
			courtName?: string,
			matchTime?: string
		) => {
			const authState = get(auth);
			const current = get({ subscribe });

			if (current.includes(matchId)) return;

			// Update local state first
			const updated = [...current, matchId];
			set(updated);
			if (browser) localStorage.setItem('coverage-plan', JSON.stringify(updated));

			// Sync to Supabase if authenticated
			if (authState.user && browser) {
				try {
					const { error } = await supabase.from('user_coverage').insert({
						user_id: authState.user.id,
						match_id: matchId,
						event_id: eventId,
						court_name: courtName,
						match_time: matchTime
					});

					if (error && error.code !== '23505') {
						// 23505 is unique constraint violation (already exists)
						console.error('Failed to sync coverage to Supabase:', error);
					}
				} catch (error) {
					console.error('Failed to sync coverage to Supabase:', error);
				}
			}
		},
		removeMatch: async (matchId: number) => {
			const authState = get(auth);
			const current = get({ subscribe });

			// Update local state first
			const updated = current.filter((id) => id !== matchId);
			set(updated);
			if (browser) localStorage.setItem('coverage-plan', JSON.stringify(updated));

			// Sync to Supabase if authenticated
			if (authState.user && browser) {
				try {
					const { error } = await supabase
						.from('user_coverage')
						.delete()
						.eq('user_id', authState.user.id)
						.eq('match_id', matchId);

					if (error) {
						console.error('Failed to remove coverage from Supabase:', error);
					}
				} catch (error) {
					console.error('Failed to remove coverage from Supabase:', error);
				}
			}
		},
		clear: async () => {
			const authState = get(auth);

			// Clear local state
			set([]);
			if (browser) localStorage.removeItem('coverage-plan');

			// Clear Supabase if authenticated
			if (authState.user && browser) {
				try {
					const { error } = await supabase
						.from('user_coverage')
						.delete()
						.eq('user_id', authState.user.id);

					if (error) {
						console.error('Failed to clear coverage from Supabase:', error);
					}
				} catch (error) {
					console.error('Failed to clear coverage from Supabase:', error);
				}
			}
		},
		// Manual sync function for when user signs in
		sync: syncFromSupabase
	};
}

export const coveragePlan = createCoverageStore();
