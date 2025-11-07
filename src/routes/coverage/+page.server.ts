// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for coverage page
// Note: Uses team-centric approach - gets teams by club, then schedules

import type { PageServerLoad } from './$types';
import { fetchTeamAssignments, fetchTeamSchedule } from '$lib/services/aes';
import { eventId, clubId } from '$lib/stores/event';
import { get } from 'svelte/store';
import type { Match } from '$lib/types/aes';

export const load: PageServerLoad = async ({ fetch }) => {
	const currentEventId = get(eventId);
	const currentClubId = get(clubId);

	if (!currentEventId || !currentClubId) {
		return {
			allMatches: [],
			eventId: currentEventId
		};
	}

	try {
		// Step 1: Get all teams for this club using OData endpoint
		const teams = await fetchTeamAssignments(currentEventId, currentClubId, fetch);

		console.log(`Coverage page: Found ${teams.length} teams for club ${currentClubId}`);

		// Step 2: Get all schedules for each team (current, past, future, work)
		const allMatches: Match[] = [];
		const matchIds = new Set<number>();
		const scheduleTypes = ['current', 'past', 'future', 'work'] as const;

		for (const team of teams) {
			// Fetch all schedule types for this team
			for (const scheduleType of scheduleTypes) {
				try {
					const teamSchedule = await fetchTeamSchedule(
						currentEventId,
						team.TeamDivision,
						team.TeamId,
						scheduleType,
						fetch
					);

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

		console.log(`Coverage page: Built schedule with ${allMatches.length} unique matches`);

		return {
			allMatches,
			eventId: currentEventId
		};
	} catch (err) {
		console.error('Failed to load coverage data:', err);
		throw err;
	}
};
