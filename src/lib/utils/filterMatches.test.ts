// Unit tests for match filtering and transformation utilities
// Purpose: Validate data transformation, grouping, and status detection
// Critical: These tests catch timestamp handling and data validation issues

import { describe, it, expect, beforeEach } from 'vitest';
import {
	groupMatchesByTime,
	getMatchStatus,
	matchBelongsToClub,
	detectConflicts,
	applyFilters
} from './filterMatches';
import type { Match, MatchFilter } from '$lib/types';

describe('groupMatchesByTime', () => {
	const validMatches: Match[] = [
		{
			MatchId: 1,
			ScheduledStartDateTime: new Date('2025-11-03T12:00:00').getTime(),
			ScheduledEndDateTime: new Date('2025-11-03T12:59:59').getTime(),
			FirstTeamText: 'Team A',
			SecondTeamText: 'Team B',
			Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
			HasOutcome: false
		},
		{
			MatchId: 2,
			ScheduledStartDateTime: new Date('2025-11-03T12:00:00').getTime(),
			ScheduledEndDateTime: new Date('2025-11-03T12:59:59').getTime(),
			FirstTeamText: 'Team C',
			SecondTeamText: 'Team D',
			Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
			HasOutcome: false
		},
		{
			MatchId: 3,
			ScheduledStartDateTime: new Date('2025-11-03T14:00:00').getTime(),
			ScheduledEndDateTime: new Date('2025-11-03T14:59:59').getTime(),
			FirstTeamText: 'Team E',
			SecondTeamText: 'Team F',
			Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
			HasOutcome: false
		}
	];

	it('should group matches by their scheduled start time', () => {
		const result = groupMatchesByTime(validMatches);

		expect(result).toHaveLength(2); // Two time blocks
		expect(result[0].matches).toHaveLength(2); // 12:00 PM has 2 matches
		expect(result[1].matches).toHaveLength(1); // 2:00 PM has 1 match
	});

	it('should sort time blocks chronologically', () => {
		const result = groupMatchesByTime(validMatches);

		expect(result[0].timestamp).toBeLessThan(result[1].timestamp);
	});

	it('should format time strings correctly', () => {
		const result = groupMatchesByTime(validMatches);

		// Should be in "h:mm a" format (e.g., "12:00 PM")
		expect(result[0].time).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
		expect(result[1].time).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
	});

	it('should filter out matches with invalid timestamps', () => {
		const matchesWithInvalid: Match[] = [
			...validMatches,
			{
				MatchId: 4,
				ScheduledStartDateTime: NaN, // Invalid
				ScheduledEndDateTime: new Date('2025-11-03T16:00:00').getTime(),
				FirstTeamText: 'Team G',
				SecondTeamText: 'Team H',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			} as Match,
			{
				MatchId: 5,
				ScheduledStartDateTime: 0, // Invalid (zero)
				ScheduledEndDateTime: new Date('2025-11-03T16:00:00').getTime(),
				FirstTeamText: 'Team I',
				SecondTeamText: 'Team J',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			} as Match
		];

		const result = groupMatchesByTime(matchesWithInvalid);

		// Should only include the 3 valid matches, not the 2 invalid ones
		const totalMatches = result.reduce((sum, block) => sum + block.matches.length, 0);
		expect(totalMatches).toBe(3);
	});

	it('should handle empty match array', () => {
		const result = groupMatchesByTime([]);

		expect(result).toEqual([]);
	});

	it('should handle formatting errors gracefully', () => {
		const matchWithBadTimestamp: Match[] = [
			{
				MatchId: 1,
				ScheduledStartDateTime: -1, // Edge case
				ScheduledEndDateTime: new Date('2025-11-03T12:00:00').getTime(),
				FirstTeamText: 'Team A',
				SecondTeamText: 'Team B',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			} as Match
		];

		// Should filter out negative timestamps
		const result = groupMatchesByTime(matchWithBadTimestamp);
		expect(result).toEqual([]);
	});
});

describe('getMatchStatus', () => {
	const baseMatch: Match = {
		MatchId: 1,
		ScheduledStartDateTime: 0,
		ScheduledEndDateTime: 0,
		FirstTeamText: 'Team A',
		SecondTeamText: 'Team B',
		Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
		HasOutcome: false
	};

	it('should return "completed" if match has outcome', () => {
		const completedMatch = {
			...baseMatch,
			HasOutcome: true,
			ScheduledStartDateTime: Date.now() - 3600000, // 1 hour ago
			ScheduledEndDateTime: Date.now() + 3600000 // 1 hour from now
		};

		expect(getMatchStatus(completedMatch)).toBe('completed');
	});

	it('should return "live" for ongoing match without outcome', () => {
		const liveMatch = {
			...baseMatch,
			HasOutcome: false,
			ScheduledStartDateTime: Date.now() - 1800000, // 30 minutes ago
			ScheduledEndDateTime: Date.now() + 1800000 // 30 minutes from now
		};

		expect(getMatchStatus(liveMatch)).toBe('live');
	});

	it('should return "upcoming" for future match', () => {
		const upcomingMatch = {
			...baseMatch,
			HasOutcome: false,
			ScheduledStartDateTime: Date.now() + 3600000, // 1 hour from now
			ScheduledEndDateTime: Date.now() + 7200000 // 2 hours from now
		};

		expect(getMatchStatus(upcomingMatch)).toBe('upcoming');
	});

	it('should return "upcoming" for matches with invalid timestamps', () => {
		const invalidMatches = [
			{ ...baseMatch, ScheduledStartDateTime: NaN, ScheduledEndDateTime: Date.now() },
			{
				...baseMatch,
				ScheduledStartDateTime: Date.now(),
				ScheduledEndDateTime: NaN
			},
			{ ...baseMatch, ScheduledStartDateTime: 0, ScheduledEndDateTime: 0 }
		];

		invalidMatches.forEach((match) => {
			expect(getMatchStatus(match)).toBe('upcoming');
		});
	});
});

describe('matchBelongsToClub', () => {
	const match: Match = {
		MatchId: 1,
		FirstTeamId: 100,
		SecondTeamId: 200,
		WorkTeamId: 300,
		FirstTeamText: '630 Volleyball 13-1',
		SecondTeamText: 'MVVC B 13 National',
		WorkTeamText: 'Another Team',
		ScheduledStartDateTime: Date.now(),
		ScheduledEndDateTime: Date.now() + 3600000,
		Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
		HasOutcome: false
	};

	it('should match by team ID (preferred method)', () => {
		const filter: MatchFilter = {
			clubTeamIds: [100, 400, 500],
			clubTeamNames: []
		};

		expect(matchBelongsToClub(match, filter)).toBe(true);
	});

	it('should match by work team ID', () => {
		const filter: MatchFilter = {
			clubTeamIds: [300],
			clubTeamNames: []
		};

		expect(matchBelongsToClub(match, filter)).toBe(true);
	});

	it('should not match if team ID not in filter', () => {
		const filter: MatchFilter = {
			clubTeamIds: [999, 888],
			clubTeamNames: []
		};

		expect(matchBelongsToClub(match, filter)).toBe(false);
	});

	it('should fallback to text matching when IDs unavailable', () => {
		const matchWithoutIds: Match = {
			...match,
			FirstTeamId: undefined,
			SecondTeamId: undefined,
			WorkTeamId: undefined
		};

		const filter: MatchFilter = {
			clubTeamIds: [],
			clubTeamNames: ['630 Volleyball']
		};

		expect(matchBelongsToClub(matchWithoutIds, filter)).toBe(true);
	});

	it('should match partial team name text', () => {
		const filter: MatchFilter = {
			clubTeamIds: [],
			clubTeamNames: ['MVVC']
		};

		const matchWithoutIds: Match = {
			...match,
			FirstTeamId: undefined,
			SecondTeamId: undefined,
			WorkTeamId: undefined
		};

		expect(matchBelongsToClub(matchWithoutIds, filter)).toBe(true);
	});
});

describe('detectConflicts', () => {
	it('should detect overlapping matches', () => {
		const matches: Match[] = [
			{
				MatchId: 1,
				ScheduledStartDateTime: new Date('2025-11-03T12:00:00').getTime(),
				ScheduledEndDateTime: new Date('2025-11-03T12:59:59').getTime(),
				FirstTeamText: 'Team A',
				SecondTeamText: 'Team B',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			},
			{
				MatchId: 2,
				ScheduledStartDateTime: new Date('2025-11-03T12:30:00').getTime(),
				ScheduledEndDateTime: new Date('2025-11-03T13:29:59').getTime(),
				FirstTeamText: 'Team C',
				SecondTeamText: 'Team D',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			}
		];

		const conflicts = detectConflicts(matches);

		expect(conflicts.has(1)).toBe(true);
		expect(conflicts.has(2)).toBe(true);
	});

	it('should not detect conflicts for non-overlapping matches', () => {
		const matches: Match[] = [
			{
				MatchId: 1,
				ScheduledStartDateTime: new Date('2025-11-03T12:00:00').getTime(),
				ScheduledEndDateTime: new Date('2025-11-03T12:59:59').getTime(),
				FirstTeamText: 'Team A',
				SecondTeamText: 'Team B',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			},
			{
				MatchId: 2,
				ScheduledStartDateTime: new Date('2025-11-03T13:00:00').getTime(),
				ScheduledEndDateTime: new Date('2025-11-03T13:59:59').getTime(),
				FirstTeamText: 'Team C',
				SecondTeamText: 'Team D',
				Division: { DivisionId: 1, Name: 'Test Division', ColorHex: '#FF0000' },
				HasOutcome: false
			}
		];

		const conflicts = detectConflicts(matches);

		expect(conflicts.size).toBe(0);
	});
});

describe('applyFilters', () => {
	const matches: Match[] = [
		{
			MatchId: 1,
			FirstTeamId: 100,
			SecondTeamId: 200,
			FirstTeamText: 'Team A',
			SecondTeamText: 'Team B',
			ScheduledStartDateTime: Date.now(),
			ScheduledEndDateTime: Date.now() + 3600000,
			Division: { DivisionId: 1, Name: 'Division 1', ColorHex: '#FF0000' },
			HasOutcome: false
		},
		{
			MatchId: 2,
			FirstTeamId: 300,
			SecondTeamId: 400,
			FirstTeamText: 'Team C',
			SecondTeamText: 'Team D',
			ScheduledStartDateTime: Date.now(),
			ScheduledEndDateTime: Date.now() + 3600000,
			Division: { DivisionId: 2, Name: 'Division 2', ColorHex: '#00FF00' },
			HasOutcome: false
		}
	];

	it('should filter by division ID', () => {
		const filtered = applyFilters(matches, {
			divisionIds: [1],
			teamIds: []
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0].Division.DivisionId).toBe(1);
	});

	it('should filter by team ID', () => {
		const filtered = applyFilters(matches, {
			divisionIds: [],
			teamIds: [100]
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0].MatchId).toBe(1);
	});

	it('should filter by both division and team', () => {
		const filtered = applyFilters(matches, {
			divisionIds: [1],
			teamIds: [100]
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0].MatchId).toBe(1);
	});

	it('should return all matches when no filters applied', () => {
		const filtered = applyFilters(matches, {
			divisionIds: [],
			teamIds: []
		});

		expect(filtered).toHaveLength(2);
	});
});
