// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for my teams page
// Note: Uses team-centric approach - gets teams by club, then schedules

import type { PageServerLoad } from './$types';
import { fetchTeamAssignments, fetchTeamSchedule } from '$lib/services/aes';
import { eventId, clubId } from '$lib/stores/event';
import { get } from 'svelte/store';
import type { Match } from '$lib/types/aes';

export const load: PageServerLoad = async ({ fetch }) => {
	// Get event ID and club ID from stores
	const currentEventId = get(eventId);
	const currentClubId = get(clubId);

	if (!currentEventId || !currentClubId) {
		return {
			allMatches: [],
			availableTeams: [],
			eventId: currentEventId
		};
	}

	try {
		// Step 1: Get all teams for this club using OData endpoint
		const teams = await fetchTeamAssignments(currentEventId, currentClubId, fetch);

		// Step 2: Get current schedule for each team
		const allMatches: Match[] = [];
		const matchIds = new Set<number>();

		for (const team of teams) {
			try {
				const teamSchedule = await fetchTeamSchedule(
					currentEventId,
					team.TeamDivision.DivisionId,
					team.TeamId,
					'current',
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
				console.warn(`Failed to get schedule for team ${team.TeamId}:`, err);
			}
		}

		// Convert OData team assignments to simpler format for UI
		const availableTeams = teams.map((t) => ({
			TeamId: t.TeamId,
			TeamName: t.TeamName,
			TeamCode: t.TeamCode,
			ClubId: t.TeamClub.ClubId,
			ClubName: t.TeamClub.Name,
			DivisionId: t.TeamDivision.DivisionId,
			DivisionName: t.TeamDivision.Name
		}));

		return {
			allMatches,
			availableTeams,
			eventId: currentEventId
		};
	} catch (err) {
		console.error('Failed to load team data:', err);
		throw err;
	}
};
