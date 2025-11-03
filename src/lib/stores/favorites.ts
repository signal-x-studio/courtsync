// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Favorite teams store for Spectator persona
// Note: Tracks favorite team IDs, persists to localStorage

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createFavoritesStore() {
	const stored = browser ? localStorage.getItem('favorite-teams') : null;
	const initial: number[] = stored ? JSON.parse(stored) : [];

	const { subscribe, set, update } = writable<number[]>(initial);

	return {
		subscribe,
		addTeam: (teamId: number) =>
			update((ids) => {
				if (ids.includes(teamId)) return ids;
				const updated = [...ids, teamId];
				if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
				return updated;
			}),
		removeTeam: (teamId: number) =>
			update((ids) => {
				const updated = ids.filter((id) => id !== teamId);
				if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
				return updated;
			}),
		toggleTeam: (teamId: number) =>
			update((ids) => {
				const updated = ids.includes(teamId)
					? ids.filter((id) => id !== teamId)
					: [...ids, teamId];
				if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
				return updated;
			}),
		clear: () => {
			if (browser) localStorage.removeItem('favorite-teams');
			set([]);
		}
	};
}

export const favoriteTeams = createFavoritesStore();
