import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';

export type UserRole = 'media' | 'spectator' | 'coach';

const STORAGE_KEY = 'userRole';

function createUserRole() {
	const { subscribe, set } = writable<UserRole>('media');

	// Load from localStorage
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored && ['media', 'spectator', 'coach'].includes(stored)) {
				set(stored as UserRole);
			}
		} catch (error) {
			console.error('Failed to load user role:', error);
		}
	}

	const saveToStorage = (role: UserRole) => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, role);
		} catch (error) {
			console.error('Failed to save user role:', error);
		}
	};

	return {
		subscribe,
		setRole: (role: UserRole) => {
			set(role);
			saveToStorage(role);
		}
	};
}

export const userRole = createUserRole();

// Derived stores for convenient access
export const isMedia = derived(userRole, ($role) => $role === 'media');
export const isSpectator = derived(userRole, ($role) => $role === 'spectator');
export const isCoach = derived(userRole, ($role) => $role === 'coach');

