// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for match detail page
// Note: Uses team-centric approach - gets match via team schedule

import type { PageServerLoad } from './$types';
import { fetchTeamSchedule, fetchEventInfo } from '$lib/services/aes';
import { eventId } from '$lib/stores/event';
import { get } from 'svelte/store';
import type { Match } from '$lib/types/aes';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const matchId = Number(params.matchId);
	const currentEventId = get(eventId);

	// Get team context from URL params (passed from match card)
	const divisionId = Number(url.searchParams.get('divisionId'));
	const teamId = Number(url.searchParams.get('teamId'));

	if (!currentEventId || !divisionId || !teamId) {
		return {
			matchId,
			match: null,
			error: 'Missing event or team context'
		};
	}

	try {
		// Get event info to find division details
		const eventInfo = await fetchEventInfo(currentEventId, fetch);
		const division = eventInfo.Divisions?.find((d) => d.DivisionId === divisionId);

		if (!division) {
			return {
				matchId,
				match: null,
				error: 'Division not found'
			};
		}

		// Fetch all schedules for this team (current, work, future, past)
		const [current, work, future, past] = await Promise.all([
			fetchTeamSchedule(currentEventId, division, teamId, 'current', fetch),
			fetchTeamSchedule(currentEventId, division, teamId, 'work', fetch),
			fetchTeamSchedule(currentEventId, division, teamId, 'future', fetch),
			fetchTeamSchedule(currentEventId, division, teamId, 'past', fetch)
		]);

		// Combine all matches and find the one we want
		const allMatches = [...current, ...work, ...future, ...past];
		const match = allMatches.find((m) => m.MatchId === matchId);

		if (!match) {
			return {
				matchId,
				match: null,
				error: 'Match not found'
			};
		}

		return {
			matchId,
			match,
			error: null
		};
	} catch (err) {
		console.error('Failed to load match:', err);
		return {
			matchId,
			match: null,
			error: err instanceof Error ? err.message : 'Failed to load match'
		};
	}
};
