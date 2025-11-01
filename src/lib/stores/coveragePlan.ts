import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';

export interface CoveragePlan {
	selectedMatches: number[];
	createdAt: number;
	updatedAt: number;
}

const STORAGE_KEY = 'coveragePlan';

function createCoveragePlan() {
	const { subscribe, set, update } = writable<Set<number>>(new Set());

	// Load from localStorage
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const plan: CoveragePlan = JSON.parse(stored);
				set(new Set(plan.selectedMatches));
			}
		} catch (error) {
			console.error('Failed to load coverage plan:', error);
		}
	}

	const saveToStorage = (selectedMatches: Set<number>) => {
		if (!browser) return;
		try {
			const plan: CoveragePlan = {
				selectedMatches: Array.from(selectedMatches),
				createdAt: Date.now(),
				updatedAt: Date.now()
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
		} catch (error) {
			console.error('Failed to save coverage plan:', error);
		}
	};

	return {
		subscribe,
		toggleMatch: (matchId: number) => {
			update((selectedMatches) => {
				const next = new Set(selectedMatches);
				if (next.has(matchId)) {
					next.delete(matchId);
				} else {
					next.add(matchId);
				}
				saveToStorage(next);
				return next;
			});
		},
		selectMatch: (matchId: number) => {
			update((selectedMatches) => {
				const next = new Set(selectedMatches);
				next.add(matchId);
				saveToStorage(next);
				return next;
			});
		},
		deselectMatch: (matchId: number) => {
			update((selectedMatches) => {
				const next = new Set(selectedMatches);
				next.delete(matchId);
				saveToStorage(next);
				return next;
			});
		},
		clearPlan: () => {
			set(new Set());
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	};
}

export const coveragePlan = createCoveragePlan();

// Derived stores for reactive access
export const selectedMatches = derived(coveragePlan, ($plan) => $plan);
export const selectedCount = derived(coveragePlan, ($plan) => $plan.size);
export const isSelected = (matchId: number) =>
	derived(coveragePlan, ($plan) => $plan.has(matchId));

