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
	CourtId?: number;
}

// Simple team info (flattened from TeamAssignment for UI use)
export interface SimpleTeam {
	TeamId: number;
	TeamName: string;
	TeamCode: string;
	ClubId: number;
	ClubName: string;
	DivisionId: number;
	DivisionName: string;
}

// Full OData team assignment response
export interface TeamAssignment {
	TeamId: number;
	TeamName: string;
	TeamCode: string;
	TeamText: string;
	OpponentTeamName?: string;
	OpponentTeamText?: string;
	OpponentTeamId?: number;
	SearchableTeamName?: string;
	NextPendingReseed?: boolean;
	NextWorkMatchDate?: string;
	TeamClub: {
		ClubId: number;
		Name: string;
	};
	TeamDivision: {
		DivisionId: number;
		Name: string;
		TeamCount: number;
		CodeAlias: string;
		ColorHex: string;
	};
	OpponentClub?: {
		ClubId: number;
		Name: string;
	};
	NextMatch?: {
		MatchId: number;
		ScheduledStartDateTime: string;
		ScheduledEndDateTime: string;
		Court: {
			CourtId: number;
			Name: string;
			VideoLink: string;
		};
	};
	WorkMatchs?: Array<{
		MatchId: number;
		ScheduledStartDateTime: string;
		ScheduledEndDateTime: string;
		Court: {
			CourtId: number;
			Name: string;
			VideoLink: string;
		};
	}>;
}

export interface EventInfo {
	Key?: string; // The encoded event ID
	EventId: number; // Numeric event ID
	Name: string; // Event name
	StartDate: string; // ISO date string
	EndDate: string; // ISO date string
	Location?: string; // Venue location
	Clubs: Array<{ ClubId: number; Name: string }>;
	Divisions?: Array<{
		IsFinished: boolean;
		DivisionId: number;
		Name: string;
		TeamCount: number;
		CodeAlias: string;
		ColorHex: string;
	}>;
}

export interface CourtSchedule {
	EarliestStartTime: number;
	LatestEndTime: number;
	// Flattened for convenience
	Matches: Match[];
	// Original nested structure
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

export interface PoolTeam {
	TeamId: number;
	TeamName: string;
	TeamCode: string;
	TeamText: string;
	MatchesWon: number;
	MatchesLost: number;
	MatchPercent: number;
	SetsWon: number;
	SetsLost: number;
	SetPercent: number;
	PointRatio: number;
	FinishRank: number;
	FinishRankText: string;
	Club: {
		ClubId: number;
		Name: string;
	};
	Division: Division;
}

export interface PoolSheet {
	Pool: {
		Teams: PoolTeam[];
	};
}

export interface Play {
	Type: number; // 0 = Pool, 1 = Bracket
	PlayId: number;
	FullName: string;
	ShortName: string;
	CompleteShortName: string;
}

export interface SetScore {
	FirstTeamScore: number | null;
	SecondTeamScore: number | null;
	ScoreText: string;
	IsDecidingSet: boolean;
}

export interface PoolsheetResponse {
	Pool: {
		Teams: Array<{
			TeamId: number;
			TeamName: string;
			TeamCode: string;
			TeamText: string;
			MatchesWon: number;
			MatchesLost: number;
			MatchPercent: number;
			SetsWon: number;
			SetsLost: number;
			SetPercent: number;
			PointRatio: number;
			FinishRank: number;
			FinishRankText: string;
			Club: {
				ClubId: number;
				Name: string;
			};
			Division: {
				DivisionId: number;
				Name: string;
				TeamCount: number;
				CodeAlias: string;
				ColorHex: string;
			};
		}>;
		Courts: Array<{
			CourtId: number;
			Name: string;
			VideoLink: string;
		}>;
		PlayId: number;
	};
	Matches: Array<{
		MatchId: number;
		FirstTeamId: number;
		FirstTeamName: string;
		FirstTeamText: string;
		SecondTeamId: number;
		SecondTeamName: string;
		SecondTeamText: string;
		HasScores: boolean;
		Sets: SetScore[];
		Court: {
			CourtId: number;
			Name: string;
			VideoLink: string;
		};
		ScheduledStartDateTime: string;
		ScheduledEndDateTime: string;
	}>;
}
