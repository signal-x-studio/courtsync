// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Favorite teams store for Spectator persona
// Note: Tracks favorite team IDs, persists to localStorage

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { trackFavoriteTeamAdd, trackFavoriteTeamRemove } from '$lib/utils/analytics';

function createFavoritesStore() {
	const stored = browser ? localStorage.getItem('favorite-teams') : null;
	const initial: number[] = stored ? JSON.parse(stored) : [];

	const { subscribe, set, update } = writable<number[]>(initial);

	return {
		subscribe,
		addTeam: (teamId: number, teamName?: string) =>
			update((ids) => {
				if (ids.includes(teamId)) return ids;
				const updated = [...ids, teamId];
				if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
				// Track analytics
				trackFavoriteTeamAdd(teamId, teamName || `Team ${teamId}`);
				return updated;
			}),
		removeTeam: (teamId: number) =>
			update((ids) => {
				const updated = ids.filter((id) => id !== teamId);
				if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
				// Track analytics
				trackFavoriteTeamRemove(teamId);
				return updated;
			}),
		toggleTeam: (teamId: number, teamName?: string) =>
			update((ids) => {
				const isAdding = !ids.includes(teamId);
				const updated = isAdding
					? [...ids, teamId]
					: ids.filter((id) => id !== teamId);
				if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
				// Track analytics
				if (isAdding) {
					trackFavoriteTeamAdd(teamId, teamName || `Team ${teamId}`);
				} else {
					trackFavoriteTeamRemove(teamId);
				}
				return updated;
			}),
		clear: () => {
			if (browser) localStorage.removeItem('favorite-teams');
			set([]);
		}
	};
}

export const favoriteTeams = createFavoritesStore();
