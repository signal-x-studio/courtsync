# AES (Advanced Event Systems) API Reference

**Base URL**: `https://results.advancedeventsystems.com`

**Event ID Format**: Base64-encoded string (e.g., `PTAwMDAwNDEzMTQ90`)

---

## Table of Contents

1. [Event Endpoints](#event-endpoints)
2. [Team Endpoints](#team-endpoints)
3. [Division Endpoints](#division-endpoints)
4. [Court & Schedule Endpoints](#court--schedule-endpoints)
5. [OData Endpoints](#odata-endpoints)
6. [Data Structures](#data-structures)

---

## Event Endpoints

### Get Event Info

```
GET /api/event/{eventId}
```

**Response:**
```json
{
  "Key": "PTAwMDAwNDEzMTQ90",
  "EventId": 41314,
  "Name": "2025 AAU/JVA Chi-Town Boys Challenge",
  "StartDate": "2025-11-01T00:00:00",
  "EndDate": "2025-11-03T23:59:59.9999999",
  "Location": "West Halls F1/F2, Skyline Ballroom W375, North Hall C1/C2",
  "IsOver": false,
  "Clubs": [
    {
      "ClubId": 24426,
      "Name": "630 Volleyball"
    }
  ],
  "Divisions": [
    {
      "IsFinished": false,
      "DivisionId": 197485,
      "Name": "12 Boys",
      "TeamCount": 11,
      "CodeAlias": "12 Boys",
      "ColorHex": "#BFFF7F"
    }
  ]
}
```

---

## Team Endpoints

### Get Team Roster

```
GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/roster
```

**Example**: `/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/roster`

**Response:**
```json
[
  {
    "FullName": "Kealy, Patrick",
    "RoleOrJersey": "Assistant Coach"
  },
  {
    "FullName": "Brown Jr, Brian",
    "RoleOrJersey": "2"
  }
]
```

### Get Team Schedule

```
GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/schedule/{type}
```

**Schedule Types**: `current`, `work`, `future`, `past`

**Response:**
```json
[
  {
    "Play": {
      "Type": 1,
      "PlayId": -54769,
      "FullName": "Silver Bracket",
      "ShortName": "Silv",
      "CompleteShortName": "R3Silv",
      "Courts": [
        {
          "CourtId": -53169,
          "Name": "North 87",
          "VideoLink": "https://www.ballertv.com/streams?..."
        }
      ]
    },
    "PlayType": 1,
    "Matches": [
      {
        "MatchId": -56381,
        "FirstTeamId": 126569,
        "FirstTeamName": "630 Volleyball 13-1",
        "FirstTeamText": "630 Volleyball 13-1 (GL)",
        "FirstTeamWon": false,
        "SecondTeamId": 44481,
        "SecondTeamName": "MVVC B 13 National",
        "SecondTeamText": "MVVC B 13 National (NC)",
        "SecondTeamWon": false,
        "WorkTeamId": null,
        "WorkTeamText": "Loser of R3SilvM5 (13O)",
        "HasScores": false,
        "Sets": [
          {
            "FirstTeamScore": null,
            "SecondTeamScore": null,
            "ScoreText": "",
            "IsDecidingSet": false
          }
        ],
        "Court": {
          "CourtId": -53170,
          "Name": "North 88",
          "VideoLink": "https://www.ballertv.com/streams?..."
        },
        "ScheduledStartDateTime": "2025-11-03T12:00:00",
        "ScheduledEndDateTime": "2025-11-03T12:59:59"
      }
    ]
  }
]
```

### Get Team Info

```
GET /api/event/{eventId}/teams/{teamId}
```

**Response**: Team details including club and division info.

---

## Division Endpoints

### Get Division Plays

```
GET /api/event/{eventId}/division/{divisionId}/plays
```

**Response**: Array of plays (pools, brackets) for the division.

### Get Division Plays by Date

```
GET /api/event/{eventId}/division/{divisionId}/plays/{date}
```

**Date Format**: `YYYY-MM-DD` (e.g., `2025-11-02`)

**Response**: Plays scheduled for specific date.

### Get Clubs by Division

```
GET /api/event/{eventId}/division/{divisionId}/clubs
```

**Response:**
```json
[
  {
    "ClubId": 69,
    "Name": "Bay to Bay Volleyball Club"
  },
  {
    "ClubId": 4691,
    "Name": "Blue Steel VBC"
  }
]
```

### Get Play Division

```
GET /api/event/{eventId}/play/{playId}/division
```

**Response**: Division information for a specific play/pool.

---

## Court & Schedule Endpoints

### Get Court Schedule

```
GET /api/event/{eventId}/courts/{date}/{timeWindow}
```

**Parameters**:
- `date`: `YYYY-MM-DD`
- `timeWindow`: Minutes (e.g., `300` = 5 hours, `1440` = 24 hours)

**Example**: `/api/event/PTAwMDAwNDEzMTQ90/courts/2025-11-02/300`

**Response:**
```json
{
  "EarliestStartTime": 1761987600000,
  "LatestEndTime": 1762034400000,
  "CourtSchedules": [
    {
      "CourtMatches": [
        {
          "MatchId": -50497,
          "Division": {
            "DivisionId": 195922,
            "Name": "18 Open",
            "TeamCount": 68,
            "CodeAlias": "18O",
            "ColorHex": "#FF5FBF"
          },
          "ScoreKioskCode": "50497",
          "ScheduledVideoLink": "https://www.ballertv.com/streams?...",
          "FirstTeamText": "630 Volleyball 18-1 (GL)",
          "SecondTeamText": "Academy 18E Blue (HO)",
          "WorkTeamText": "The St. James Boys 18 N (CH)",
          "CompleteShortName": "R1MM1",
          "ScheduledStartDateTime": 1761987600000,
          "ScheduledEndDateTime": 1761991199999,
          "HasOutcome": true
        }
      ],
      "CourtId": -53134,
      "Name": "West 43",
      "VideoLink": "https://www.ballertv.com/streams?..."
    }
  ]
}
```

---

## Poolsheet Endpoints

### Get Poolsheet

```
GET /api/event/{eventId}/poolsheet/{playId}
```

**Example**: `/api/event/PTAwMDAwNDEzMTQ90/poolsheet/-54617`

**Response:**
```json
{
  "Pool": {
    "Teams": [
      {
        "TeamId": 44482,
        "TeamName": "MVVC B 13 Black",
        "TeamCode": "b13mouvi2nc",
        "TeamText": "MVVC B 13 Black (NC)",
        "MatchesWon": 5,
        "MatchesLost": 0,
        "MatchPercent": 1.0,
        "SetsWon": 10,
        "SetsLost": 0,
        "SetPercent": 1.0,
        "PointRatio": 2.17,
        "FinishRank": 1,
        "FinishRankText": "1st",
        "Club": {
          "ClubId": 2627,
          "Name": "Mountain View Volleyball Club"
        },
        "Division": {
          "DivisionId": 197487,
          "Name": "13 Classic",
          "TeamCount": 12,
          "CodeAlias": "13C",
          "ColorHex": "#7FDF5F"
        }
      }
    ],
    "Courts": [
      {
        "CourtId": -53148,
        "Name": "Ballroom 66",
        "VideoLink": "https://www.ballertv.com/streams?..."
      }
    ],
    "PlayId": -54617
  },
  "Matches": [
    {
      "MatchId": -50595,
      "FirstTeamId": 126569,
      "FirstTeamName": "630 Volleyball 13-1",
      "FirstTeamText": "630 Volleyball 13-1 (GL)",
      "SecondTeamId": 44482,
      "SecondTeamName": "MVVC B 13 Black",
      "SecondTeamText": "MVVC B 13 Black (NC)",
      "HasScores": true,
      "Sets": [
        {
          "FirstTeamScore": 15,
          "SecondTeamScore": 25,
          "ScoreText": "15-25",
          "IsDecidingSet": false
        },
        {
          "FirstTeamScore": 21,
          "SecondTeamScore": 25,
          "ScoreText": "21-25",
          "IsDecidingSet": false
        }
      ],
      "Court": {
        "CourtId": -53148,
        "Name": "Ballroom 66",
        "VideoLink": "https://www.ballertv.com/streams?..."
      },
      "ScheduledStartDateTime": "2025-11-01T08:00:00",
      "ScheduledEndDateTime": "2025-11-01T08:59:59"
    }
  ]
}
```

---

## OData Endpoints

### Get Team Assignments (Next Assignments)

**Get teams by club:**
```
GET /odata/{eventId}/nextassignments(dId=null,cId={clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode
```

**Example**: `/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=null,cId=27439,tIds=[])?$skip=0&$orderby=TeamName,TeamCode`

**Get teams by club AND division:**
```
GET /odata/{eventId}/nextassignments(dId={divisionId},cId={clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode
```

**Example**: `/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=195922,cId=24426,tIds=[])?$skip=0&$orderby=TeamName,TeamCode`

**Response:**
```json
{
  "@odata.context": "http://results.advancedeventsystems.com/odata/PTAwMDAwNDEzMTQ90/$metadata#NextAssignmentViewModel",
  "value": [
    {
      "TeamId": 219219,
      "TeamName": "Vegas Volley 17-2",
      "TeamCode": "b17a1veg2sc",
      "TeamText": "Vegas Volley 17-2 (SC)",
      "OpponentTeamName": "Ultimate B17 Silver",
      "OpponentTeamText": "Ultimate B17 Silver (GL)",
      "OpponentTeamId": 98082,
      "SearchableTeamName": "vegas volley 17-2",
      "NextPendingReseed": false,
      "NextWorkMatchDate": "11/03/2025 11:00:00",
      "TeamClub": {
        "ClubId": 27439,
        "Name": "A1 Vegas Volley"
      },
      "TeamDivision": {
        "DivisionId": 195924,
        "Name": "17 Classic",
        "TeamCount": 28,
        "CodeAlias": "17C",
        "ColorHex": "#DF7F5F"
      },
      "OpponentClub": {
        "ClubId": 260,
        "Name": "Ultimate VBC-Chicago"
      },
      "NextMatch": {
        "MatchId": -53080,
        "ScheduledStartDateTime": "2025-11-03T10:00:00",
        "ScheduledEndDateTime": "2025-11-03T10:59:59",
        "Court": {
          "CourtId": -53148,
          "Name": "Ballroom 66",
          "VideoLink": "https://www.ballertv.com/streams?..."
        }
      },
      "WorkMatchs": [
        {
          "MatchId": -53081,
          "ScheduledStartDateTime": "2025-11-03T11:00:00",
          "ScheduledEndDateTime": "2025-11-03T11:59:59",
          "Court": {
            "CourtId": -53148,
            "Name": "Ballroom 66",
            "VideoLink": "https://www.ballertv.com/streams?..."
          }
        }
      ]
    }
  ]
}
```

---

## Data Structures

### Division

```typescript
{
  DivisionId: number;
  Name: string;
  TeamCount: number;
  CodeAlias: string;
  ColorHex: string;
  IsFinished?: boolean;
}
```

### Club

```typescript
{
  ClubId: number;
  Name: string;
}
```

### Court

```typescript
{
  CourtId: number;
  Name: string;
  VideoLink: string;
}
```

### Match (from Court Schedule)

```typescript
{
  MatchId: number;
  Division: Division;
  ScoreKioskCode: string;
  ScheduledVideoLink: string;
  FirstTeamText: string;
  SecondTeamText: string;
  WorkTeamText?: string;
  FirstTeamId?: number;      // May be missing
  SecondTeamId?: number;      // May be missing
  CompleteShortName: string;
  ScheduledStartDateTime: number; // Unix timestamp in milliseconds
  ScheduledEndDateTime: number;   // Unix timestamp in milliseconds
  HasOutcome: boolean;
}
```

### Match (from Team Schedule / Poolsheet)

```typescript
{
  MatchId: number;
  FirstTeamId: number;
  FirstTeamName: string;
  FirstTeamText: string;
  FirstTeamWon: boolean;
  SecondTeamId: number;
  SecondTeamName: string;
  SecondTeamText: string;
  SecondTeamWon: boolean;
  WorkTeamId?: number | null;
  WorkTeamText?: string;
  HasScores: boolean;
  Sets: SetScore[];
  Court: Court;
  ScheduledStartDateTime: string; // ISO 8601 format
  ScheduledEndDateTime: string;   // ISO 8601 format
}
```

### SetScore

```typescript
{
  FirstTeamScore: number | null;
  SecondTeamScore: number | null;
  ScoreText: string;
  IsDecidingSet: boolean;
}
```

### TeamAssignment (from OData)

```typescript
{
  TeamId: number;
  TeamName: string;
  TeamCode: string;
  TeamText: string;
  TeamClub: Club;
  TeamDivision: Division;
  OpponentTeamName?: string;
  OpponentTeamText?: string;
  OpponentTeamId?: number;
  OpponentClub?: Club;
  NextMatch?: {
    MatchId: number;
    ScheduledStartDateTime: string;
    ScheduledEndDateTime: string;
    Court: Court;
  };
  WorkMatchs?: Array<{
    MatchId: number;
    ScheduledStartDateTime: string;
    ScheduledEndDateTime: string;
    Court: Court;
  }>;
}
```

---

## Important Notes

1. **Date/Time Formats**:
   - Court schedule uses Unix timestamps (milliseconds)
   - Team schedule uses ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss`)

2. **Team IDs**:
   - May be missing in court schedule matches (FirstTeamId, SecondTeamId)
   - Always present in team schedule and poolsheet matches

3. **Match IDs**:
   - Often negative numbers (e.g., `-50497`)
   - This is normal for AES system

4. **Play IDs**:
   - Also often negative (e.g., `-54617`)
   - Used to identify pools and brackets

5. **OData Endpoint**:
   - Returns comprehensive team information
   - Includes next match and work assignments
   - Most reliable source for team-to-club-to-division mappings

6. **CORS**:
   - Direct client-side requests will fail due to CORS
   - Must proxy through server-side API routes in SvelteKit

---

## Recommended Implementation Strategy

1. **Event Selection**: Use `/api/event/{eventId}` to get clubs list
2. **Team List**: Use OData `/nextassignments` to get teams by club
3. **Match Schedule**: Use `/api/event/{eventId}/courts/{date}/{timeWindow}` for all matches
4. **Team Details**: Use `/api/event/{eventId}/division/{divisionId}/team/{teamId}/schedule/{type}` for specific team
5. **Poolsheet Standings**: Use `/api/event/{eventId}/poolsheet/{playId}` for pool results
