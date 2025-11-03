# AES API Developer Guide (Unified)

**Purpose**: Comprehensive guide for integrating with Advanced Event Systems (AES) API in SvelteKit applications.

---

## Table of Contents

1. [Overview](#overview)
2. [CORS Handling Strategy](#cors-handling-strategy)
3. [API Endpoints](#api-endpoints)
4. [Implementation Patterns](#implementation-patterns)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Gap Analysis](#gap-analysis)

---

## Overview

### Base URLs

- **REST API**: `https://results.advancedeventsystems.com/api`
- **OData API**: `https://results.advancedeventsystems.com/odata`

### Event ID Format

Event IDs are **base64-encoded strings** (e.g., `PTAwMDAwNDEzMTQ90`)

### Date/Time Formats

**CRITICAL**: AES API uses **two different date/time formats**:

1. **Court Schedule Endpoints**: Unix timestamps in **milliseconds**
   ```typescript
   ScheduledStartDateTime: 1761987600000 // Milliseconds
   ```

2. **Team Schedule/Poolsheet Endpoints**: ISO 8601 strings
   ```typescript
   ScheduledStartDateTime: "2025-11-01T08:00:00"
   ```

### API Request Formats

- **API Date Parameter**: `YYYY-MM-DD` (e.g., `2025-11-01`)
- **Time Window**: Integer minutes (e.g., `300` = 5 hours, `1440` = 24 hours)

---

## CORS Handling Strategy

### Problem

Direct client-side requests to AES API are blocked by CORS:
```
Access-Control-Allow-Origin header is not present
```

### Solution: Two Approaches

#### Approach 1: SvelteKit Load Functions (RECOMMENDED)

**Pattern from Reference Implementation**:
- Use SvelteKit's `load` functions for server-side fetching
- Pass custom `fetch` function to API client
- No proxy routes needed for most endpoints

```typescript
// +page.ts or +page.server.ts
export const load = async ({ fetch, params }) => {
  const schedule = await fetchCourtSchedule(
    params.eventId,
    '2025-11-01',
    1440
  );
  return { schedule };
};

// API client accepts fetchFn parameter
export const fetchCourtSchedule = async (
  eventId: string,
  date: string,
  timeWindow: number,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<CourtScheduleResponse> => {
  const url = `${API_BASE_URL}/event/${eventId}/courts/${date}/${timeWindow}`;
  const response = await fetchFn(url);
  // ...
};
```

#### Approach 2: SvelteKit API Proxy Routes

**Pattern from Current Implementation**:
- Create `+server.ts` routes in `src/routes/api/aes/`
- All client-side requests go through proxy
- More network hops, but works from any context

```typescript
// src/routes/api/aes/schedule/[eventId]/+server.ts
export const GET: RequestHandler = async ({ params, url }) => {
  const date = url.searchParams.get('date');
  const timeWindow = url.searchParams.get('timeWindow');

  const aesUrl = `${API_BASE_URL}/event/${params.eventId}/courts/${date}/${timeWindow}`;
  const response = await fetch(aesUrl);

  if (!response.ok) {
    return json({ error: 'Failed to fetch schedule' }, { status: response.status });
  }

  return json(await response.json());
};

// Client code
const response = await fetch(`/api/aes/schedule/${eventId}?date=${date}&timeWindow=${timeWindow}`);
```

### Which Approach to Use?

| Aspect | Load Function | Proxy Routes |
|--------|---------------|--------------|
| **Performance** | ✅ Better (direct fetch) | ❌ Extra network hop |
| **Simplicity** | ✅ Simpler (no extra routes) | ❌ More files to maintain |
| **Flexibility** | ❌ Only in load functions | ✅ Works everywhere |
| **SSR/SSG** | ✅ Built-in support | ⚠️ Requires runtime |

**RECOMMENDATION**: Use **Load Functions** as primary approach, add **Proxy Routes** only when:
- Fetching data outside load functions
- Client-side mutations (rare with AES API)
- Specific endpoints that need custom processing (e.g., poolsheet)

---

## API Endpoints

### 1. Event Info

**Endpoint**: `GET /api/event/{eventId}`

**Purpose**: Get event metadata including clubs and divisions

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90"
```

**Response**:
```typescript
interface EventInfo {
  Key: string;                // Base64 event ID
  EventId: number;            // Numeric event ID
  Name: string;               // Event name
  StartDate: string;          // ISO date
  EndDate: string;            // ISO date
  Location: string;           // Venue
  IsOver: boolean;
  Clubs: Array<{
    ClubId: number;
    Name: string;
  }>;
  Divisions: Array<{
    IsFinished: boolean;
    DivisionId: number;
    Name: string;
    TeamCount: number;
    CodeAlias: string;
    ColorHex: string;          // Hex color (e.g., "#BFFF7F")
  }>;
}
```

**Implementation**:
```typescript
export const fetchEventInfo = async (
  eventId: string,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<EventInfo> => {
  const url = `${API_BASE_URL}/event/${eventId}`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch event info: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 2. Court Schedule

**Endpoint**: `GET /api/event/{eventId}/courts/{date}/{timeWindow}`

**Purpose**: Get all matches for all courts on a specific date

**Parameters**:
- `date`: `YYYY-MM-DD` format
- `timeWindow`: Minutes from start of day (e.g., `300` = 5 hours, `1440` = 24 hours)

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/courts/2025-11-02/300"
```

**Response**:
```typescript
interface CourtScheduleResponse {
  EarliestStartTime: number;      // Unix timestamp (milliseconds)
  LatestEndTime: number;           // Unix timestamp (milliseconds)
  CourtSchedules: Array<{
    CourtId: number;
    Name: string;
    VideoLink: string;
    CourtMatches: Array<{
      MatchId: number;
      Division: Division;
      ScoreKioskCode: string;
      ScheduledVideoLink: string;
      FirstTeamText: string;
      SecondTeamText: string;
      WorkTeamText: string;
      FirstTeamId?: number;          // May be missing
      SecondTeamId?: number;          // May be missing
      CompleteShortName: string;
      ScheduledStartDateTime: number; // Unix timestamp (milliseconds)
      ScheduledEndDateTime: number;   // Unix timestamp (milliseconds)
      HasOutcome: boolean;
    }>;
  }>;
}
```

**Implementation**:
```typescript
export const fetchCourtSchedule = async (
  eventId: string,
  date: string,
  timeWindow: number,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<CourtScheduleResponse> => {
  const url = `${API_BASE_URL}/event/${eventId}/courts/${date}/${timeWindow}`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch court schedule: ${response.statusText}`);
  }

  return response.json();
};
```

**Pro Tip**: Flatten matches for easier processing:
```typescript
// Flatten all matches from all courts
const allMatches = schedule.CourtSchedules.flatMap(court =>
  court.CourtMatches.map(match => ({
    ...match,
    CourtName: court.Name,
    CourtId: court.CourtId,
    VideoLink: court.VideoLink
  }))
);
```

---

### 3. Team Assignments (OData)

**Endpoint**: `GET /odata/{eventId}/nextassignments(dId={divisionId},cId={clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`

**Purpose**: Get teams by club (and optionally division) with next match info

**Parameters**:
- `dId`: Division ID (use `null` for all divisions)
- `cId`: Club ID
- `tIds`: Team IDs array (usually empty `[]`)

**Examples**:

**All teams in club**:
```bash
curl "https://results.advancedeventsystems.com/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=null,cId=27439,tIds=[])?$skip=0&$orderby=TeamName,TeamCode"
```

**Teams in specific division**:
```bash
curl "https://results.advancedeventsystems.com/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=195922,cId=24426,tIds=[])?$skip=0&$orderby=TeamName,TeamCode"
```

**Response**:
```typescript
interface NextAssignmentsResponse {
  "@odata.context": string;
  value: Array<{
    TeamId: number;
    TeamName: string;
    TeamCode: string;
    TeamText: string;
    OpponentTeamName?: string;
    OpponentTeamText?: string;
    OpponentTeamId?: number;
    SearchableTeamName: string;
    NextPendingReseed: boolean;
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
      ScheduledStartDateTime: string;  // ISO format
      ScheduledEndDateTime: string;    // ISO format
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
  }>;
}
```

**Implementation**:
```typescript
export const fetchTeamAssignments = async (
  eventId: string,
  clubId: number,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  const url = `${ODATA_BASE_URL}/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch team assignments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
};

export const fetchTeamsByClubAndDivision = async (
  eventId: string,
  clubId: number,
  divisionId: number,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  const url = `${ODATA_BASE_URL}/${eventId}/nextassignments(dId=${divisionId},cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch team assignments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
};
```

**IMPORTANT**: OData endpoint returns rich data including:
- Team-to-club mappings
- Team-to-division mappings
- Next scheduled match
- Work assignments (refereeing duties)

This is **THE BEST endpoint for getting team lists** - use this instead of extracting teams from matches!

---

### 4. Team Schedule

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/schedule/{type}`

**Purpose**: Get schedule for a specific team filtered by type

**Schedule Types**:
- `current`: Current/upcoming matches
- `work`: Work assignments (refereeing)
- `future`: Future matches
- `past`: Past matches

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/schedule/current"
```

**Response**:
```typescript
interface TeamScheduleResponse {
  Play: {
    Type: number;
    PlayId: number;
    FullName: string;
    ShortName: string;
    CompleteShortName: string;
    Courts: Array<{
      CourtId: number;
      Name: string;
      VideoLink: string;
    }>;
  };
  PlayType: number;
  Matches: Array<{
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
    Sets: Array<{
      FirstTeamScore: number | null;
      SecondTeamScore: number | null;
      ScoreText: string;
      IsDecidingSet: boolean;
    }>;
    Court: {
      CourtId: number;
      Name: string;
      VideoLink: string;
    };
    ScheduledStartDateTime: string;  // ISO format
    ScheduledEndDateTime: string;    // ISO format
  }>;
}
```

**Implementation**:
```typescript
export const fetchTeamSchedule = async (
  eventId: string,
  divisionId: number,
  teamId: number,
  scheduleType: 'current' | 'work' | 'future' | 'past',
  fetchFn: typeof fetch = globalThis.fetch
) => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/team/${teamId}/schedule/${scheduleType}`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch team schedule: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 5. Team Roster

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/roster`

**Purpose**: Get roster/player list for a team

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/roster"
```

**Response**:
```typescript
interface RosterMember {
  FullName: string;
  RoleOrJersey: string;  // "Assistant Coach" or jersey number "2"
}

type TeamRoster = RosterMember[];
```

**Implementation**:
```typescript
export const fetchTeamRoster = async (
  eventId: string,
  divisionId: number,
  teamId: number,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<RosterMember[]> => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/team/${teamId}/roster`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch team roster: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 6. Poolsheet / Standings

**Endpoint**: `GET /api/event/{eventId}/poolsheet/{playId}`

**Purpose**: Get pool standings and match results for a play (pool/bracket)

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/poolsheet/-54617"
```

**Note**: Play IDs can be negative (e.g., `-54617`)

**Response**:
```typescript
interface PoolsheetResponse {
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
      FinishRankText: string;  // "1st", "2nd", etc.
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
    Sets: Array<{
      FirstTeamScore: number;
      SecondTeamScore: number;
      ScoreText: string;      // "15-25"
      IsDecidingSet: boolean;
    }>;
    Court: {
      CourtId: number;
      Name: string;
      VideoLink: string;
    };
    ScheduledStartDateTime: string;  // ISO format
    ScheduledEndDateTime: string;    // ISO format
  }>;
}
```

**CORS Consideration**: This endpoint may need a proxy route in production:

```typescript
// src/routes/api/poolsheet/[eventId]/[playId]/+server.ts
export const GET: RequestHandler = async ({ params }) => {
  const { eventId, playId } = params;
  const url = `${API_BASE_URL}/event/${eventId}/poolsheet/${playId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return json({ error: 'Poolsheet not available' }, { status: 404 });
    }
    return json({ error: 'Failed to fetch poolsheet' }, { status: response.status });
  }

  return json(await response.json());
};

// Client code with 404 handling
export const fetchPoolSheet = async (
  eventId: string,
  playId: number
): Promise<PoolsheetResponse> => {
  const url = `/api/poolsheet/${eventId}/${playId}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error('Poolsheet not available');
      (error as any).is404 = true;
      throw error;
    }
    throw new Error(`Failed to fetch pool sheet: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    const error = new Error(data.error);
    (error as any).is404 = true;
    throw error;
  }

  return data;
};
```

---

### 7. Division Plays

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/plays`

**Purpose**: Get all plays (pools/brackets) for a division

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/plays"
```

**Implementation**:
```typescript
export const fetchDivisionPlays = async (
  eventId: string,
  divisionId: number,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/plays`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch division plays: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 8. Plays by Date

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/plays/{date}`

**Purpose**: Get plays scheduled for a specific date

**Date Format**: `YYYY-MM-DD`

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/plays/2025-11-02"
```

**Implementation**:
```typescript
export const fetchPlaysByDate = async (
  eventId: string,
  divisionId: number,
  date: string,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/plays/${date}`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch plays by date: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 9. Clubs by Division

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/clubs`

**Purpose**: Get all clubs participating in a division

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/clubs"
```

**Response**:
```typescript
interface Club {
  ClubId: number;
  Name: string;
}

type ClubsByDivision = Club[];
```

**Implementation**:
```typescript
export const fetchClubsByDivision = async (
  eventId: string,
  divisionId: number,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<Club[]> => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/clubs`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch clubs by division: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 10. Play Division

**Endpoint**: `GET /api/event/{eventId}/play/{playId}/division`

**Purpose**: Get division information for a specific play

**Example**:
```bash
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/play/-54617/division"
```

**Implementation**:
```typescript
export const fetchPlayDivision = async (
  eventId: string,
  playId: number,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  const url = `${API_BASE_URL}/event/${eventId}/play/${playId}/division`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch play division: ${response.statusText}`);
  }

  return response.json();
};
```

---

## Implementation Patterns

### API Client Structure

**Recommended Pattern** (from reference implementation):

```typescript
// src/lib/services/api.ts

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';
const ODATA_BASE_URL = 'https://results.advancedeventsystems.com/odata';

// Export individual functions
export const fetchEventInfo = async (
  eventId: string,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  // Implementation
};

export const fetchCourtSchedule = async (
  eventId: string,
  date: string,
  timeWindow: number,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  // Implementation
};

// ... more functions
```

**Why this pattern?**
- Functions accept `fetchFn` parameter for server-side usage
- Default to `globalThis.fetch` for client-side usage
- Works seamlessly with SvelteKit load functions
- Easier to test (inject mock fetch)

**Alternative Pattern** (class-based):

```typescript
// src/lib/api/aesClient.ts

class AESClient {
  async getEvent(eventId: string): Promise<EventInfo> {
    // Implementation
  }

  async getCourtSchedule(
    eventId: string,
    date: string,
    timeWindow: number
  ): Promise<CourtSchedule> {
    // Implementation
  }
}

export const aesClient = new AESClient();
```

**Trade-offs**:
- ✅ Cleaner import syntax: `aesClient.getEvent()`
- ❌ Harder to inject custom fetch for SSR
- ❌ Less flexible for testing

**RECOMMENDATION**: Use **function-based pattern** for better SvelteKit integration.

---

### Usage in SvelteKit Load Functions

**Server-side Load** (`+page.server.ts`):

```typescript
import type { PageServerLoad } from './$types';
import { fetchCourtSchedule } from '$lib/services/api';

export const load: PageServerLoad = async ({ fetch, params }) => {
  // fetch is automatically server-side here
  const schedule = await fetchCourtSchedule(
    params.eventId,
    '2025-11-01',
    1440,
    fetch  // Pass SvelteKit's fetch
  );

  return { schedule };
};
```

**Universal Load** (`+page.ts`):

```typescript
import type { PageLoad } from './$types';
import { fetchCourtSchedule } from '$lib/services/api';

export const load: PageLoad = async ({ fetch, params }) => {
  // Works both server-side and client-side
  const schedule = await fetchCourtSchedule(
    params.eventId,
    '2025-11-01',
    1440,
    fetch
  );

  return { schedule };
};
```

**Client-side (outside load functions)**:

```typescript
import { fetchCourtSchedule } from '$lib/services/api';

// Omit fetchFn parameter - uses globalThis.fetch
const schedule = await fetchCourtSchedule(
  eventId,
  date,
  timeWindow
);
```

---

### Common Data Processing Patterns

#### Flatten Court Schedule Matches

```typescript
const schedule = await fetchCourtSchedule(eventId, date, timeWindow);

// Flatten all matches from all courts
const allMatches = schedule.CourtSchedules.flatMap(court =>
  court.CourtMatches.map(match => ({
    ...match,
    CourtName: court.Name,
    CourtId: court.CourtId,
    VideoLink: court.VideoLink
  }))
);
```

#### Filter Matches by Team

```typescript
function filterMatchesByTeam(matches: Match[], teamId: number): Match[] {
  return matches.filter(
    match =>
      match.FirstTeamId === teamId ||
      match.SecondTeamId === teamId ||
      match.WorkTeamId === teamId
  );
}
```

#### Group Matches by Time Slot

```typescript
import { format } from 'date-fns';

function groupMatchesByTimeSlot(matches: Match[]): Map<string, Match[]> {
  const groups = new Map<string, Match[]>();

  for (const match of matches) {
    const date = new Date(match.ScheduledStartDateTime);
    const timeSlot = format(date, 'HH:mm');

    if (!groups.has(timeSlot)) {
      groups.set(timeSlot, []);
    }
    groups.get(timeSlot)!.push(match);
  }

  return groups;
}
```

#### Extract Unique Divisions

```typescript
function extractDivisions(matches: Match[]): Division[] {
  const divisionMap = new Map<number, Division>();

  for (const match of matches) {
    if (match.Division) {
      divisionMap.set(match.Division.DivisionId, match.Division);
    }
  }

  return Array.from(divisionMap.values()).sort((a, b) =>
    a.Name.localeCompare(b.Name)
  );
}
```

---

## Type Definitions

### Core Types

```typescript
// src/lib/types/aes.ts

export interface Division {
  DivisionId: number;
  Name: string;
  TeamCount?: number;
  CodeAlias?: string;
  ColorHex: string;  // Hex color (e.g., "#BFFF7F")
}

export interface Club {
  ClubId: number;
  Name: string;
}

export interface Court {
  CourtId: number;
  Name: string;
  VideoLink: string;
}

export interface Match {
  MatchId: number;
  Division: Division;
  ScoreKioskCode?: string;
  ScheduledVideoLink?: string;
  FirstTeamText: string;
  SecondTeamText: string;
  WorkTeamText?: string;
  FirstTeamId?: number;
  SecondTeamId?: number;
  WorkTeamId?: number;
  CompleteShortName?: string;
  ScheduledStartDateTime: number;  // Unix timestamp (milliseconds) OR string (ISO)
  ScheduledEndDateTime: number;    // Unix timestamp (milliseconds) OR string (ISO)
  HasOutcome: boolean;
  CourtName?: string;  // Added when flattening
  CourtId?: number;    // Added when flattening
}

export interface EventInfo {
  Key?: string;
  EventId: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  Location?: string;
  IsOver?: boolean;
  Clubs: Club[];
  Divisions?: Array<
    Division & {
      IsFinished: boolean;
      TeamCount: number;
    }
  >;
}

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
  TeamClub: Club;
  TeamDivision: Division & { TeamCount: number; CodeAlias: string };
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

export interface CourtSchedule {
  EarliestStartTime: number;
  LatestEndTime: number;
  CourtSchedules: Array<{
    CourtId: number;
    Name: string;
    VideoLink: string;
    CourtMatches: Match[];
  }>;
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
      Club: Club;
      Division: Division & { TeamCount: number; CodeAlias: string };
    }>;
    Courts: Court[];
    PlayId: number;
  };
  Matches: Array<
    Match & {
      FirstTeamId: number;
      SecondTeamId: number;
      HasScores: boolean;
      Sets: SetScore[];
      Court: Court;
    }
  >;
}
```

---

## Error Handling

### Standard Error Pattern

```typescript
export const fetchEventInfo = async (
  eventId: string,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<EventInfo> => {
  const url = `${API_BASE_URL}/event/${eventId}`;

  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch event info: ${response.statusText}`);
  }

  return response.json();
};
```

### HTML Error Detection

Some AES endpoints return HTML error pages instead of JSON:

```typescript
export const GET: RequestHandler = async ({ params }) => {
  const response = await fetch(aesUrl);
  const text = await response.text();

  // Check if response is HTML (error page)
  if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    return json(
      { error: 'Resource not found or invalid ID' },
      { status: 404 }
    );
  }

  try {
    const data = JSON.parse(text);
    return json(data);
  } catch (err) {
    return json(
      { error: 'Invalid response from AES API' },
      { status: 500 }
    );
  }
};
```

### 404 Handling for Poolsheet

Poolsheets may not exist for all plays:

```typescript
try {
  const poolsheet = await fetchPoolSheet(eventId, playId);
  // Display poolsheet
} catch (error: any) {
  if (error.is404) {
    // Show "Poolsheet not available yet" message
  } else {
    // Show generic error message
  }
}
```

### User-Friendly Error Messages

```typescript
async function loadSchedule() {
  loading = true;
  error = null;

  try {
    const schedule = await fetchCourtSchedule(eventId, date, timeWindow);
    // Process schedule
  } catch (err) {
    // Log technical error for debugging
    console.error('API Error:', err);

    // Show user-friendly message
    error = 'Unable to load schedule. Please check your event ID and try again.';
  } finally {
    loading = false;
  }
}
```

---

## Best Practices

### ✅ DO

1. **Use SvelteKit Load Functions** for data fetching when possible
2. **Pass fetch parameter** to API functions in load functions
3. **Handle errors gracefully** with try-catch and user-friendly messages
4. **Show loading states** during API calls
5. **Validate parameters** before making requests
6. **Use TypeScript types** from shared types file
7. **Cache API responses** when data doesn't change frequently
8. **Flatten nested structures** for easier processing
9. **Extract unique values** (divisions, teams) from match data
10. **Use OData endpoint** for getting team lists with metadata

### ❌ DON'T

1. **Don't make duplicate API calls** unnecessarily
2. **Don't expose internal errors** to users
3. **Don't block UI** during API calls (use loading states)
4. **Don't hardcode** event IDs, dates, or other parameters
5. **Don't ignore TypeScript errors** - they often catch real issues
6. **Don't assume Team IDs exist** - they may be missing in court schedule
7. **Don't mix date formats** - check which format each endpoint uses
8. **Don't create proxy routes** for every endpoint (use load functions first)
9. **Don't forget HTML error detection** when proxying endpoints
10. **Don't extract teams from matches** when OData endpoint is available

---

## Gap Analysis

### Current Implementation vs Reference

| Feature | Reference | Current | Gap |
|---------|-----------|---------|-----|
| **CORS Strategy** | Load functions | Proxy routes | ⚠️ Over-engineered |
| **Event Info** | ✅ Direct fetch | ✅ Proxied | ⚠️ Unnecessary proxy |
| **Court Schedule** | ✅ Direct fetch | ✅ Proxied | ⚠️ Unnecessary proxy |
| **Team Assignments** | ✅ With division filter | ✅ Club only | ⚠️ Missing division filter |
| **Team Schedule** | ✅ All types | ✅ All types | ✅ Good |
| **Team Roster** | ✅ Implemented | ✅ Implemented | ✅ Good |
| **Division Plays** | ✅ Implemented | ✅ Implemented | ✅ Good |
| **Poolsheet** | ✅ With 404 handling | ❌ No 404 handling | ❌ Missing |
| **Plays by Date** | ✅ Implemented | ❌ Missing | ❌ Missing |
| **Clubs by Division** | ✅ Implemented | ❌ Missing | ❌ Missing |
| **Play Division** | ✅ Implemented | ❌ Missing | ❌ Missing |
| **Division Playdays** | ✅ Implemented | ❌ Missing | ❌ Missing |
| **Flattening Matches** | ✅ Pattern shown | ✅ Implemented | ✅ Good |
| **fetchFn Parameter** | ✅ All functions | ❌ Class-based | ❌ Incompatible pattern |

### Recommended Changes

#### High Priority

1. **Refactor API Client**:
   - Change from class-based to function-based
   - Add `fetchFn` parameter to all functions
   - Remove unnecessary proxy routes
   - Use load functions instead

2. **Add Missing Endpoints**:
   - `fetchTeamsByClubAndDivision` (division filter for OData)
   - `fetchPlaysByDate` (plays for specific date)
   - `fetchClubsByDivision` (clubs in a division)
   - `fetchPlayDivision` (division info for a play)

3. **Improve Poolsheet Handling**:
   - Add 404 error detection
   - Add `is404` flag to error objects
   - Show "not available" vs "error" messages

#### Medium Priority

4. **Remove Proxy Routes**:
   - Delete `/api/aes/event/[eventId]/+server.ts`
   - Delete `/api/aes/schedule/[eventId]/+server.ts`
   - Delete `/api/aes/assignments/[eventId]/+server.ts`
   - Keep only poolsheet proxy (if needed)

5. **Update Page Load Functions**:
   - Use `+page.server.ts` or `+page.ts` with load functions
   - Pass `fetch` parameter to API calls
   - Remove direct client-side API calls from pages

#### Low Priority

6. **Add Helper Functions**:
   - `fetchPlaysForDateRange` (multiple dates in parallel)
   - `fetchClubsByEvent` (convenience wrapper)

### Migration Plan

**Step 1**: Create new function-based API client
```typescript
// src/lib/services/aes.ts (new file)
export const fetchEventInfo = async (
  eventId: string,
  fetchFn: typeof fetch = globalThis.fetch
) => {
  // Implementation
};
// ... all other functions
```

**Step 2**: Update pages to use load functions
```typescript
// src/routes/club/[eventId]/+page.server.ts (new file)
export const load = async ({ fetch, params }) => {
  const schedule = await fetchCourtSchedule(
    params.eventId,
    date,
    timeWindow,
    fetch
  );
  return { schedule };
};
```

**Step 3**: Remove old API client
```typescript
// Delete src/lib/api/aesClient.ts
```

**Step 4**: Remove proxy routes
```typescript
// Delete src/routes/api/aes/**/*
```

**Step 5**: Update all imports
```typescript
// Before
import { aesClient } from '$lib/api/aesClient';
const schedule = await aesClient.getCourtSchedule(eventId, date, timeWindow);

// After
import { fetchCourtSchedule } from '$lib/services/aes';
const schedule = await fetchCourtSchedule(eventId, date, timeWindow, fetch);
```

---

## Summary

### Key Takeaways

1. **Use Load Functions First**: SvelteKit's load functions with `fetch` parameter avoid most CORS issues
2. **OData is Your Friend**: Use `/odata/.../nextassignments` for team lists with full metadata
3. **Two Date Formats**: Court schedule uses Unix timestamps, other endpoints use ISO strings
4. **Team IDs May Be Missing**: In court schedule matches, FirstTeamId/SecondTeamId are optional
5. **Poolsheet Needs Special Handling**: May return 404 when not available yet
6. **Flatten Early**: Convert nested CourtSchedules to flat match array for easier processing
7. **Function > Class**: Function-based API client is more flexible for SSR/SSG

### Quick Reference

```typescript
// Essential endpoints
fetchEventInfo(eventId, fetch)
fetchCourtSchedule(eventId, date, timeWindow, fetch)
fetchTeamAssignments(eventId, clubId, fetch)
fetchTeamSchedule(eventId, divisionId, teamId, type, fetch)
fetchPoolSheet(eventId, playId) // Via proxy route

// Date format for API calls
const date = format(new Date(), 'yyyy-MM-dd'); // "2025-11-01"

// Common time windows
300    // 5 hours
1440   // 24 hours (full day)

// Extract teams from OData
const teams = (await fetchTeamAssignments(eventId, clubId, fetch)).value;

// Flatten matches
const allMatches = schedule.CourtSchedules.flatMap(court =>
  court.CourtMatches.map(match => ({ ...match, CourtName: court.Name }))
);
```

---

## Appendix: Testing Endpoints

Use these curl commands to test endpoints with real data:

```bash
# Event info
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90"

# Court schedule
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/courts/2025-11-02/300"

# Team assignments (all teams in club)
curl "https://results.advancedeventsystems.com/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=null,cId=27439,tIds=[])?$skip=0&$orderby=TeamName,TeamCode"

# Team assignments (filtered by division)
curl "https://results.advancedeventsystems.com/odata/PTAwMDAwNDEzMTQ90/nextassignments(dId=195922,cId=24426,tIds=[])?$skip=0&$orderby=TeamName,TeamCode"

# Team roster
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/roster"

# Team schedule (current)
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/team/126569/schedule/current"

# Poolsheet
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/poolsheet/-54617"

# Division plays
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/plays"

# Plays by date
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/plays/2025-11-02"

# Clubs by division
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/division/197487/clubs"

# Play division
curl "https://results.advancedeventsystems.com/api/event/PTAwMDAwNDEzMTQ90/play/-54617/division"
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Tested With**: Event `PTAwMDAwNDEzMTQ90` (2025 AAU/JVA Chi-Town Boys Challenge)
