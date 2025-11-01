import { writable } from 'svelte/store';

export type SortMode = 'team' | 'court' | 'priority';

const DEFAULT_SORT: SortMode = 'team';

function createSort() {
	const { subscribe, set, update } = writable<SortMode>(DEFAULT_SORT);

	return {
		subscribe,
		setSortMode: (mode: SortMode) => set(mode),
		reset: () => set(DEFAULT_SORT)
	};
}

export const sort = createSort();

