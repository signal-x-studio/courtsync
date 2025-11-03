// Unit tests for AES API service functions
// Purpose: Validate API data fetching and transformation logic
// Critical: These tests catch data structure mismatches between API and our types

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTeamSchedule, fetchTeamAssignments, fetchEventInfo } from './aes';
import {
	mockTeamScheduleResponse,
	mockTeamScheduleResponseEmpty,
	mockTeamScheduleResponseNoMatches
} from '$lib/../tests/fixtures/teamScheduleResponse';
import { mockTeamAssignmentsResponse } from '$lib/../tests/fixtures/teamAssignmentResponse';
import { mockEventInfoResponse } from '$lib/../tests/fixtures/eventInfoResponse';
import { expectedTransformedMatches, mockDivision } from '$lib/../tests/fixtures/expectedMatches';

describe('fetchTeamSchedule', () => {
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockFetch = vi.fn();
	});

	it('should correctly transform nested Play/Matches structure', async () => {
		// Mock the fetch response
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponse
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		// Should flatten all matches from all plays
		expect(result).toHaveLength(3);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/schedule/current'
		);
	});

	it('should convert ISO timestamp strings to Unix milliseconds', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponse
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		// Check that timestamps are numbers (Unix milliseconds), not strings
		expect(typeof result[0].ScheduledStartDateTime).toBe('number');
		expect(typeof result[0].ScheduledEndDateTime).toBe('number');

		// Verify the actual timestamp values match expected conversion
		expect(result[0].ScheduledStartDateTime).toBe(
			new Date('2025-11-03T12:00:00').getTime()
		);
		expect(result[0].ScheduledEndDateTime).toBe(new Date('2025-11-03T12:59:59').getTime());
	});

	it('should add Division object to each match', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponse
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		// CRITICAL: Division object must exist to prevent "Cannot read properties of undefined"
		result.forEach((match) => {
			expect(match.Division).toBeDefined();
			expect(match.Division.DivisionId).toBe(197487);
			expect(match.Division.Name).toBe('13 Open');
			expect(match.Division.ColorHex).toBe('#FF5733');
		});
	});

	it('should add HasOutcome field based on HasScores and TypeOfOutcome', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponse
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		// Match with HasScores: false, TypeOfOutcome: 0
		expect(result[0].HasOutcome).toBe(false);

		// Match with HasScores: true (should set HasOutcome to true)
		expect(result[1].HasOutcome).toBe(true);

		// Match with TypeOfOutcome > 0 (should set HasOutcome to true)
		expect(result[1].TypeOfOutcome).toBeGreaterThan(0);
		expect(result[1].HasOutcome).toBe(true);
	});

	it('should add CourtName from Court.Name', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponse
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		expect(result[0].CourtName).toBe('North 88');
		expect(result[1].CourtName).toBe('North 87');
		expect(result[2].CourtName).toBe('South 1');
	});

	it('should handle empty response array', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponseEmpty
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		expect(result).toEqual([]);
	});

	it('should handle plays with no matches', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponseNoMatches
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		expect(result).toEqual([]);
	});

	it('should throw error on failed request', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found'
		});

		await expect(
			fetchTeamSchedule('PTAwMDAwNDEzMTQ90', mockDivision, 126569, 'current', mockFetch)
		).rejects.toThrow('Failed to fetch team schedule: Not Found');
	});

	it('should match expected transformed output exactly', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamScheduleResponse
		});

		const result = await fetchTeamSchedule(
			'PTAwMDAwNDEzMTQ90',
			mockDivision,
			126569,
			'current',
			mockFetch
		);

		// Compare against our expected fixtures
		expect(result).toEqual(expectedTransformedMatches);
	});

	it('should handle all schedule types (current, work, future, past)', async () => {
		const scheduleTypes: Array<'current' | 'work' | 'future' | 'past'> = [
			'current',
			'work',
			'future',
			'past'
		];

		for (const scheduleType of scheduleTypes) {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamScheduleResponse
			});

			const result = await fetchTeamSchedule(
				'PTAwMDAwNDEzMTQ90',
				mockDivision,
				126569,
				scheduleType,
				mockFetch
			);

			expect(result).toHaveLength(3);
			expect(mockFetch).toHaveBeenCalledWith(
				`https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/schedule/${scheduleType}`
			);
		}
	});
});

describe('fetchTeamAssignments', () => {
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockFetch = vi.fn();
	});

	it('should fetch team assignments and return value array', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockTeamAssignmentsResponse
		});

		const result = await fetchTeamAssignments('PTAwMDAwNDEzMTQ90', 12345, mockFetch);

		expect(result).toHaveLength(2);
		expect(result[0].TeamId).toBe(126569);
		expect(result[0].TeamDivision.DivisionId).toBe(197487);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://results.advancedeventsystems.com/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=null,cId=12345,tIds=[])?$skip=0&$orderby=TeamName,TeamCode'
		);
	});

	it('should handle empty value array', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ value: [] })
		});

		const result = await fetchTeamAssignments('PTAwMDAwNDEzMTQ90', 12345, mockFetch);

		expect(result).toEqual([]);
	});

	it('should throw error on failed request', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Unauthorized'
		});

		await expect(
			fetchTeamAssignments('PTAwMDAwNDEzMTQ90', 12345, mockFetch)
		).rejects.toThrow('Failed to fetch team assignments: Unauthorized');
	});
});

describe('fetchEventInfo', () => {
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockFetch = vi.fn();
	});

	it('should fetch event information with clubs and divisions', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockEventInfoResponse
		});

		const result = await fetchEventInfo('PTAwMDAwNDEzMTQ90', mockFetch);

		expect(result.EventId).toBe(41314);
		expect(result.Name).toBe('Thanksgiving Tournament 2025');
		expect(result.Clubs).toHaveLength(3);
		expect(result.Divisions).toHaveLength(3);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90'
		);
	});

	it('should throw error on failed request', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found'
		});

		await expect(fetchEventInfo('PTAwMDAwNDEzMTQ90', mockFetch)).rejects.toThrow(
			'Failed to fetch event info: Not Found'
		);
	});
});
