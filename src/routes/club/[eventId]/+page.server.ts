// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for club hub page
// Note: Uses team-centric approach - gets teams by club, then schedules for each team

import type { PageServerLoad } from './$types';
import { fetchTeamAssignments, fetchTeamSchedule } from '$lib/services/aes';
import type { Match } from '$lib/types/aes';

export const load: PageServerLoad = async ({ fetch, params, url }) => {
	const { eventId } = params;
	const clubId = Number(url.searchParams.get('clubId'));

	if (!clubId) {
		return {
			allMatches: [],
			eventId
		};
	}

	try {
		// Step 1: Get all teams for this club using OData endpoint
		const teams = await fetchTeamAssignments(eventId, clubId, fetch);

		console.log(`Found ${teams.length} teams for club ${clubId}`);

		// Step 2: Get current schedule for each team
		const allMatches: Match[] = [];
		const matchIds = new Set<number>(); // Track unique match IDs

		for (const team of teams) {
			try {
				// Get current matches for this team
				const teamSchedule = await fetchTeamSchedule(
					eventId,
					team.TeamDivision,
					team.TeamId,
					'current',
					fetch
				);

				// Add matches to our collection (avoiding duplicates)
				if (Array.isArray(teamSchedule)) {
					for (const match of teamSchedule) {
						if (!matchIds.has(match.MatchId)) {
							matchIds.add(match.MatchId);
							allMatches.push(match);
						}
					}
				}
			} catch (err) {
				console.warn(`Failed to get schedule for team ${team.TeamId}:`, err);
			}
		}

		console.log(`Built schedule with ${allMatches.length} unique matches`);

		return {
			allMatches,
			eventId
		};
	} catch (err) {
		console.error('Failed to load team schedules:', err);
		throw err;
	}
};
