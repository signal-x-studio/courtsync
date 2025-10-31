export interface Division {
  DivisionId: number;
  Name: string;
  TeamCount: number;
  CodeAlias: string;
  ColorHex: string;
}

export interface Match {
  MatchId: number;
  Division: Division;
  ScoreKioskCode: string;
  ScheduledVideoLink: string;
  FirstTeamText: string;
  SecondTeamText: string;
  WorkTeamText: string;
  CompleteShortName: string;
  ScheduledStartDateTime: number;
  ScheduledEndDateTime: number;
  HasOutcome: boolean;
}

export interface CourtSchedule {
  CourtMatches: Match[];
  CourtId: number;
  Name: string;
  VideoLink: string;
}

export interface CourtScheduleResponse {
  EarliestStartTime: number;
  LatestEndTime: number;
  CourtSchedules: CourtSchedule[];
}

export interface FilteredMatch extends Match {
  CourtName: string;
  CourtId: number;
  InvolvedTeam: 'first' | 'second' | 'work';
}

export type MatchClaimStatus = 'available' | 'claimed' | 'locked';

export interface MatchClaim {
  matchId: number;
  claimedBy: string;
  claimedAt: number;
  expiresAt: number;
  eventId: string;
}

export interface MatchScore {
  matchId: number;
  eventId: string;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
  lastUpdated: number;
  lastUpdatedBy: string;
}

export interface SetScore {
  setNumber: number;
  team1Score: number;
  team2Score: number;
  completedAt: number;
}

export interface ScoreHistoryEntry {
  timestamp: number;
  updatedBy: string;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
}
