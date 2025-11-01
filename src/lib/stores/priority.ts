import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Priority = 'must-cover' | 'priority' | 'optional' | null;

export interface MatchPriorities {
	[matchId: number]: Priority;
}

const STORAGE_KEY = 'matchPriorities';

function createPriority() {
	const { subscribe, set, update } = writable<MatchPriorities>({});

	// Load from localStorage
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				set(parsed);
			}
		} catch (error) {
			console.error('Failed to load priorities:', error);
		}
	}

	const saveToStorage = (priorities: MatchPriorities) => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(priorities));
		} catch (error) {
			console.error('Failed to save priorities:', error);
		}
	};

	return {
		subscribe,
		setPriority: (matchId: number, priority: Priority) => {
			update((priorities) => {
				const next = { ...priorities };
				if (priority === null) {
					delete next[matchId];
				} else {
					next[matchId] = priority;
				}
				saveToStorage(next);
				return next;
			});
		},
		getPriority: (matchId: number): Priority => {
			let priority: Priority = null;
			subscribe((priorities) => {
				priority = priorities[matchId] || null;
			})();
			return priority;
		},
		clearAllPriorities: () => {
			set({});
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	};
}

export const priority = createPriority();

