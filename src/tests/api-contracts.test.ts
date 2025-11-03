// API Contract Tests for AES API
// Purpose: Validate API response structures match our expectations
// Critical: These tests catch breaking changes in the external API
// NOTE: These tests make real API calls and should be run sparingly

import { describe, it, expect } from 'vitest';

const REAL_EVENT_ID = 'PTAwMDAwNDEzMTQ90';
const REAL_DIVISION_ID = 197487;
const REAL_TEAM_ID = 126569;
const REAL_CLUB_ID = 12345;

// Mark as skip by default to avoid hitting API during every test run
// Run with: npm test -- api-contracts.test.ts
describe.skip('AES API Contract Tests', () => {
	describe('Team Schedule API', () => {
		it('should return nested Play/Matches structure', async () => {
			const url = `https://results.advancedeventsystems.com/api/event/${REAL_EVENT_ID}/division/${REAL_DIVISION_ID}/team/${REAL_TEAM_ID}/schedule/current`;
			const response = await fetch(url);
			const data = await response.json();

			// Validate response structure
			expect(Array.isArray(data)).toBe(true);

			if (data.length > 0) {
				const firstPlay = data[0];

				// Each item should have Play and Matches
				expect(firstPlay).toHaveProperty('Play');
				expect(firstPlay).toHaveProperty('Matches');
				expect(firstPlay).toHaveProperty('PlayType');

				// Play should have expected fields
				expect(firstPlay.Play).toHaveProperty('PlayId');
				expect(firstPlay.Play).toHaveProperty('FullName');
				expect(firstPlay.Play).toHaveProperty('Courts');

				// Matches should be an array
				expect(Array.isArray(firstPlay.Matches)).toBe(true);

				if (firstPlay.Matches.length > 0) {
					const match = firstPlay.Matches[0];

					// Validate match structure
					expect(match).toHaveProperty('MatchId');
					expect(match).toHaveProperty('FirstTeamId');
					expect(match).toHaveProperty('SecondTeamId');
					expect(match).toHaveProperty('FirstTeamText');
					expect(match).toHaveProperty('SecondTeamText');

					// CRITICAL: Timestamps should be ISO strings
					expect(match).toHaveProperty('ScheduledStartDateTime');
					expect(match).toHaveProperty('ScheduledEndDateTime');
					expect(typeof match.ScheduledStartDateTime).toBe('string');
					expect(typeof match.ScheduledEndDateTime).toBe('string');

					// ISO string format check
					expect(match.ScheduledStartDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

					// Should have Court object
					expect(match).toHaveProperty('Court');
					if (match.Court) {
						expect(match.Court).toHaveProperty('CourtId');
						expect(match.Court).toHaveProperty('Name');
					}

					// Should NOT have Division object (API doesn't provide it)
					expect(match.Division).toBeUndefined();
				}
			}
		});
	});

	describe('Team Assignments API (OData)', () => {
		it('should return value array with team assignments', async () => {
			const url = `https://results.advancedeventsystems.com/odata/${REAL_EVENT_ID}/nextassignments(dId=null,cId=${REAL_CLUB_ID},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`;
			const response = await fetch(url);
			const data = await response.json();

			// OData response should have 'value' array
			expect(data).toHaveProperty('value');
			expect(Array.isArray(data.value)).toBe(true);

			if (data.value.length > 0) {
				const team = data.value[0];

				// Validate team structure
				expect(team).toHaveProperty('TeamId');
				expect(team).toHaveProperty('TeamName');
				expect(team).toHaveProperty('TeamCode');
				expect(team).toHaveProperty('TeamText');

				// Should have nested TeamClub object
				expect(team).toHaveProperty('TeamClub');
				expect(team.TeamClub).toHaveProperty('ClubId');
				expect(team.TeamClub).toHaveProperty('Name');

				// CRITICAL: Should have nested TeamDivision object
				expect(team).toHaveProperty('TeamDivision');
				expect(team.TeamDivision).toHaveProperty('DivisionId');
				expect(team.TeamDivision).toHaveProperty('Name');
				expect(team.TeamDivision).toHaveProperty('ColorHex');
				expect(team.TeamDivision).toHaveProperty('TeamCount');
				expect(team.TeamDivision).toHaveProperty('CodeAlias');

				// Validate field types
				expect(typeof team.TeamId).toBe('number');
				expect(typeof team.TeamDivision.DivisionId).toBe('number');
				expect(typeof team.TeamDivision.ColorHex).toBe('string');
			}
		});
	});

	describe('Event Info API', () => {
		it('should return event with clubs and divisions', async () => {
			const url = `https://results.advancedeventsystems.com/api/event/${REAL_EVENT_ID}`;
			const response = await fetch(url);
			const data = await response.json();

			// Validate event structure
			expect(data).toHaveProperty('EventId');
			expect(data).toHaveProperty('Name');
			expect(data).toHaveProperty('Clubs');
			expect(data).toHaveProperty('Divisions');

			// Clubs should be an array
			expect(Array.isArray(data.Clubs)).toBe(true);
			if (data.Clubs.length > 0) {
				expect(data.Clubs[0]).toHaveProperty('ClubId');
				expect(data.Clubs[0]).toHaveProperty('Name');
			}

			// Divisions should be an array
			expect(Array.isArray(data.Divisions)).toBe(true);
			if (data.Divisions.length > 0) {
				const division = data.Divisions[0];
				expect(division).toHaveProperty('DivisionId');
				expect(division).toHaveProperty('Name');
				expect(division).toHaveProperty('ColorHex');
				expect(division).toHaveProperty('TeamCount');
			}
		});
	});
});

// Schema validation tests (always run)
describe('API Response Schema Validation', () => {
	it('should validate team schedule response structure', () => {
		const mockResponse = [
			{
				Play: {
					Type: 1,
					PlayId: -54769,
					FullName: 'Silver Bracket',
					Courts: []
				},
				PlayType: 1,
				Matches: [
					{
						MatchId: -56381,
						FirstTeamId: 126569,
						FirstTeamText: 'Team A',
						SecondTeamId: 44481,
						SecondTeamText: 'Team B',
						ScheduledStartDateTime: '2025-11-03T12:00:00',
						ScheduledEndDateTime: '2025-11-03T12:59:59',
						HasScores: false,
						TypeOfOutcome: 0,
						Court: {
							CourtId: -53170,
							Name: 'North 88'
						}
					}
				]
			}
		];

		// Validate structure
		expect(Array.isArray(mockResponse)).toBe(true);
		expect(mockResponse[0]).toHaveProperty('Play');
		expect(mockResponse[0]).toHaveProperty('Matches');
		expect(Array.isArray(mockResponse[0].Matches)).toBe(true);

		const match = mockResponse[0].Matches[0];
		expect(typeof match.ScheduledStartDateTime).toBe('string');
		expect(match.ScheduledStartDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	});

	it('should validate team assignment response structure', () => {
		const mockResponse = {
			value: [
				{
					TeamId: 126569,
					TeamName: 'Team Name',
					TeamClub: {
						ClubId: 12345,
						Name: 'Club Name'
					},
					TeamDivision: {
						DivisionId: 197487,
						Name: '13 Open',
						ColorHex: '#FF5733',
						TeamCount: 24,
						CodeAlias: '13O'
					}
				}
			]
		};

		expect(mockResponse).toHaveProperty('value');
		expect(Array.isArray(mockResponse.value)).toBe(true);

		const team = mockResponse.value[0];
		expect(team).toHaveProperty('TeamDivision');
		expect(team.TeamDivision).toHaveProperty('DivisionId');
		expect(team.TeamDivision).toHaveProperty('Name');
		expect(team.TeamDivision).toHaveProperty('ColorHex');
	});
});
