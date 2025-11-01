import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { FilteredMatch } from '$lib/types';

export interface FilterState {
	division: string | null;
	divisionLevel: 'all' | 'O' | 'C' | 'P' | null; // Level filter: Open, Club, Premier
	divisionAge: string | null; // Age filter: "14", "16", "18", etc.
	court: string | null;
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
	searchQuery: string | null; // Search by team or court name
}

const DEFAULT_FILTERS: FilterState = {
	division: null,
	divisionLevel: null,
	divisionAge: null,
	court: null,
	wave: 'all',
	teams: [],
	timeRange: {
		start: null,
		end: null
	},
	conflictsOnly: false,
	coverageStatus: 'all',
	priority: 'all',
	myTeamsOnly: false, // Default to false - don't auto-filter by followed teams
	searchQuery: null
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

export function getUniqueCourts(matches: FilteredMatch[]): string[] {
	const courtSet = new Set(matches.map(m => m.CourtName).filter(Boolean));
	return Array.from(courtSet).sort();
}

export function getUniqueDivisions(matches: FilteredMatch[]): string[] {
	const divSet = new Set(matches.map(m => m.Division.CodeAlias));
	return Array.from(divSet).sort();
}

// Parse division code to extract level and age
export interface DivisionInfo {
	codeAlias: string;
	level: 'O' | 'C' | 'P' | null; // Open, Club, Premier
	age: string | null; // "14", "16", "18", etc.
}

export function parseDivision(codeAlias: string): DivisionInfo {
	const upper = codeAlias.toUpperCase();
	
	// Extract level (O, C, P) - look for various patterns
	let level: 'O' | 'C' | 'P' | null = null;
	
	// Check for explicit level indicators
	if (upper.includes('-O') || upper.includes('OPEN') || upper.startsWith('O') || upper.endsWith('-O')) {
		level = 'O';
	} else if (upper.includes('-C') || upper.includes('CLUB') || upper.startsWith('C') || upper.endsWith('-C')) {
		level = 'C';
	} else if (upper.includes('-P') || upper.includes('PREMIER') || upper.includes('PREM') || upper.startsWith('P') || upper.endsWith('-P')) {
		level = 'P';
	}
	
	// Extract age (look for 2-digit numbers like 14, 16, 18, etc.)
	const ageMatch = codeAlias.match(/\b(\d{2})\b/);
	const age = ageMatch ? ageMatch[1] : null;
	
	return { codeAlias, level, age };
}

// Get divisions grouped by level and age
export interface GroupedDivisions {
	level: 'O' | 'C' | 'P';
	label: string;
	ages: {
		age: string;
		divisions: string[];
	}[];
}

export function getGroupedDivisions(matches: FilteredMatch[]): GroupedDivisions[] {
	const divisionMap = new Map<string, DivisionInfo>();
	
	// Parse all divisions
	matches.forEach(match => {
		const codeAlias = match.Division.CodeAlias;
		if (!divisionMap.has(codeAlias)) {
			divisionMap.set(codeAlias, parseDivision(codeAlias));
		}
	});
	
	// Group by level
	const levelGroups = new Map<'O' | 'C' | 'P', Map<string, string[]>>();
	
	divisionMap.forEach((info, codeAlias) => {
		if (info.level) {
			if (!levelGroups.has(info.level)) {
				levelGroups.set(info.level, new Map());
			}
			const ageMap = levelGroups.get(info.level)!;
			const age = info.age || 'Other';
			if (!ageMap.has(age)) {
				ageMap.set(age, []);
			}
			ageMap.get(age)!.push(codeAlias);
		}
	});
	
	// Convert to array format
	const result: GroupedDivisions[] = [];
	const levelOrder: ('O' | 'C' | 'P')[] = ['O', 'C', 'P'];
	const levelLabels = { O: 'Open', C: 'Club', P: 'Premier' };
	
	levelOrder.forEach(level => {
		const ageMap = levelGroups.get(level);
		if (ageMap && ageMap.size > 0) {
			const ages: { age: string; divisions: string[] }[] = [];
			
			// Sort ages numerically
			const sortedAges = Array.from(ageMap.keys()).sort((a, b) => {
				if (a === 'Other') return 1;
				if (b === 'Other') return -1;
				return parseInt(a, 10) - parseInt(b, 10);
			});
			
			sortedAges.forEach(age => {
				const divisions = ageMap.get(age)!;
				ages.push({ age, divisions: divisions.sort() });
			});
			
			result.push({
				level,
				label: levelLabels[level],
				ages
			});
		}
	});
	
	return result;
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
		// Division filter (exact match)
		if (currentFilters.division && match.Division.CodeAlias !== currentFilters.division) {
			return false;
		}
		
		// Division level filter (O, C, P)
		if (currentFilters.divisionLevel && currentFilters.divisionLevel !== 'all') {
			const divInfo = parseDivision(match.Division.CodeAlias);
			if (divInfo.level !== currentFilters.divisionLevel) {
				return false;
			}
		}
		
		// Division age filter
		if (currentFilters.divisionAge) {
			const divInfo = parseDivision(match.Division.CodeAlias);
			if (divInfo.age !== currentFilters.divisionAge) {
				return false;
			}
		}

		// Court filter
		if (currentFilters.court && match.CourtName !== currentFilters.court) {
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

		// Search query filter (team or court name)
		if (currentFilters.searchQuery && currentFilters.searchQuery.trim()) {
			const query = currentFilters.searchQuery.toLowerCase().trim();
			const teamId = getTeamIdentifier(match);
			const firstTeam = match.FirstTeamText?.toLowerCase() || '';
			const secondTeam = match.SecondTeamText?.toLowerCase() || '';
			const courtName = match.CourtName?.toLowerCase() || '';
			const divisionName = match.Division?.CodeAlias?.toLowerCase() || '';

			const matchesQuery =
				teamId.toLowerCase().includes(query) ||
				firstTeam.includes(query) ||
				secondTeam.includes(query) ||
				courtName.includes(query) ||
				divisionName.includes(query);

			if (!matchesQuery) {
				return false;
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

