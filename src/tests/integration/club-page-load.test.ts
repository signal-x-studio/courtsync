// Integration tests for club page server load function
// Purpose: Validate end-to-end data loading and transformation
// Critical: These tests ensure Division object exists before rendering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from '../../routes/club/[eventId]/+page.server';
import { mockTeamAssignmentsResponse } from '../fixtures/teamAssignmentResponse';
import { mockTeamScheduleResponse } from '../fixtures/teamScheduleResponse';

describe('Club Page Load Function', () => {
	let mockFetch: ReturnType<typeof vi.fn>;
	let mockParams: { eventId: string };
	let mockUrl: URL;

	beforeEach(() => {
		mockFetch = vi.fn();
		mockParams = { eventId: 'PTAwMDAwNDEzMTQ90' };
		mockUrl = new URL('http://localhost:5173/club/PTAwMDAwNDEzMTQ90?clubId=12345');
	});

	it('should load and transform team schedules with all required fields', async () => {
		// Mock fetchTeamAssignments response
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamAssignmentsResponse
			})
			// Mock fetchTeamSchedule responses (one for each team)
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			});

		const result = await load({
			fetch: mockFetch,
			params: mockParams,
			url: mockUrl
		} as any);

		// Should have loaded matches
		expect(result.allMatches).toBeDefined();
		expect(result.allMatches.length).toBeGreaterThan(0);

		// CRITICAL: Each match must have Division object
		result.allMatches.forEach((match) => {
			expect(match.Division).toBeDefined();
			expect(match.Division.DivisionId).toBeDefined();
			expect(match.Division.Name).toBeDefined();
			expect(match.Division.ColorHex).toBeDefined();
		});
	});

	it('should have Unix timestamp fields as numbers', async () => {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamAssignmentsResponse
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			});

		const result = await load({
			fetch: mockFetch,
			params: mockParams,
			url: mockUrl
		} as any);

		result.allMatches.forEach((match) => {
			// Must be numbers (Unix milliseconds), not ISO strings
			expect(typeof match.ScheduledStartDateTime).toBe('number');
			expect(typeof match.ScheduledEndDateTime).toBe('number');

			// Must be valid timestamps (not NaN, not 0, not negative)
			expect(match.ScheduledStartDateTime).toBeGreaterThan(0);
			expect(match.ScheduledEndDateTime).toBeGreaterThan(0);
			expect(Number.isNaN(match.ScheduledStartDateTime)).toBe(false);
			expect(Number.isNaN(match.ScheduledEndDateTime)).toBe(false);
		});
	});

	it('should have HasOutcome and CourtName fields', async () => {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamAssignmentsResponse
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			});

		const result = await load({
			fetch: mockFetch,
			params: mockParams,
			url: mockUrl
		} as any);

		result.allMatches.forEach((match) => {
			expect(match.HasOutcome).toBeDefined();
			expect(typeof match.HasOutcome).toBe('boolean');

			// CourtName should be extracted from Court.Name
			if (match.Court?.Name) {
				expect(match.CourtName).toBe(match.Court.Name);
			}
		});
	});

	it('should deduplicate matches across teams', async () => {
		// Both teams return the same matches (simulating teams in same match)
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamAssignmentsResponse
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse)
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify(mockTeamScheduleResponse) // Same matches
			});

		const result = await load({
			fetch: mockFetch,
			params: mockParams,
			url: mockUrl
		} as any);

		// Count unique MatchIds
		const matchIds = result.allMatches.map((m) => m.MatchId);
		const uniqueMatchIds = new Set(matchIds);

		// Should deduplicate - no duplicate MatchIds
		expect(matchIds.length).toBe(uniqueMatchIds.size);
	});

	it('should return empty array when clubId is missing', async () => {
		const urlWithoutClub = new URL('http://localhost:5173/club/PTAwMDAwNDEzMTQ90');

		const result = await load({
			fetch: mockFetch,
			params: mockParams,
			url: urlWithoutClub
		} as any);

		expect(result.allMatches).toEqual([]);
		expect(result.eventId).toBe('PTAwMDAwNDEzMTQ90');
	});

	it('should handle API errors gracefully', async () => {
		mockFetch.mockRejectedValueOnce(new Error('API Error'));

		await expect(
			load({
				fetch: mockFetch,
				params: mockParams,
				url: mockUrl
			} as any)
		).rejects.toThrow('API Error');
	});

	it('should handle teams with no current matches', async () => {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamAssignmentsResponse
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify([]) // No matches
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => JSON.stringify([]) // No matches
			});

		const result = await load({
			fetch: mockFetch,
			params: mockParams,
			url: mockUrl
		} as any);

		expect(result.allMatches).toEqual([]);
	});
});
