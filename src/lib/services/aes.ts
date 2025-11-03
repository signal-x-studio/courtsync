// Reference: guides/UNIFIED_AES_API_GUIDE.md
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
// Purpose: Function-based API client for Advanced Event Systems (AES) API
// Note: Uses fetchFn parameter for SvelteKit SSR compatibility

import type {
	EventInfo,
	CourtSchedule,
	TeamAssignment,
	Match,
	PoolsheetResponse
} from '$lib/types/aes';

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';
const ODATA_BASE_URL = 'https://results.advancedeventsystems.com/odata';

// ========================================
// Event Endpoints
// ========================================

/**
 * Fetch event information including clubs and divisions
 * @param eventId - Base64-encoded event ID (e.g., "PTAwMDAwNDEzMTQ90")
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchEventInfo = async (
	eventId: string,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<EventInfo> => {
	const url = `${API_BASE_URL}/event/${eventId}`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch event info: ${response.statusText}`);
	}

	return response.json();
};

// ========================================
// Court Schedule Endpoints
// ========================================

/**
 * Fetch court schedule for a specific date and time window
 * @param eventId - Base64-encoded event ID
 * @param date - Date in YYYY-MM-DD format (e.g., "2025-11-01")
 * @param timeWindow - Minutes to look ahead (e.g., 300 = 5 hours, 1440 = 24 hours)
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 * @returns CourtSchedule with nested CourtSchedules array
 */
export const fetchCourtSchedule = async (
	eventId: string,
	date: string,
	timeWindow: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<CourtSchedule> => {
	const url = `${API_BASE_URL}/event/${eventId}/courts/${date}/${timeWindow}`;

	try {
		const response = await fetchFn(url);

		if (!response.ok) {
			// Try to get error details
			const text = await response.text();
			console.error('Court schedule API error:', {
				url,
				status: response.status,
				statusText: response.statusText,
				body: text.substring(0, 500)
			});
			throw new Error(`Failed to fetch court schedule: ${response.statusText}`);
		}

		return response.json();
	} catch (err) {
		console.error('Court schedule fetch error:', err);
		throw err;
	}
};

// ========================================
// Team Endpoints (OData)
// ========================================

/**
 * Fetch team assignments for all teams in a club (OData endpoint)
 * @param eventId - Base64-encoded event ID
 * @param clubId - Club ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 * @returns Array of team assignments with next match and work assignments
 */
export const fetchTeamAssignments = async (
	eventId: string,
	clubId: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<TeamAssignment[]> => {
	const url = `${ODATA_BASE_URL}/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch team assignments: ${response.statusText}`);
	}

	const data = await response.json();
	return data.value || [];
};

/**
 * Alias for fetchTeamAssignments (for clarity in code)
 */
export const fetchTeamsByClub = async (
	eventId: string,
	clubId: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<TeamAssignment[]> => {
	return fetchTeamAssignments(eventId, clubId, fetchFn);
};

/**
 * Fetch teams filtered by both club AND division (OData endpoint)
 * @param eventId - Base64-encoded event ID
 * @param clubId - Club ID number
 * @param divisionId - Division ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 * @returns Array of team assignments filtered by division
 */
export const fetchTeamsByClubAndDivision = async (
	eventId: string,
	clubId: number,
	divisionId: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<TeamAssignment[]> => {
	const url = `${ODATA_BASE_URL}/${eventId}/nextassignments(dId=${divisionId},cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch team assignments: ${response.statusText}`);
	}

	const data = await response.json();
	return data.value || [];
};

// ========================================
// Team Schedule Endpoints
// ========================================

/**
 * Fetch schedule for a specific team filtered by type
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param teamId - Team ID number
 * @param scheduleType - Type of schedule to fetch
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 * @returns Array of matches for the team
 * @note Team schedule API returns ISO strings, we convert to Unix timestamps for consistency
 */
export const fetchTeamSchedule = async (
	eventId: string,
	divisionId: number,
	teamId: number,
	scheduleType: 'current' | 'work' | 'future' | 'past',
	fetchFn: typeof fetch = globalThis.fetch
): Promise<Match[]> => {
	const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/team/${teamId}/schedule/${scheduleType}`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch team schedule: ${response.statusText}`);
	}

	const data = await response.json();

	// Team schedule API returns ISO strings, convert to Unix timestamps
	// for consistency with court schedule API format
	if (Array.isArray(data)) {
		return data.map((match: any) => ({
			...match,
			ScheduledStartDateTime:
				typeof match.ScheduledStartDateTime === 'string'
					? new Date(match.ScheduledStartDateTime).getTime()
					: match.ScheduledStartDateTime,
			ScheduledEndDateTime:
				typeof match.ScheduledEndDateTime === 'string'
					? new Date(match.ScheduledEndDateTime).getTime()
					: match.ScheduledEndDateTime
		}));
	}

	return data;
};

/**
 * Fetch past matches for a team (convenience function)
 */
export const fetchTeamSchedulePast = async (
	eventId: string,
	divisionId: number,
	teamId: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<Match[]> => {
	return fetchTeamSchedule(eventId, divisionId, teamId, 'past', fetchFn);
};

/**
 * Fetch team roster (players and coaches)
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param teamId - Team ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 * @returns Array of roster members
 */
export const fetchTeamRoster = async (
	eventId: string,
	divisionId: number,
	teamId: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<Array<{ FullName: string; RoleOrJersey: string }>> => {
	const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/team/${teamId}/roster`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch team roster: ${response.statusText}`);
	}

	return response.json();
};

// ========================================
// Division Endpoints
// ========================================

/**
 * Fetch all plays (pools/brackets) for a division
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchDivisionPlays = async (
	eventId: string,
	divisionId: number,
	fetchFn: typeof fetch = globalThis.fetch
) => {
	const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/plays`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch division plays: ${response.statusText}`);
	}

	return response.json();
};

/**
 * Fetch plays scheduled for a specific date
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param date - Date in YYYY-MM-DD format
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchPlaysByDate = async (
	eventId: string,
	divisionId: number,
	date: string,
	fetchFn: typeof fetch = globalThis.fetch
) => {
	const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/plays/${date}`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch plays by date: ${response.statusText}`);
	}

	return response.json();
};

/**
 * Fetch plays for multiple dates in parallel
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param dates - Array of dates in YYYY-MM-DD format
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchPlaysForDateRange = async (
	eventId: string,
	divisionId: number,
	dates: string[],
	fetchFn: typeof fetch = globalThis.fetch
) => {
	return Promise.all(
		dates.map((date) =>
			fetchPlaysByDate(eventId, divisionId, date, fetchFn).catch((err) => {
				console.warn(`Failed to fetch plays for ${date}:`, err);
				return { Plays: [] };
			})
		)
	);
};

/**
 * Fetch all clubs participating in a division
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchClubsByDivision = async (
	eventId: string,
	divisionId: number,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<Array<{ ClubId: number; Name: string }>> => {
	const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/clubs`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch clubs by division: ${response.statusText}`);
	}

	return response.json();
};

/**
 * Fetch playdays for a division
 * @param eventId - Base64-encoded event ID
 * @param divisionId - Division ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchDivisionPlaydays = async (
	eventId: string,
	divisionId: number,
	fetchFn: typeof fetch = globalThis.fetch
) => {
	const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/playdays`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch division playdays: ${response.statusText}`);
	}

	return response.json();
};

// ========================================
// Poolsheet Endpoints
// ========================================

/**
 * Fetch pool sheet standings and matches
 * Note: Uses proxy route to avoid CORS and handle 404s properly
 * @param eventId - Base64-encoded event ID
 * @param playId - Play ID (can be negative, e.g., -54617)
 * @returns Poolsheet with standings and matches
 */
export const fetchPoolSheet = async (
	eventId: string,
	playId: number
): Promise<PoolsheetResponse> => {
	// Use server-side endpoint to avoid CORS issues
	const url = `/api/poolsheet/${eventId}/${playId}`;
	const response = await fetch(url);

	if (!response.ok) {
		// For 404s, throw a specific error that can be caught upstream
		if (response.status === 404) {
			const error = new Error('Poolsheet not available');
			(error as any).status = 404;
			(error as any).is404 = true;
			throw error;
		}
		throw new Error(`Failed to fetch pool sheet: ${response.statusText}`);
	}

	const data = await response.json();

	// Check if response has error field (from our server endpoint)
	if (data.error) {
		const error = new Error(data.error);
		(error as any).status = response.status || 404;
		(error as any).is404 = true;
		throw error;
	}

	return data;
};

// ========================================
// Play Endpoints
// ========================================

/**
 * Fetch division information for a specific play
 * @param eventId - Base64-encoded event ID
 * @param playId - Play ID number
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchPlayDivision = async (
	eventId: string,
	playId: number,
	fetchFn: typeof fetch = globalThis.fetch
) => {
	const url = `${API_BASE_URL}/event/${eventId}/play/${playId}/division`;
	const response = await fetchFn(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch play division: ${response.statusText}`);
	}

	return response.json();
};

// ========================================
// Convenience Functions
// ========================================

/**
 * Fetch all clubs from event info (convenience wrapper)
 * @param eventId - Base64-encoded event ID
 * @param fetchFn - Fetch function (use load function's fetch for SSR)
 */
export const fetchClubsByEvent = async (
	eventId: string,
	fetchFn: typeof fetch = globalThis.fetch
): Promise<Array<{ ClubId: number; Name: string }>> => {
	const eventInfo = await fetchEventInfo(eventId, fetchFn);
	return eventInfo.Clubs || [];
};

/**
 * Flatten court schedule matches into a single array with court info
 * @param schedule - CourtSchedule response from fetchCourtSchedule
 * @returns Flattened array of matches with CourtName, CourtId, VideoLink
 */
export const flattenCourtScheduleMatches = (schedule: CourtSchedule): Match[] => {
	return schedule.CourtSchedules.flatMap((court) =>
		court.CourtMatches.map((match) => ({
			...match,
			CourtName: court.Name,
			CourtId: court.CourtId
		}))
	);
};
