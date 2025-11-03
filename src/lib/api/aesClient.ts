// Reference: docs/product-requirements.md (AES API integration)
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
// Purpose: Client for Advanced Event Systems (AES) API
// Note: All endpoints return JSON; errors throw with descriptive messages

import type { EventInfo, CourtSchedule, TeamAssignment, Match } from '$lib/types/aes';

const AES_BASE_URL = 'https://results.advancedeventsystems.com';

class AESClient {
	/**
	 * Get event information including clubs and dates
	 */
	async getEvent(eventId: string): Promise<EventInfo> {
		const response = await fetch(`${AES_BASE_URL}/api/event/${eventId}`);
		if (!response.ok) throw new Error('Failed to fetch event');
		return response.json();
	}

	/**
	 * Get court schedule for a specific date and time window
	 * @param timeWindow - Minutes to look ahead (default 1440 = 24 hours)
	 */
	async getCourtSchedule(
		eventId: string,
		date: string,
		timeWindow: number = 1440
	): Promise<CourtSchedule> {
		const response = await fetch(
			`${AES_BASE_URL}/api/event/${eventId}/courts/${date}/${timeWindow}`
		);
		if (!response.ok) throw new Error('Failed to fetch schedule');
		return response.json();
	}

	/**
	 * Get team assignments for a specific club
	 * Uses OData endpoint with filtering
	 */
	async getTeamAssignments(eventId: string, clubId: number): Promise<TeamAssignment[]> {
		const response = await fetch(
			`${AES_BASE_URL}/odata/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`
		);
		if (!response.ok) throw new Error('Failed to fetch teams');
		const data = await response.json();
		return data.value || [];
	}

	/**
	 * Get team schedule by type (current, work, future, past)
	 */
	async getTeamSchedule(
		eventId: string,
		divisionId: number,
		teamId: number,
		scheduleType: 'current' | 'work' | 'future' | 'past'
	): Promise<Match[]> {
		const response = await fetch(
			`${AES_BASE_URL}/api/event/${eventId}/division/${divisionId}/team/${teamId}/schedule/${scheduleType}`
		);
		if (!response.ok) throw new Error('Failed to fetch team schedule');
		return response.json();
	}

	/**
	 * Get division plays (bracket/pool information)
	 */
	async getDivisionPlays(eventId: string, divisionId: number): Promise<any> {
		const response = await fetch(
			`${AES_BASE_URL}/api/event/${eventId}/division/${divisionId}/plays`
		);
		if (!response.ok) throw new Error('Failed to fetch division plays');
		return response.json();
	}

	/**
	 * Get pool sheet standings
	 */
	async getPoolSheet(eventId: string, playId: number): Promise<any> {
		const response = await fetch(`${AES_BASE_URL}/api/event/${eventId}/poolsheet/${playId}`);
		if (!response.ok) throw new Error('Failed to fetch pool sheet');
		return response.json();
	}

	/**
	 * Get team roster (players)
	 */
	async getTeamRoster(
		eventId: string,
		divisionId: number,
		teamId: number
	): Promise<any[]> {
		const response = await fetch(
			`${AES_BASE_URL}/api/event/${eventId}/division/${divisionId}/team/${teamId}/roster`
		);
		if (!response.ok) throw new Error('Failed to fetch roster');
		return response.json();
	}
}

export const aesClient = new AESClient();
