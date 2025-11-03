// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for club hub page
// Note: Fetches court schedule using SvelteKit's fetch for SSR support

import type { PageServerLoad } from './$types';
import { fetchCourtSchedule, flattenCourtScheduleMatches } from '$lib/services/aes';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const { eventId } = params;

	// Get current date in YYYY-MM-DD format
	const today = new Date();
	const dateStr = today.toISOString().split('T')[0];

	if (!dateStr) {
		throw new Error('Invalid date format');
	}

	try {
		// Fetch court schedule for the event (24 hours = 1440 minutes)
		const schedule = await fetchCourtSchedule(eventId, dateStr, 1440, fetch);

		// Flatten matches from all courts for easier processing
		const allMatches = flattenCourtScheduleMatches(schedule);

		return {
			allMatches,
			eventId
		};
	} catch (err) {
		console.error('Failed to load court schedule:', err);
		throw err;
	}
};
