// Reference: https://svelte.dev/docs/kit/load
// Purpose: Server-side load function for filters page
// Note: Uses team-centric approach - gets teams by club from OData

import type { PageServerLoad } from './$types';
import { fetchTeamAssignments } from '$lib/services/aes';
import { eventId, clubId } from '$lib/stores/event';
import { get } from 'svelte/store';

export const load: PageServerLoad = async ({ fetch }) => {
	// Get event ID and club ID from stores
	const currentEventId = get(eventId);
	const currentClubId = get(clubId);

	if (!currentEventId || !currentClubId) {
		return {
			divisions: [],
			teams: [],
			eventId: currentEventId
		};
	}

	try {
		// Get all teams for this club using OData endpoint
		const teams = await fetchTeamAssignments(currentEventId, currentClubId, fetch);

		// Extract unique divisions from teams
		const divisionMap = new Map<number, any>();
		for (const team of teams) {
			if (team.TeamDivision) {
				divisionMap.set(team.TeamDivision.DivisionId, {
					DivisionId: team.TeamDivision.DivisionId,
					Name: team.TeamDivision.Name,
					ColorHex: team.TeamDivision.ColorHex
				});
			}
		}
		const divisions = Array.from(divisionMap.values()).sort((a, b) =>
			a.Name.localeCompare(b.Name)
		);

		// Convert teams to simpler format
		const simpleTeams = teams.map((t) => ({
			TeamId: t.TeamId,
			TeamName: t.TeamName,
			TeamCode: t.TeamCode,
			ClubId: t.TeamClub.ClubId,
			ClubName: t.TeamClub.Name,
			DivisionId: t.TeamDivision.DivisionId,
			DivisionName: t.TeamDivision.Name
		})).sort((a, b) => {
			const divCompare = a.DivisionName.localeCompare(b.DivisionName);
			if (divCompare !== 0) return divCompare;
			return a.TeamName.localeCompare(b.TeamName);
		});

		return {
			divisions,
			teams: simpleTeams,
			eventId: currentEventId
		};
	} catch (err) {
		console.error('Failed to load filter options:', err);
		throw err;
	}
};
