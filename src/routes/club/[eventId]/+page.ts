// Reference: https://svelte.dev/docs/kit/load
// Purpose: Client-side load function with caching for club hub page
// Note: Uses cached match data with 5-minute TTL to reduce API calls

import type { PageLoad } from './$types';
import { matchCache } from '$lib/stores/matchCache';
import { fetchTeamAssignments, fetchTeamSchedule } from '$lib/services/aes';
import type { Match } from '$lib/types/aes';

export const load: PageLoad = async ({ params, url, fetch }) => {
	const { eventId } = params;
	const clubId = Number(url.searchParams.get('clubId'));
	const forceRefresh = url.searchParams.get('refresh') === 'true';

	if (!clubId) {
		return {
			allMatches: [],
			eventId,
			cached: false,
			cacheAge: null
		};
	}

	// Check if we should use cached data
	if (!forceRefresh && matchCache.isValid(eventId, clubId)) {
		const cachedMatches = matchCache.get(eventId, clubId);
		if (cachedMatches) {
			console.log('Using cached match data');
			return {
				allMatches: cachedMatches,
				eventId,
				cached: true,
				cacheAge: matchCache.getAge()
			};
		}
	}

	// Fetch fresh data
	console.log('Fetching fresh match data from API');
	try {
		// Step 1: Get all teams for this club
		const teams = await fetchTeamAssignments(eventId, clubId, fetch);
		console.log(`Found ${teams.length} teams for club ${clubId}`);

		// Step 2: Get all schedules for each team
		const allMatches: Match[] = [];
		const matchIds = new Set<number>();
		const scheduleTypes = ['current', 'past', 'future', 'work'] as const;

		for (const team of teams) {
			for (const scheduleType of scheduleTypes) {
				try {
					const teamSchedule = await fetchTeamSchedule(
						eventId,
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
					console.warn(`Failed to get ${scheduleType} schedule for team ${team.TeamId}:`, err);
				}
			}
		}

		console.log(`Built schedule with ${allMatches.length} unique matches`);

		// Save to cache
		matchCache.save(allMatches, eventId, clubId);

		return {
			allMatches,
			eventId,
			cached: false,
			cacheAge: null
		};
	} catch (err) {
		console.error('Failed to load team schedules:', err);

		// Try to return cached data even if expired
		const cachedMatches = matchCache.get(eventId, clubId);
		if (cachedMatches) {
			console.log('API failed, using stale cache');
			return {
				allMatches: cachedMatches,
				eventId,
				cached: true,
				cacheAge: matchCache.getAge(),
				error: 'Failed to fetch fresh data, showing cached data'
			};
		}

		throw err;
	}
};
