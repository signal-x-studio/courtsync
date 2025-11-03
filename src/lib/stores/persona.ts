// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: User persona store (media or spectator)
// Note: Defaults to 'spectator', persists to localStorage

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Persona } from '$lib/types/app';

function createPersonaStore() {
	const stored = browser ? localStorage.getItem('persona') : null;
	const initial: Persona = (stored as Persona) || 'spectator';

	const { subscribe, set } = writable<Persona>(initial);

	return {
		subscribe,
		set: (value: Persona) => {
			if (browser) localStorage.setItem('persona', value);
			set(value);
		}
	};
}

export const persona = createPersonaStore();
