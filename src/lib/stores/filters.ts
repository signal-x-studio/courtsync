import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { FilteredMatch } from '$lib/types';

export interface FilterState {
	division: string | null;
	wave: 'all' | 'morning' | 'afternoon';
	teams: string[];
	timeRange: {
		start: string | null;
		end: string | null;
	};
	conflictsOnly: boolean;
	coverageStatus: 'all' | 'covered' | 'uncovered' | 'planned';
	priority: 'all' | 'must-cover' | 'priority' | 'optional' | null;
}

const DEFAULT_FILTERS: FilterState = {
	division: null,
	wave: 'all',
	teams: [],
	timeRange: {
		start: null,
		end: null
	},
	conflictsOnly: false,
	coverageStatus: 'all',
	priority: 'all'
};

const STORAGE_KEY = 'matchFilters';

function createFilters() {
	const { subscribe, set, update } = writable<FilterState>(DEFAULT_FILTERS);

	// Load from localStorage
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const savedFilters = JSON.parse(stored);
				set({ ...DEFAULT_FILTERS, ...savedFilters });
			}
		} catch (error) {
			console.error('Failed to load filters:', error);
		}
	}

	const saveToStorage = (filters: FilterState) => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
		} catch (error) {
			console.error('Failed to save filters:', error);
		}
	};

	return {
		subscribe,
		updateFilter: (key: keyof FilterState, value: any) => {
			update((filters) => {
				const next = { ...filters, [key]: value };
				saveToStorage(next);
				return next;
			});
		},
		resetFilters: () => {
			set(DEFAULT_FILTERS);
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		},
		setTimeRangePreset: (preset: 'morning' | 'afternoon' | 'all') => {
			update((filters) => {
				let next: FilterState;
				if (preset === 'morning') {
					next = {
						...filters,
						timeRange: { start: '00:00', end: '14:29' }
					};
				} else if (preset === 'afternoon') {
					next = {
						...filters,
						timeRange: { start: '14:30', end: '23:59' }
					};
				} else {
					next = {
						...filters,
						timeRange: { start: null, end: null }
					};
				}
				saveToStorage(next);
				return next;
			});
		},
		getTeamIdentifier: (match: FilteredMatch): string => {
			const teamText =
				match.InvolvedTeam === 'first' ? match.FirstTeamText : match.SecondTeamText;
			const matchResult = teamText.match(/(\d+-\d+)/);
			return matchResult ? matchResult[1] : '';
		}
	};
}

export const filters = createFilters();

