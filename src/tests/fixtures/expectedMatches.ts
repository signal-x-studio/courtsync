// Fixture: Expected Match objects after transformation
// Purpose: Expected output after fetchTeamSchedule transforms the API response
// Note: Includes Division object, Unix timestamps, HasOutcome, and CourtName

import type { Match } from '$lib/types/aes';

export const mockDivision = {
	DivisionId: 197487,
	Name: '13 Open',
	ColorHex: '#FF5733'
};

export const expectedTransformedMatches: Match[] = [
	{
		FirstTeamId: 126569,
		FirstTeamName: '630 Volleyball 13-1',
		FirstTeamWon: false,
		FirstTeamText: '630 Volleyball 13-1 (GL)',
		SecondTeamId: 44481,
		SecondTeamName: 'MVVC B 13 National',
		SecondTeamWon: false,
		SecondTeamText: 'MVVC B 13 National (NC)',
		MatchFullName: 'Match 2',
		MatchShortName: 'M2',
		HasScores: false,
		ScheduledStartDateTime: new Date('2025-11-03T12:00:00').getTime(),
		ScheduledEndDateTime: new Date('2025-11-03T12:59:59').getTime(),
		Sets: [
			{
				FirstTeamScore: null,
				SecondTeamScore: null,
				ScoreText: '',
				IsDecidingSet: false
			}
		],
		WorkTeamId: null,
		WorkTeamText: 'Loser of R3SilvM5 (13O)',
		TypeOfOutcome: 0,
		FirstTeamWorkTeamCourtAssignmentFlag: 0,
		SecondTeamWorkTeamCourtAssignmentFlag: 0,
		MatchId: -56381,
		Court: {
			CourtId: -53170,
			Name: 'North 88',
			VideoLink: 'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53170'
		},
		Division: mockDivision,
		HasOutcome: false,
		CourtName: 'North 88'
	},
	{
		FirstTeamId: 126569,
		FirstTeamName: '630 Volleyball 13-1',
		FirstTeamWon: false,
		FirstTeamText: '630 Volleyball 13-1 (GL)',
		SecondTeamId: 44482,
		SecondTeamName: 'Another Team',
		SecondTeamWon: false,
		SecondTeamText: 'Another Team (NC)',
		MatchFullName: 'Match 3',
		MatchShortName: 'M3',
		HasScores: true,
		ScheduledStartDateTime: new Date('2025-11-03T14:00:00').getTime(),
		ScheduledEndDateTime: new Date('2025-11-03T14:59:59').getTime(),
		Sets: [
			{
				FirstTeamScore: 25,
				SecondTeamScore: 20,
				ScoreText: '25-20',
				IsDecidingSet: false
			}
		],
		WorkTeamId: 12345,
		WorkTeamText: 'Work Team Name',
		TypeOfOutcome: 1,
		FirstTeamWorkTeamCourtAssignmentFlag: 0,
		SecondTeamWorkTeamCourtAssignmentFlag: 0,
		MatchId: -56382,
		Court: {
			CourtId: -53169,
			Name: 'North 87',
			VideoLink: 'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53169'
		},
		Division: mockDivision,
		HasOutcome: true, // Because TypeOfOutcome > 0
		CourtName: 'North 87'
	},
	{
		FirstTeamId: 126569,
		FirstTeamName: '630 Volleyball 13-1',
		FirstTeamWon: false,
		FirstTeamText: '630 Volleyball 13-1 (GL)',
		SecondTeamId: 44483,
		SecondTeamName: 'Third Team',
		SecondTeamWon: false,
		SecondTeamText: 'Third Team (IL)',
		MatchFullName: 'Match 1',
		MatchShortName: 'M1',
		HasScores: false,
		ScheduledStartDateTime: new Date('2025-11-03T16:00:00').getTime(),
		ScheduledEndDateTime: new Date('2025-11-03T16:59:59').getTime(),
		Sets: [],
		WorkTeamId: null,
		WorkTeamText: null,
		TypeOfOutcome: 0,
		FirstTeamWorkTeamCourtAssignmentFlag: 0,
		SecondTeamWorkTeamCourtAssignmentFlag: 0,
		MatchId: -56383,
		Court: {
			CourtId: -53171,
			Name: 'South 1',
			VideoLink: 'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53171'
		},
		Division: mockDivision,
		HasOutcome: false,
		CourtName: 'South 1'
	}
];
