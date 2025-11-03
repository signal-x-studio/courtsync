// Fixture: Team Assignment API Response (OData)
// Purpose: Mock response data matching actual AES OData nextassignments endpoint

export const mockTeamAssignmentsResponse = {
	value: [
		{
			TeamId: 126569,
			TeamName: '630 Volleyball 13-1',
			TeamCode: '630V13-1',
			TeamText: '630 Volleyball 13-1 (GL)',
			OpponentTeamName: 'MVVC B 13 National',
			OpponentTeamText: 'MVVC B 13 National (NC)',
			OpponentTeamId: 44481,
			SearchableTeamName: '630 Volleyball 13-1',
			NextPendingReseed: false,
			NextWorkMatchDate: '2025-11-03T10:00:00',
			TeamClub: {
				ClubId: 12345,
				Name: '630 Volleyball Club'
			},
			TeamDivision: {
				DivisionId: 197487,
				Name: '13 Open',
				TeamCount: 24,
				CodeAlias: '13O',
				ColorHex: '#FF5733'
			},
			OpponentClub: {
				ClubId: 54321,
				Name: 'MVVC'
			},
			NextMatch: {
				MatchId: -56381,
				ScheduledStartDateTime: '2025-11-03T12:00:00',
				ScheduledEndDateTime: '2025-11-03T12:59:59',
				Court: {
					CourtId: -53170,
					Name: 'North 88',
					VideoLink:
						'https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53170'
				}
			},
			WorkMatchs: [
				{
					MatchId: -56380,
					ScheduledStartDateTime: '2025-11-03T10:00:00',
					ScheduledEndDateTime: '2025-11-03T10:59:59',
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
			TeamId: 126570,
			TeamName: '630 Volleyball 14-1',
			TeamCode: '630V14-1',
			TeamText: '630 Volleyball 14-1 (GL)',
			OpponentTeamName: null,
			OpponentTeamText: null,
			OpponentTeamId: null,
			SearchableTeamName: '630 Volleyball 14-1',
			NextPendingReseed: false,
			NextWorkMatchDate: null,
			TeamClub: {
				ClubId: 12345,
				Name: '630 Volleyball Club'
			},
			TeamDivision: {
				DivisionId: 197488,
				Name: '14 Open',
				TeamCount: 32,
				CodeAlias: '14O',
				ColorHex: '#3366FF'
			},
			OpponentClub: null,
			NextMatch: null,
			WorkMatchs: []
		}
	]
};

export const mockTeamAssignmentsResponseEmpty = {
	value: []
};
