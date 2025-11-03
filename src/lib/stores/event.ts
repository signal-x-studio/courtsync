// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Persistent event ID store with localStorage
// Note: Defaults to PTAwMDAwNDEzMTQ90, persists across sessions

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const DEFAULT_EVENT_ID = 'PTAwMDAwNDEzMTQ90';

function createEventStore() {
	const stored = browser ? localStorage.getItem('current-event-id') : null;
	const initial = stored || DEFAULT_EVENT_ID;

	const { subscribe, set } = writable<string>(initial);

	return {
		subscribe,
		set: (value: string) => {
			if (browser) localStorage.setItem('current-event-id', value);
			set(value);
		}
	};
}

export const eventId = createEventStore();
