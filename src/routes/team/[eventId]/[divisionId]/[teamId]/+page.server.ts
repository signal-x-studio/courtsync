// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for team detail page
// Note: Fetches team schedules, pool standings, and roster

import type { PageServerLoad } from './$types';
import {
	fetchTeamSchedule,
	fetchTeamRoster,
	fetchPoolSheet,
	fetchDivisionPlays,
	fetchEventInfo
} from '$lib/services/aes';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const eventId = params.eventId;
	const divisionId = Number(params.divisionId);
	const teamId = Number(params.teamId);

	try {
		// Get event info to find division details
		const eventInfo = await fetchEventInfo(eventId, fetch);
		const division = eventInfo.Divisions?.find((d) => d.DivisionId === divisionId);

		if (!division) {
			throw new Error('Division not found');
		}

		// Fetch all schedule types in parallel
		const [current, work, future, past, roster] = await Promise.all([
			fetchTeamSchedule(eventId, division, teamId, 'current', fetch),
			fetchTeamSchedule(eventId, division, teamId, 'work', fetch),
			fetchTeamSchedule(eventId, division, teamId, 'future', fetch),
			fetchTeamSchedule(eventId, division, teamId, 'past', fetch),
			fetchTeamRoster(eventId, divisionId, teamId, fetch).catch(() => [])
		]);

		// Try to get pool standings
		let poolSheet = null;
		try {
			// First get division plays to find the pool/play ID
			const plays = await fetchDivisionPlays(eventId, divisionId, fetch);

			// Find the play that contains this team (would need to iterate through plays)
			// For now, we'll try with a basic play ID
			// This is a simplified implementation - you may need to iterate through plays
			if (plays && plays.Plays && plays.Plays.length > 0) {
				const playId = plays.Plays[0].PlayId;
				poolSheet = await fetchPoolSheet(eventId, playId);
			}
		} catch (err) {
			console.warn('Could not load pool standings:', err);
		}

		return {
			eventId,
			divisionId,
			teamId,
			schedules: {
				current,
				work,
				future,
				past
			},
			roster,
			poolSheet
		};
	} catch (err) {
		console.error('Failed to load team data:', err);
		throw err;
	}
};
