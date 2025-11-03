// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for club hub page
// Note: Fetches court schedule using SvelteKit's fetch for SSR support

import type { PageServerLoad } from './$types';
import { fetchEventInfo, fetchCourtSchedule, flattenCourtScheduleMatches } from '$lib/services/aes';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const { eventId } = params;

	try {
		// First get event info to find the event dates
		const eventInfo = await fetchEventInfo(eventId, fetch);

		// Use the event's start date
		const eventDate = new Date(eventInfo.StartDate);
		const dateStr = eventDate.toISOString().split('T')[0];

		if (!dateStr) {
			throw new Error('Invalid date format');
		}

		// Fetch court schedule with 5-hour window (300 minutes)
		const schedule = await fetchCourtSchedule(eventId, dateStr, 300, fetch);

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
