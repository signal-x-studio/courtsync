// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for my teams page
// Note: Fetches court schedule using SvelteKit's fetch for SSR support

import type { PageServerLoad } from './$types';
import { fetchEventInfo, fetchCourtSchedule, flattenCourtScheduleMatches } from '$lib/services/aes';
import { eventId } from '$lib/stores/event';
import { get } from 'svelte/store';

export const load: PageServerLoad = async ({ fetch }) => {
	// Get event ID from store
	const currentEventId = get(eventId);

	if (!currentEventId) {
		return {
			allMatches: [],
			availableTeams: [],
			eventId: ''
		};
	}

	try {
		// First get event info to find the event dates
		const eventInfo = await fetchEventInfo(currentEventId, fetch);

		// Use the event's start date
		const eventDate = new Date(eventInfo.StartDate);
		const dateStr = eventDate.toISOString().split('T')[0];

		if (!dateStr) {
			throw new Error('Invalid date format');
		}

		// Fetch court schedule with 5-hour window (300 minutes)
		const schedule = await fetchCourtSchedule(currentEventId, dateStr, 300, fetch);

		// Flatten matches from all courts for easier processing
		const allMatches = flattenCourtScheduleMatches(schedule);

		// Extract unique teams from matches
		const teamsMap = new Map<number, any>();
		for (const match of allMatches) {
			// Add first team
			if (match.FirstTeamId) {
				teamsMap.set(match.FirstTeamId, {
					TeamId: match.FirstTeamId,
					TeamName: match.FirstTeamText,
					TeamCode: '',
					ClubId: 0,
					ClubName: '',
					DivisionId: match.Division.DivisionId,
					DivisionName: match.Division.Name
				});
			}
			// Add second team
			if (match.SecondTeamId) {
				teamsMap.set(match.SecondTeamId, {
					TeamId: match.SecondTeamId,
					TeamName: match.SecondTeamText,
					TeamCode: '',
					ClubId: 0,
					ClubName: '',
					DivisionId: match.Division.DivisionId,
					DivisionName: match.Division.Name
				});
			}
		}

		const availableTeams = Array.from(teamsMap.values()).sort((a, b) => {
			const divCompare = a.DivisionName.localeCompare(b.DivisionName);
			return divCompare !== 0 ? divCompare : a.TeamName.localeCompare(b.TeamName);
		});

		return {
			allMatches,
			availableTeams,
			eventId: currentEventId
		};
	} catch (err) {
		console.error('Failed to load data:', err);
		throw err;
	}
};
