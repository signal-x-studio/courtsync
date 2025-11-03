// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Match filtering store for divisions, teams, and coverage
// Note: Session-only (not persisted), resets on page reload

import { writable } from 'svelte/store';

interface Filters {
	divisionIds: number[];
	teamIds: number[];
	showOnlyUncovered: boolean;
}

function createFiltersStore() {
	const { subscribe, set, update } = writable<Filters>({
		divisionIds: [],
		teamIds: [],
		showOnlyUncovered: false
	});

	return {
		subscribe,
		setDivisions: (divisionIds: number[]) => update((f) => ({ ...f, divisionIds })),
		setTeams: (teamIds: number[]) => update((f) => ({ ...f, teamIds })),
		setShowOnlyUncovered: (value: boolean) => update((f) => ({ ...f, showOnlyUncovered: value })),
		clear: () => set({ divisionIds: [], teamIds: [], showOnlyUncovered: false }),
		reset: () => set({ divisionIds: [], teamIds: [], showOnlyUncovered: false })
	};
}

export const filters = createFiltersStore();
