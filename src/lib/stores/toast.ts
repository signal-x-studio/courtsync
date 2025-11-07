// Reference: https://svelte.dev/docs/svelte/svelte-store
// Purpose: Toast notification store for user feedback
// Note: Auto-dismisses after timeout, supports success/error/info types

import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function show(message: string, type: ToastType = 'info', duration = 3000) {
		const id = Math.random().toString(36).substring(7);
		const toast: Toast = { id, message, type, duration };

		update((toasts) => [...toasts, toast]);

		// Auto-dismiss after duration
		setTimeout(() => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}, duration);
	}

	return {
		subscribe,
		show,
		success: (message: string, duration = 3000) => {
			show(message, 'success', duration);
		},
		error: (message: string, duration = 4000) => {
			show(message, 'error', duration);
		},
		info: (message: string, duration = 3000) => {
			show(message, 'info', duration);
		},
		dismiss: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}
	};
}

export const toast = createToastStore();
