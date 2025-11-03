// Fixture: Team Schedule API Response
// Purpose: Mock response data matching actual AES Team Schedule API structure
// Note: This is the ACTUAL structure returned by the API (nested Play/Matches)

export const mockTeamScheduleResponse = [
	{
		Play: {
			Type: 1,
			PlayId: -54769,
			FullName: 'Silver Bracket',
			ShortName: 'Silv',
			CompleteShortName: 'R3Silv',
			CompleteFullName: 'Round 3 Silver Bracket',
			Order: 0,
			Courts: [
				{
					CourtId: -53169,
					Name: 'North 87',
					VideoLink:
						'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53169'
				},
				{
					CourtId: -53170,
					Name: 'North 88',
					VideoLink:
						'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53170'
				}
			]
		},
		PlayType: 1,
		Matches: [
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
				ScheduledStartDateTime: '2025-11-03T12:00:00',
				ScheduledEndDateTime: '2025-11-03T12:59:59',
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
					VideoLink:
						'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53170'
				}
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
				ScheduledStartDateTime: '2025-11-03T14:00:00',
				ScheduledEndDateTime: '2025-11-03T14:59:59',
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
					VideoLink:
						'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53169'
				}
			}
		]
	},
	{
		Play: {
			Type: 2,
			PlayId: -54770,
			FullName: 'Gold Bracket',
			ShortName: 'Gold',
			CompleteShortName: 'R3Gold',
			CompleteFullName: 'Round 3 Gold Bracket',
			Order: 1,
			Courts: []
		},
		PlayType: 2,
		Matches: [
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
				ScheduledStartDateTime: '2025-11-03T16:00:00',
				ScheduledEndDateTime: '2025-11-03T16:59:59',
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
					VideoLink:
						'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53171'
				}
			}
		]
	}
];

export const mockTeamScheduleResponseEmpty = [];

export const mockTeamScheduleResponseNoMatches = [
	{
		Play: {
			Type: 1,
			PlayId: -54769,
			FullName: 'Silver Bracket',
			ShortName: 'Silv',
			CompleteShortName: 'R3Silv',
			CompleteFullName: 'Round 3 Silver Bracket',
			Order: 0,
			Courts: []
		},
		PlayType: 1,
		Matches: []
	}
];
