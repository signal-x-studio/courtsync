import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type CoverageStatus = 'not-covered' | 'covered' | 'partially-covered' | 'planned';

export interface TeamCoverageStatus {
	[teamId: string]: CoverageStatus;
}

const STORAGE_KEY = 'teamCoverageStatus';

function createCoverageStatus() {
	const { subscribe, set, update } = writable<TeamCoverageStatus>({});

	// Load from localStorage
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				set(parsed);
			}
		} catch (error) {
			console.error('Failed to load coverage status:', error);
		}
	}

	const saveToStorage = (status: TeamCoverageStatus) => {
		if (!browser) return;
		if (Object.keys(status).length === 0) return; // Don't save empty object
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
		} catch (error) {
			console.error('Failed to save coverage status:', error);
		}
	};

	return {
		subscribe,
		setTeamStatus: (teamId: string, status: CoverageStatus) => {
			update((coverageStatus) => {
				const next = { ...coverageStatus };
				if (status === 'not-covered') {
					delete next[teamId];
				} else {
					next[teamId] = status;
				}
				saveToStorage(next);
				return next;
			});
		},
		getTeamStatus: (teamId: string): CoverageStatus => {
			let status: CoverageStatus = 'not-covered';
			subscribe((coverageStatus) => {
				status = coverageStatus[teamId] || 'not-covered';
			})();
			return status;
		},
		clearAllStatus: () => {
			set({});
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		},
		updateFromPlan: (teamId: string, matchesInPlan: number, totalMatches: number) => {
			if (totalMatches === 0) return;

			update((coverageStatus) => {
				let newStatus: CoverageStatus;
				if (matchesInPlan === 0) {
					newStatus = 'not-covered';
				} else if (matchesInPlan === totalMatches) {
					newStatus = 'covered';
				} else {
					newStatus = 'partially-covered';
				}

				const currentStatus = coverageStatus[teamId] || 'not-covered';
				if (currentStatus === newStatus) {
					return coverageStatus; // No change needed
				}

				const next = { ...coverageStatus };
				if (newStatus === 'not-covered') {
					delete next[teamId];
				} else {
					next[teamId] = newStatus;
				}
				saveToStorage(next);
				return next;
			});
		},
		importStatuses: (statuses: TeamCoverageStatus) => {
			set(statuses);
			saveToStorage(statuses);
		}
	};
}

export const coverageStatus = createCoverageStatus();

