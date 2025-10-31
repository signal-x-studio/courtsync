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

