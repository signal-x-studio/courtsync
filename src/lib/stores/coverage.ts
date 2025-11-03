// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Coverage plan store for Media persona
// Note: Tracks match IDs in coverage plan, persists to localStorage

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createCoverageStore() {
	const stored = browser ? localStorage.getItem('coverage-plan') : null;
	const initial: number[] = stored ? JSON.parse(stored) : [];

	const { subscribe, set, update } = writable<number[]>(initial);

	return {
		subscribe,
		addMatch: (matchId: number) =>
			update((ids) => {
				if (ids.includes(matchId)) return ids;
				const updated = [...ids, matchId];
				if (browser) localStorage.setItem('coverage-plan', JSON.stringify(updated));
				return updated;
			}),
		removeMatch: (matchId: number) =>
			update((ids) => {
				const updated = ids.filter((id) => id !== matchId);
				if (browser) localStorage.setItem('coverage-plan', JSON.stringify(updated));
				return updated;
			}),
		clear: () => {
			if (browser) localStorage.removeItem('coverage-plan');
			set([]);
		}
	};
}

export const coveragePlan = createCoverageStore();
