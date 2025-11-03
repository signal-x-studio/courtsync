// Reference: docs/product-requirements.md
// Purpose: Type definitions for Advanced Event Systems (AES) API responses
// Note: These types match the actual AES API structure for volleyball tournaments

export interface Division {
	DivisionId: number;
	Name: string;
	ColorHex: string;
}

export interface Match {
	MatchId: number;
	Division: Division;
	FirstTeamText: string;
	SecondTeamText: string;
	WorkTeamText?: string;
	FirstTeamId?: number;
	SecondTeamId?: number;
	WorkTeamId?: number;
	ScheduledStartDateTime: number;
	ScheduledEndDateTime: number;
	HasOutcome: boolean;
	CourtName?: string;
}

export interface TeamAssignment {
	TeamId: number;
	TeamName: string;
	TeamCode: string;
	ClubId: number;
	ClubName: string;
	DivisionId: number;
	DivisionName: string;
}

export interface EventInfo {
	EventId: string;
	EventName: string;
	VenueName: string;
	Name: string;
	StartDate: number;
	EndDate: number;
	Clubs: Array<{ ClubId: number; Name: string }>;
}

export interface CourtSchedule {
	EarliestStartTime: number;
	LatestEndTime: number;
	Matches: Match[];
	TeamAssignments: TeamAssignment[];
	CourtSchedules: Array<{
		CourtId: number;
		Name: string;
		VideoLink: string;
		CourtMatches: Match[];
	}>;
}

export interface TeamSchedule {
	Current: Match[];
	Work: Match[];
	Future: Match[];
	Past: Match[];
}

export interface PoolStandings {
	PoolId: number;
	PoolName: string;
	Teams: Array<{
		TeamId: number;
		TeamName: string;
		Wins: number;
		Losses: number;
		PointsFor: number;
		PointsAgainst: number;
	}>;
}
