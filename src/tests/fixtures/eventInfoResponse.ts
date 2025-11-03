// Fixture: Event Info API Response
// Purpose: Mock response data matching actual AES Event Info endpoint

export const mockEventInfoResponse = {
	Key: 'PTAwMDAwNDEzMTQ90',
	EventId: 41314,
	Name: 'Thanksgiving Tournament 2025',
	StartDate: '2025-11-01T00:00:00',
	EndDate: '2025-11-05T00:00:00',
	Location: 'Chicago, IL',
	Clubs: [
		{
			ClubId: 12345,
			Name: '630 Volleyball Club'
		},
		{
			ClubId: 54321,
			Name: 'MVVC'
		},
		{
			ClubId: 99999,
			Name: 'Another Club'
		}
	],
	Divisions: [
		{
			IsFinished: false,
			DivisionId: 197487,
			Name: '13 Open',
			TeamCount: 24,
			CodeAlias: '13O',
			ColorHex: '#FF5733'
		},
		{
			IsFinished: false,
			DivisionId: 197488,
			Name: '14 Open',
			TeamCount: 32,
			CodeAlias: '14O',
			ColorHex: '#3366FF'
		},
		{
			IsFinished: true,
			DivisionId: 197489,
			Name: '15 Open',
			TeamCount: 16,
			CodeAlias: '15O',
			ColorHex: '#33FF57'
		}
	]
};
