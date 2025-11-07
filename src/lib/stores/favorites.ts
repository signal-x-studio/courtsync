// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Favorite teams store for Spectator persona
// Note: Syncs with Supabase for authenticated users, localStorage for anonymous

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { trackFavoriteTeamAdd, trackFavoriteTeamRemove } from '$lib/utils/analytics';
import { supabase } from '$lib/supabase/client';
import { auth } from './auth';

interface FavoriteTeam {
	teamId: number;
	teamName?: string;
	eventId?: string;
	divisionId?: number;
}

function createFavoritesStore() {
	const stored = browser ? localStorage.getItem('favorite-teams') : null;
	const initial: number[] = stored ? JSON.parse(stored) : [];

	const { subscribe, set, update } = writable<number[]>(initial);
	let initialized = false;

	// Sync from Supabase when user authenticates
	async function syncFromSupabase() {
		const authState = get(auth);
		if (!authState.user || !browser) return;

		try {
			const { data, error } = await supabase
				.from('user_favorites')
				.select('team_id')
				.eq('user_id', authState.user.id);

			if (error) throw error;

			if (data) {
				const teamIds = data.map((row) => row.team_id);
				set(teamIds);
				// Also update localStorage
				localStorage.setItem('favorite-teams', JSON.stringify(teamIds));
			}
		} catch (error) {
			console.error('Failed to sync favorites from Supabase:', error);
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
		addTeam: async (teamId: number, teamName?: string, eventId?: string, divisionId?: number) => {
			const authState = get(auth);
			const current = get({ subscribe });

			if (current.includes(teamId)) return;

			// Update local state first
			const updated = [...current, teamId];
			set(updated);
			if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));

			// Sync to Supabase if authenticated
			if (authState.user && browser) {
				try {
					const { error } = await supabase.from('user_favorites').insert({
						user_id: authState.user.id,
						team_id: teamId,
						team_name: teamName,
						event_id: eventId,
						division_id: divisionId
					});

					if (error && error.code !== '23505') {
						// 23505 is unique constraint violation (already exists)
						console.error('Failed to sync favorite to Supabase:', error);
					}
				} catch (error) {
					console.error('Failed to sync favorite to Supabase:', error);
				}
			}

			// Track analytics
			trackFavoriteTeamAdd(teamId, teamName || `Team ${teamId}`);
		},
		removeTeam: async (teamId: number) => {
			const authState = get(auth);
			const current = get({ subscribe });

			// Update local state first
			const updated = current.filter((id) => id !== teamId);
			set(updated);
			if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));

			// Sync to Supabase if authenticated
			if (authState.user && browser) {
				try {
					const { error } = await supabase
						.from('user_favorites')
						.delete()
						.eq('user_id', authState.user.id)
						.eq('team_id', teamId);

					if (error) {
						console.error('Failed to remove favorite from Supabase:', error);
					}
				} catch (error) {
					console.error('Failed to remove favorite from Supabase:', error);
				}
			}

			// Track analytics
			trackFavoriteTeamRemove(teamId);
		},
		toggleTeam: async (
			teamId: number,
			teamName?: string,
			eventId?: string,
			divisionId?: number
		) => {
			const current = get({ subscribe });
			const isAdding = !current.includes(teamId);

			if (isAdding) {
				await favoriteTeams.addTeam(teamId, teamName, eventId, divisionId);
			} else {
				await favoriteTeams.removeTeam(teamId);
			}
		},
		clear: async () => {
			const authState = get(auth);

			// Clear local state
			set([]);
			if (browser) localStorage.removeItem('favorite-teams');

			// Clear Supabase if authenticated
			if (authState.user && browser) {
				try {
					const { error } = await supabase
						.from('user_favorites')
						.delete()
						.eq('user_id', authState.user.id);

					if (error) {
						console.error('Failed to clear favorites from Supabase:', error);
					}
				} catch (error) {
					console.error('Failed to clear favorites from Supabase:', error);
				}
			}
		},
		// Manual sync function for when user signs in
		sync: syncFromSupabase
	};
}

export const favoriteTeams = createFavoritesStore();
