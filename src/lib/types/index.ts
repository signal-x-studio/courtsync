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

export interface PoolsheetMatchResult {
  matchId: number;
  hasScores: boolean;
  sets: SetScore[];
  winner: 'first' | 'second' | null; // null if match not completed
  finalScore: string | null; // e.g., "2-1" or "25-20, 25-18, 23-25"
}

export interface FilteredMatch extends Match {
  CourtName: string;
  CourtId: number;
  InvolvedTeam: 'first' | 'second' | 'work';
  BallerTVLink?: string; // BallerTV stream URL for this match
  PoolsheetResult?: PoolsheetMatchResult; // Match results from poolsheet (for completed matches)
  BallerTVActualStartTime?: number; // Actual start time from BallerTV (timestamp in ms)
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
  source?: 'ballertv' | 'manual'; // Track score source
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

export interface ClaimHistoryEntry {
  matchId: number;
  eventId: string;
  action: 'claimed' | 'released' | 'transferred';
  userId: string;
  timestamp: number;
  transferredTo?: string; // Only present for 'transferred' action
}

// BallerTV Integration Types
export interface BallerTVMatchScore {
  matchId: number;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
  lastUpdated: number;
  source: 'ballertv' | 'manual';
}

// Poolsheet API Response Types
export interface PoolsheetCourt {
  CourtId: number;
  Name: string;
  VideoLink: string; // BallerTV link
}

export interface PoolsheetMatch {
  MatchId: number;
  FirstTeamId: number;
  FirstTeamName: string;
  FirstTeamText: string;
  SecondTeamId: number;
  SecondTeamName: string;
  SecondTeamText: string;
  HasScores: boolean;
  Sets: Array<{
    FirstTeamScore: number | null;
    SecondTeamScore: number | null;
    ScoreText: string;
    IsDecidingSet: boolean;
  }>;
  Court: PoolsheetCourt;
  ScheduledStartDateTime: string; // ISO string
  ScheduledEndDateTime: string; // ISO string
}

export interface PoolsheetResponse {
  Pool: {
    Teams: Array<{
      TeamId: number;
      TeamName: string;
      TeamText: string;
      // ... other team fields
    }>;
    Courts: PoolsheetCourt[];
    PlayId: number;
  };
  Matches: PoolsheetMatch[];
}
