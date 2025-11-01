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
	myTeamsOnly: boolean; // For spectators: filter to only followed teams
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
	priority: 'all',
	myTeamsOnly: false // Default to false - don't auto-filter by followed teams
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
				// Merge with defaults to ensure new fields (like myTeamsOnly) are included
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

// Utility functions for filtering
export function getTeamIdentifier(match: FilteredMatch): string {
	const teamText = match.InvolvedTeam === 'first' ? match.FirstTeamText : match.SecondTeamText;
	const matchResult = teamText.match(/(\d+-\d+)/);
	return matchResult ? matchResult[1] : '';
}

export function getUniqueDivisions(matches: FilteredMatch[]): string[] {
	const divSet = new Set(matches.map(m => m.Division.CodeAlias));
	return Array.from(divSet).sort();
}

export function getUniqueTeams(matches: FilteredMatch[]): string[] {
	const teamSet = new Set<string>();
	matches.forEach(match => {
		const teamId = getTeamIdentifier(match);
		if (teamId) {
			teamSet.add(teamId);
		}
	});
	return Array.from(teamSet).sort();
}

export function applyFilters(matches: FilteredMatch[]): FilteredMatch[] {
	let currentFilters: FilterState = DEFAULT_FILTERS;
	filters.subscribe(f => {
		currentFilters = f;
	})();
	
	return matches.filter(match => {
		// Division filter
		if (currentFilters.division && match.Division.CodeAlias !== currentFilters.division) {
			return false;
		}

		// Wave filter
		if (currentFilters.wave !== 'all') {
			const startTime = new Date(match.ScheduledStartDateTime).getTime();
			const startDate = new Date(startTime);
			const hours = startDate.getHours();
			const minutes = startDate.getMinutes();
			const totalMinutes = hours * 60 + minutes;
			const afternoonStartMinutes = 14 * 60 + 30;
			
			if (currentFilters.wave === 'morning' && totalMinutes >= afternoonStartMinutes) {
				return false;
			}
			if (currentFilters.wave === 'afternoon' && totalMinutes < afternoonStartMinutes) {
				return false;
			}
		}

		// Team filter
		if (currentFilters.teams.length > 0) {
			const teamId = getTeamIdentifier(match);
			if (!teamId || !currentFilters.teams.includes(teamId)) {
				return false;
			}
		}

		// Time range filter
		if (currentFilters.timeRange.start || currentFilters.timeRange.end) {
			const startTime = new Date(match.ScheduledStartDateTime).getTime();
			const startDate = new Date(startTime);
			const hours = startDate.getHours();
			const minutes = startDate.getMinutes();
			const matchTimeMinutes = hours * 60 + minutes;

			if (currentFilters.timeRange.start) {
				const [startH, startM] = currentFilters.timeRange.start.split(':').map(Number);
				const startFilterMinutes = startH * 60 + startM;
				if (matchTimeMinutes < startFilterMinutes) {
					return false;
				}
			}

			if (currentFilters.timeRange.end) {
				const [endH, endM] = currentFilters.timeRange.end.split(':').map(Number);
				const endFilterMinutes = endH * 60 + endM;
				if (matchTimeMinutes > endFilterMinutes) {
					return false;
				}
			}
		}

		return true;
	});
}

export function updateFilter(key: keyof FilterState, value: any) {
	filters.updateFilter(key, value);
}

export function resetFilters() {
	filters.resetFilters();
}

