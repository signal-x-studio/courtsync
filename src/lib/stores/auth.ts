// Reference: https://supabase.com/docs/guides/auth
// Purpose: Authentication store with Supabase Auth
// Note: Optional user accounts for syncing across devices

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
	initialized: boolean;
}

const DEFAULT_STATE: AuthState = {
	user: null,
	session: null,
	loading: true,
	initialized: false
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(DEFAULT_STATE);

	return {
		subscribe,

		// Initialize auth state
		initialize: async () => {
			if (!browser) return;

			try {
				// Get initial session
				const {
					data: { session }
				} = await supabase.auth.getSession();

				update((state) => ({
					...state,
					session,
					user: session?.user ?? null,
					loading: false,
					initialized: true
				}));

				// Listen for auth changes
				supabase.auth.onAuthStateChange((_event, session) => {
					update((state) => ({
						...state,
						session,
						user: session?.user ?? null,
						loading: false
					}));
				});
			} catch (error) {
				console.error('Auth initialization error:', error);
				update((state) => ({
					...state,
					loading: false,
					initialized: true
				}));
			}
		},

		// Sign up with email and password
		signUp: async (email: string, password: string) => {
			update((state) => ({ ...state, loading: true }));

			try {
				const { data, error } = await supabase.auth.signUp({
					email,
					password
				});

				if (error) throw error;

				update((state) => ({
					...state,
					session: data.session,
					user: data.user,
					loading: false
				}));

				return { success: true, error: null };
			} catch (error: any) {
				update((state) => ({ ...state, loading: false }));
				return { success: false, error: error.message };
			}
		},

		// Sign in with email and password
		signIn: async (email: string, password: string) => {
			update((state) => ({ ...state, loading: true }));

			try {
				const { data, error } = await supabase.auth.signInWithPassword({
					email,
					password
				});

				if (error) throw error;

				update((state) => ({
					...state,
					session: data.session,
					user: data.user,
					loading: false
				}));

				return { success: true, error: null };
			} catch (error: any) {
				update((state) => ({ ...state, loading: false }));
				return { success: false, error: error.message };
			}
		},

		// Sign in with Google (OAuth)
		signInWithGoogle: async () => {
			update((state) => ({ ...state, loading: true }));

			try {
				const { data, error } = await supabase.auth.signInWithOAuth({
					provider: 'google',
					options: {
						redirectTo: `${window.location.origin}/auth/callback`
					}
				});

				if (error) throw error;

				// OAuth redirects, so we don't update state here
				return { success: true, error: null };
			} catch (error: any) {
				update((state) => ({ ...state, loading: false }));
				return { success: false, error: error.message };
			}
		},

		// Sign out
		signOut: async () => {
			update((state) => ({ ...state, loading: true }));

			try {
				const { error } = await supabase.auth.signOut();

				if (error) throw error;

				update((state) => ({
					...state,
					session: null,
					user: null,
					loading: false
				}));

				return { success: true, error: null };
			} catch (error: any) {
				update((state) => ({ ...state, loading: false }));
				return { success: false, error: error.message };
			}
		},

		// Reset password
		resetPassword: async (email: string) => {
			try {
				const { error } = await supabase.auth.resetPasswordForEmail(email, {
					redirectTo: `${window.location.origin}/auth/reset-password`
				});

				if (error) throw error;

				return { success: true, error: null };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		},

		// Update password
		updatePassword: async (newPassword: string) => {
			try {
				const { error } = await supabase.auth.updateUser({
					password: newPassword
				});

				if (error) throw error;

				return { success: true, error: null };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		}
	};
}

export const auth = createAuthStore();
