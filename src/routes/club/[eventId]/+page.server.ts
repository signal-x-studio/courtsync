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

		// Step 2: Get all schedules for each team (current, past, future, work)
		const allMatches: Match[] = [];
		const matchIds = new Set<number>(); // Track unique match IDs
		const scheduleTypes = ['current', 'past', 'future', 'work'] as const;

		for (const team of teams) {
			// Fetch all schedule types for this team
			for (const scheduleType of scheduleTypes) {
				try {
					const teamSchedule = await fetchTeamSchedule(
						eventId,
						team.TeamDivision,
						team.TeamId,
						scheduleType,
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
					console.warn(
						`Failed to get ${scheduleType} schedule for team ${team.TeamId}:`,
						err
					);
				}
			}
		}

		console.log(`Built schedule with ${allMatches.length} unique matches`);

		// Extract club team IDs for visual distinction in match cards
		const clubTeamIds = teams.map(t => t.TeamId);

		return {
			allMatches,
			eventId,
			clubTeamIds
		};
	} catch (err) {
		console.error('Failed to load team schedules:', err);
		throw err;
	}
};
