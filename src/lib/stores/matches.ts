import { writable } from 'svelte/store';
import type { FilteredMatch } from '$lib/types';

// Store to hold matches so they can be accessed from routes
export const matchesStore = writable<FilteredMatch[]>([]);

// Store to hold current event/club info
export const eventInfoStore = writable<{
	eventId: string;
	clubId: number;
} | null>(null);

