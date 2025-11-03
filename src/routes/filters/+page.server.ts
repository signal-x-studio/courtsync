// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for filters page
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
			divisions: [],
			teams: [],
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

		// Flatten matches from all courts
		const allMatches = flattenCourtScheduleMatches(schedule);

		// Extract unique divisions
		const divisionMap = new Map<number, any>();
		for (const match of allMatches) {
			if (match.Division) {
				divisionMap.set(match.Division.DivisionId, match.Division);
			}
		}
		const divisions = Array.from(divisionMap.values()).sort((a, b) => a.Name.localeCompare(b.Name));

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
		const teams = Array.from(teamsMap.values()).sort((a, b) => {
			// First sort by division
			const divCompare = a.DivisionName.localeCompare(b.DivisionName);
			if (divCompare !== 0) return divCompare;
			// Then by team name
			return a.TeamName.localeCompare(b.TeamName);
		});

		return {
			divisions,
			teams,
			eventId: currentEventId
		};
	} catch (err) {
		console.error('Failed to load filter options:', err);
		throw err;
	}
};
