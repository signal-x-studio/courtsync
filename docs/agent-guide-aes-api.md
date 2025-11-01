# Advanced Event Systems (AES) API Guide for Agents

This guide documents the Advanced Event Systems API endpoints used in this application and how to properly integrate with them.

## API Overview

The application integrates with **Advanced Event Systems (AES)** API to fetch volleyball tournament data including schedules, teams, divisions, and matches.

### Base URLs

- **REST API**: `https://results.advancedeventsystems.com/api`
- **OData API**: `https://results.advancedeventsystems.com/odata`

## API Client Location

The API client is located at:
- `src/lib/services/api.ts` (primary)
- `src/services/api.ts` (duplicate - should be consolidated)

**⚠️ Important**: Always use `src/lib/services/api.ts` for consistency.

## API Endpoints

### 1. Fetch Court Schedule

**Endpoint**: `GET /api/event/{eventId}/courts/{date}/{timeWindow}`

**Purpose**: Fetch all matches scheduled for all courts on a specific date within a time window.

**Function**: `fetchCourtSchedule()`

```typescript
export const fetchCourtSchedule = async (
  eventId: string,
  date: string,        // Format: "YYYY-MM-DD"
  timeWindow: number   // Minutes from start of day
): Promise<CourtScheduleResponse>
```

**Example Usage**:
```typescript
import { fetchCourtSchedule } from '$lib/services/api';

const schedule = await fetchCourtSchedule(
  'PTAwMDAwNDEzMTQ90',
  '2025-11-01',
  300  // 5 hours = 300 minutes
);
```

**Response Type**: `CourtScheduleResponse`

```typescript
interface CourtScheduleResponse {
  EarliestStartTime: number;      // Unix timestamp (milliseconds)
  LatestEndTime: number;           // Unix timestamp (milliseconds)
  CourtSchedules: CourtSchedule[];
}

interface CourtSchedule {
  CourtMatches: Match[];
  CourtId: number;
  Name: string;
  VideoLink: string;
}

interface Match {
  MatchId: number;
  Division: Division;
  ScoreKioskCode: string;
  ScheduledVideoLink: string;
  FirstTeamText: string;
  SecondTeamText: string;
  WorkTeamText: string;
  CompleteShortName: string;
  ScheduledStartDateTime: number;  // Unix timestamp (milliseconds)
  ScheduledEndDateTime: number;    // Unix timestamp (milliseconds)
  HasOutcome: boolean;
}

interface Division {
  DivisionId: number;
  Name: string;
  TeamCount: number;
  CodeAlias: string;
  ColorHex: string;  // Hex color code (e.g., "#FF5733")
}
```

### 2. Fetch Event Info

**Endpoint**: `GET /api/event/{eventId}`

**Purpose**: Fetch general information about an event.

**Function**: `fetchEventInfo()`

```typescript
export const fetchEventInfo = async (
  eventId: string
): Promise<EventInfo>
```

**Example Usage**:
```typescript
import { fetchEventInfo } from '$lib/services/api';

const eventInfo = await fetchEventInfo('PTAwMDAwNDEzMTQ90');
```

### 3. Fetch Team Assignments (OData)

**Endpoint**: `GET /odata/{eventId}/nextassignments(dId=null,cId={clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`

**Purpose**: Fetch work assignments (refereeing) for teams in a club.

**Function**: `fetchTeamAssignments()`

```typescript
export const fetchTeamAssignments = async (
  eventId: string,
  clubId: number      // Club ID number
): Promise<TeamAssignment[]>
```

**Example Usage**:
```typescript
import { fetchTeamAssignments } from '$lib/services/api';

const assignments = await fetchTeamAssignments('PTAwMDAwNDEzMTQ90', 12345);
```

**Note**: This endpoint uses OData query syntax with `$skip` and `$orderby` parameters.

### 4. Fetch Team Schedule

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/schedule/{scheduleType}`

**Purpose**: Fetch schedule for a specific team filtered by schedule type.

**Function**: `fetchTeamSchedule()`

```typescript
export const fetchTeamSchedule = async (
  eventId: string,
  divisionId: number,
  teamId: number,
  scheduleType: 'current' | 'work' | 'future'
): Promise<TeamSchedule>
```

**Schedule Types**:
- `'current'`: Current/upcoming matches
- `'work'`: Work assignments (refereeing)
- `'future'`: Future matches

**Example Usage**:
```typescript
import { fetchTeamSchedule } from '$lib/services/api';

const schedule = await fetchTeamSchedule(
  'PTAwMDAwNDEzMTQ90',
  100,
  500,
  'current'
);
```

### 5. Fetch Team Roster

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/roster`

**Purpose**: Fetch roster/player list for a specific team.

**Function**: `fetchTeamRoster()`

```typescript
export const fetchTeamRoster = async (
  eventId: string,
  divisionId: number,
  teamId: number
): Promise<TeamRoster>
```

**Example Usage**:
```typescript
import { fetchTeamRoster } from '$lib/services/api';

const roster = await fetchTeamRoster('PTAwMDAwNDEzMTQ90', 100, 500);
```

### 6. Fetch Division Plays

**Endpoint**: `GET /api/event/{eventId}/division/{divisionId}/plays`

**Purpose**: Fetch all play schedules (pools/brackets) for a division.

**Function**: `fetchDivisionPlays()`

```typescript
export const fetchDivisionPlays = async (
  eventId: string,
  divisionId: number
): Promise<DivisionPlay[]>
```

**Example Usage**:
```typescript
import { fetchDivisionPlays } from '$lib/services/api';

const plays = await fetchDivisionPlays('PTAwMDAwNDEzMTQ90', 100);
```

### 7. Fetch Pool Sheet

**Endpoint**: `GET /api/event/{eventId}/poolsheet/{playId}`

**Purpose**: Fetch detailed pool sheet/bracket information for a specific play.

**Function**: `fetchPoolSheet()`

```typescript
export const fetchPoolSheet = async (
  eventId: string,
  playId: number
): Promise<PoolSheet>
```

**Example Usage**:
```typescript
import { fetchPoolSheet } from '$lib/services/api';

const poolSheet = await fetchPoolSheet('PTAwMDAwNDEzMTQ90', 42);
```

## Error Handling

All API functions follow a consistent error handling pattern:

```typescript
const response = await fetch(url);

if (!response.ok) {
  throw new Error(`Failed to fetch: ${response.statusText}`);
}

return response.json();
```

**Best Practice**: Always wrap API calls in try-catch blocks:

```typescript
try {
  const schedule = await fetchCourtSchedule(eventId, date, timeWindow);
  // Handle success
} catch (error) {
  console.error('Failed to fetch schedule:', error);
  // Handle error - show user-friendly message
  notifications.error('Failed to load schedule. Please try again.');
}
```

## Date Format

- **API Date Format**: `YYYY-MM-DD` (e.g., `"2025-11-01"`)
- **Timestamp Format**: Unix milliseconds (JavaScript `Date.getTime()`)

**Conversion Example**:
```typescript
import { format } from 'date-fns';

// Convert Date to API format
const apiDate = format(new Date(), 'yyyy-MM-dd');

// Convert API timestamp to Date
const date = new Date(match.ScheduledStartDateTime);
```

## Common Patterns

### Loading States

```typescript
let loading = false;
let error: string | null = null;

async function loadSchedule() {
  loading = true;
  error = null;
  
  try {
    const schedule = await fetchCourtSchedule(eventId, date, timeWindow);
    // Process schedule
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading = false;
  }
}
```

### Filtering Matches

The application filters matches for specific teams/clubs. Common filter patterns:

```typescript
// Filter by team name containing "630 Volleyball"
const filtered = matches.filter(match => 
  match.FirstTeamText.includes('630 Volleyball') ||
  match.SecondTeamText.includes('630 Volleyball') ||
  match.WorkTeamText.includes('630 Volleyball')
);

// Filter by division
const divisionMatches = matches.filter(match => 
  match.Division.Name === 'Division Name'
);

// Filter by time range
const timeFiltered = matches.filter(match => {
  const start = new Date(match.ScheduledStartDateTime);
  return start >= startTime && start <= endTime;
});
```

### Processing Match Data

```typescript
// Create FilteredMatch from Match
const filteredMatches: FilteredMatch[] = matches.flatMap(match => {
  const result: FilteredMatch[] = [];
  
  // Check if first team matches
  if (match.FirstTeamText.includes('630 Volleyball')) {
    result.push({
      ...match,
      CourtName: courtSchedule.Name,
      CourtId: courtSchedule.CourtId,
      InvolvedTeam: 'first'
    });
  }
  
  // Check if second team matches
  if (match.SecondTeamText.includes('630 Volleyball')) {
    result.push({
      ...match,
      CourtName: courtSchedule.Name,
      CourtId: courtSchedule.CourtId,
      InvolvedTeam: 'second'
    });
  }
  
  // Check if work team matches
  if (match.WorkTeamText.includes('630 Volleyball')) {
    result.push({
      ...match,
      CourtName: courtSchedule.Name,
      CourtId: courtSchedule.CourtId,
      InvolvedTeam: 'work'
    });
  }
  
  return result;
});
```

## Type Definitions

All types are defined in `src/lib/types/index.ts`:

```typescript
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
```

## Default Values

Common default values used in the application:

- **Event ID**: `PTAwMDAwNDEzMTQ90`
- **Date**: `2025-11-01` (or current date)
- **Time Window**: `300` (5 hours in minutes)

## Rate Limiting & Caching

**Current Implementation**: No explicit rate limiting or caching implemented.

**Recommendations for Agents**:
- Consider implementing request caching for frequently accessed data
- Add debouncing for user-initiated requests
- Handle rate limit errors gracefully

## Testing API Calls

When testing API calls:

1. **Use Real Event IDs**: Default event ID `PTAwMDAwNDEzMTQ90` should work for testing
2. **Handle Network Errors**: Test with network disabled
3. **Handle Invalid Data**: Test with invalid event IDs or dates
4. **Check Timestamps**: Verify timestamp conversion is correct

## Best Practices

### ✅ DO

- Always use TypeScript types from `$lib/types`
- Handle errors with try-catch blocks
- Show loading states during API calls
- Display user-friendly error messages
- Use async/await for API calls
- Validate parameters before making requests

### ❌ DON'T

- Don't make API calls without error handling
- Don't expose internal error messages to users
- Don't block UI during API calls (use loading states)
- Don't make duplicate API calls unnecessarily
- Don't hardcode event IDs or dates (use parameters)

## Example: Complete API Integration

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchCourtSchedule } from '$lib/services/api';
  import type { CourtScheduleResponse } from '$lib/types';
  
  let eventId = 'PTAwMDAwNDEzMTQ90';
  let date = '2025-11-01';
  let timeWindow = 300;
  let loading = false;
  let error: string | null = null;
  let schedule: CourtScheduleResponse | null = null;
  
  async function loadSchedule() {
    if (!eventId || !date) return;
    
    loading = true;
    error = null;
    
    try {
      schedule = await fetchCourtSchedule(eventId, date, timeWindow);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load schedule';
      console.error('API Error:', err);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    loadSchedule();
  });
</script>

{#if loading}
  <div>Loading schedule...</div>
{:else if error}
  <div class="error">{error}</div>
{:else if schedule}
  <!-- Display schedule -->
{/if}
```

## Summary

- **Base URL**: `https://results.advancedeventsystems.com/api`
- **OData URL**: `https://results.advancedeventsystems.com/odata`
- **Date Format**: `YYYY-MM-DD`
- **Timestamps**: Unix milliseconds
- **Error Handling**: Always use try-catch
- **Types**: Import from `$lib/types`
- **Functions**: Import from `$lib/services/api`
