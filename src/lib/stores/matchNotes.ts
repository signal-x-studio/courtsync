import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface MatchNote {
	matchId: number;
	eventId: string;
	note: string;
	createdAt: number;
	updatedAt: number;
}

const STORAGE_KEY = 'matchNotes';

function createMatchNotes(eventId: string) {
	const { subscribe, set, update } = writable<Map<number, MatchNote>>(new Map());

	// Load from localStorage
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as Record<string, MatchNote>;
				const notesMap = new Map<number, MatchNote>();
				Object.values(parsed).forEach((note) => {
					if (note.eventId === eventId) {
						notesMap.set(note.matchId, note);
					}
				});
				set(notesMap);
			}
		} catch (error) {
			console.error('Failed to load match notes:', error);
		}
	}

	const saveToStorage = (notes: Map<number, MatchNote>) => {
		if (!browser) return;
		try {
			const existing = localStorage.getItem(STORAGE_KEY);
			const allNotes: Record<string, MatchNote> = existing ? JSON.parse(existing) : {};

			notes.forEach((note) => {
				allNotes[`${eventId}-${note.matchId}`] = note;
			});

			Object.keys(allNotes).forEach((key) => {
				if (key.startsWith(`${eventId}-`)) {
					const matchId = parseInt(key.split('-').pop() || '0');
					if (!notes.has(matchId)) {
						delete allNotes[key];
					}
				}
			});

			localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));
		} catch (error) {
			console.error('Failed to save match notes:', error);
		}
	};

	return {
		subscribe,
		setNote: (matchId: number, note: string) => {
			const now = Date.now();
			update((notes) => {
				const next = new Map(notes);
				const existing = next.get(matchId);

				if (note.trim()) {
					next.set(matchId, {
						matchId,
						eventId,
						note: note.trim(),
						createdAt: existing?.createdAt || now,
						updatedAt: now
					});
				} else {
					next.delete(matchId);
				}

				saveToStorage(next);
				return next;
			});
		},
		getNote: (matchId: number): string => {
			let note = '';
			subscribe((notes) => {
				note = notes.get(matchId)?.note || '';
			})();
			return note;
		},
		deleteNote: (matchId: number) => {
			update((notes) => {
				const next = new Map(notes);
				next.delete(matchId);
				saveToStorage(next);
				return next;
			});
		},
		hasNote: (matchId: number): boolean => {
			let has = false;
			subscribe((notes) => {
				const note = notes.get(matchId);
				has = note !== undefined && note.note.trim().length > 0;
			})();
			return has;
		}
	};
}

export function createMatchNotesStore(eventId: string) {
	return createMatchNotes(eventId);
}

