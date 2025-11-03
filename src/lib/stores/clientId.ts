// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Persistent client ID for match lock ownership
// Note: Generated once via crypto.randomUUID(), persists across sessions

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createClientIdStore() {
	const stored = browser ? localStorage.getItem('client-id') : null;
	const initial = stored || (browser ? crypto.randomUUID() : '');

	if (browser && !stored) {
		localStorage.setItem('client-id', initial);
	}

	const { subscribe } = writable<string>(initial);

	return { subscribe };
}

export const clientId = createClientIdStore();
