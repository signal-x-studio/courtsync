# CourtSync - Product Requirements Document

## Executive Summary

**Application Purpose**: A volleyball tournament scheduling and coverage optimization web application that helps photographers and spectators track matches for specific volleyball clubs using data from Advanced Event Systems (AES) API.

**Core Value Proposition**:
- Filter tournament schedules by club/team
- Display filtered matches in a user-friendly interface
- Support media photographers with coverage planning and conflict detection
- Support spectators with live scoring - safe, deterministic real-time score entry that all spectators can view from anywhere on the web

**Project Scope**: This is a greenfield project. The requirements below specify what needs to be built and any external constraints. Implementation decisions (architecture, frameworks, libraries) are left to the development team, with the goal of building a lean, maintainable application.

---

## 1. Original Functional Intent

### Primary Use Cases

1. **Event/Club Selection**
   - User enters Event ID (default: `PTAwMDAwNDEzMTQ90`)
   - Application loads clubs participating in the event
   - User selects a club
   - Application loads and filters matches for a specific club
   - User can navigate to event page to select different club

2. **Match Viewing**
   - **List View**: Chronological list of filtered matches with key details
   - Matches filtered by club using IDs when available, text matching as fallback

3. **Media Photographer Workflow**
   - Select matches for photography coverage plan
   - View conflicts (overlapping matches that can't both be covered)
   - See coverage statistics (how many matches per team are selected)
   - Persist tracking of teams that have had coverage at some point during the event

4. **Spectator/Scorekeeper Workflow**
   - Favorite one or more teams to easily filter and track their team's matches
   - View team schedules and pool standings
   - **Live Scoring** (Primary Requirement):
     - Lock matches for scorekeeping (match claiming is a sub-component of scorekeeping)
     - Perform safe, deterministic live score entry during matches
     - Real-time score updates visible to all spectators from anywhere on the web
     - View live scores and match results
---

## 2. Functional Requirements

### Required Features

1. **Event and Club Selection**
   - User must be able to enter an Event ID
   - Application must load and display clubs participating in the event
   - User must be able to select a club
   - Application must filter and display matches for the selected club

2. **Match Display**
   - Display filtered matches in chronological order
   - Show essential match information: teams, scheduled time, court, division
   - Indicate conflicts (overlapping matches)
   - Provide persona-specific actions based on user role

3. **Match Details**
   - Display comprehensive information about a specific match
   - Show teams, date, time, court, division
   - Display match status (upcoming, in-progress, completed)
   - Provide persona-specific actions (coverage selection, match locking, team favoriting)

4. **Live Scoring System** (Primary Spectator Requirement)
   - Allow scorekeepers to lock a match (prevent multiple simultaneous scorekeepers)
   - Provide interface for entering volleyball match scores (set-by-set scoring)
   - Support best-of-3 or best-of-5 set formats
   - Real-time synchronization of scores across all clients
   - Display live scores to all spectators (read-only for non-scorekeepers)
   - Maintain score history/audit trail

5. **Team Information**
   - Display team schedules (past and future matches) filtered by TeamId
   - Show pool standings (when available from API)
   - Display work assignments (refereeing assignments)
   - Filter matches by specific team using TeamId when available

6. **Media Coverage Planning**
   - Allow selection of matches for photography coverage
   - Display conflict indicators for overlapping matches
   - Show coverage statistics (matches per team)
   - Persist coverage plan data
   - Track teams that have received coverage

7. **Navigation and Mobile Support**
   - Provide navigation appropriate for mobile and desktop
   - Support persona-specific navigation (e.g., coverage plan view for media)
   - Provide filters and settings access

### State Management Requirements

The application must manage the following state:
- Match data and loading states (keyed by MatchId)
- Event information and club list (keyed by EventId, ClubId)
- Selected matches for coverage (media persona) - store by MatchId
- Favorite/followed teams (spectator persona) - store by TeamId when available
- Current user role/persona
- Active filters (division by DivisionId, team by TeamId when available)
- Match lock status and ownership (for live scoring) - keyed by MatchId
- Live score data with synchronization - keyed by MatchId

### Core Functionality Requirements

1. **Conflict Detection**: Automatically identify when matches overlap in time
2. **Data Filtering**: Filter matches by club using ID-based matching (with text matching fallback when IDs unavailable)
3. **Responsive Design**: Must work effectively on mobile devices and desktop browsers
4. **Touch-Friendly Interface**: Interactive elements must be appropriately sized for mobile touch input
5. **Real-Time Synchronization**: Live scores must update across all connected clients in real-time
6. **Persistent Data**: User preferences and selections must persist across sessions

---

## 3. User Personas & Workflows

### Persona 1: Media/Photographer

**Primary Needs**:
- See all matches for assigned club
- Select matches for coverage plan
- Identify conflicts (overlapping matches)
- See coverage statistics

**Key Features**:
- Coverage plan (select matches)
- Conflict indicators
- Coverage statistics

**UI Elements**:
- Match selection checkbox/toggle
- Coverage plan panel
- Conflict warnings
- Statistics display

### Persona 2: Spectator/Scorekeeper

**Primary Needs**:
- Favorite/follow specific teams (by TeamId when available)
- View team schedules filtered by TeamId
- **Perform live scoring** (PRIMARY REQUIREMENT)
- View real-time scores from any spectator's scorekeeping
- Track team progress

**Key Features**:
- **Live Scoring System** (Primary):
  - Match claiming (sub-component of scorekeeping) to prevent conflicts
  - Safe, deterministic score entry interface
  - Real-time score synchronization
  - Visible to all spectators globally via web
- Team following
- "My Teams" view
- Team detail pages
- Live score display (read-only for non-scorekeepers)

**UI Elements**:
- Star/Favorite team selection icon
- My Teams tab
- Team detail view
- Claim Match button (scorekeeper interface entry)
- Live Scorekeeper interface (set-by-set scoring)
- Live Score display (for all spectators)

---

## 4. User Experience & Information Architecture

### Navigation Requirements

**Persistent Navigation**: The application must provide persistent navigation that allows users to quickly switch between main views. On mobile devices, bottom navigation is recommended for thumb accessibility. On desktop, navigation may be adapted to sidebars or top navigation bars.

**Primary Navigation Items**:
1. **All Matches** - Links to the main club match view (default view)
2. **My Teams** - Links to spectator's favorited teams view
3. **Coverage** - Links to media persona's coverage plan view (visible only when in media persona)
4. **Filters** - Opens filter selection interface

**Navigation State**: The navigation should clearly indicate which section is currently active. When filters are applied, the Filters item should show an active/active indicator.

### Page/View Structure Requirements

#### 1. Event/Club Selection (Entry Point)

**User Goal**: Load tournament data and select a club to track.

**Required Elements**:
- Event ID input field with validation
- Load event button/action
- Display of event information once loaded
- Scrollable list of participating clubs
- Club search/filter capability
- Each club must be selectable and navigate to main application

**Data Requirements**: 
- Fetch event info from `/api/event/{eventId}` to display event name and dates
- Fetch clubs from event data (via Team Assignments API or event info)

#### 2. Club Match Hub (Main Dashboard - "All Matches")

**User Goal**: View complete scannable schedule for all teams in selected club and take quick actions.

**Required Display Elements**:

1. **Context Header**:
   - Display selected event name
   - Display selected club name
   - Event date range (if multi-day event)

2. **Date Navigation** (for multi-day events):
   - Tabs or selectors for each day of tournament
   - Allow switching between days
   - Current day should be clearly indicated

3. **"Live Now" Section** (Critical UX Pattern):
   - Non-collapsible section at top of match list
   - Displays all matches currently in progress for selected club
   - Must be visible without scrolling when matches are live
   - Shows match status, live scores, and quick actions

4. **Chronological Match List with Time Grouping**:
   - Group matches by scheduled time (e.g., "8:00 AM (5 matches)")
   - Time blocks should be collapsible/expandable (accordion pattern)
   - Allows users to scan schedule efficiently
   - Expand to show all matches in that time slot

5. **Match Card/Item** (Core Component):
   - Display essential information: time, court, teams, division
   - Show work team if applicable
   - Display live score when available
   - Show match status badge ("Upcoming", "Live", "Final")
   - Persona-specific indicators:
     - Media: Coverage selection indicator (checkbox/toggle)
     - Media: Visual indicator for teams already in coverage plan
     - Spectator: Favorite team indicators (star icons)

**Required Interactions**:
- Time block accordion: Toggle expand/collapse
- Match card: Click to open match detail/live scoring view
- Team name: Click to open team schedule view
- Persona-specific actions on match card

**Data Requirements**:
- Filter matches by selected club using ID-based matching
- Group by scheduled time
- Identify live matches (current time between start and end time)
- Calculate match counts per time block

#### 3. Team Schedule View (Drill-Down)

**User Goal**: View all schedule, pool, and roster information for one specific team.

**Required Elements**:
- Team name header
- Sub-navigation tabs: "Schedule", "Pool Standings", "Roster"
- Schedule view with time periods: Current, Work Assignments, Future, Past
- Pool standings table/grid (when available from poolsheet API)
- Roster list with player information

**Required Interactions**:
- Match item: Click to open match detail view
- Pool name: Click to open pool detail (if available)

**Data Requirements**:
- Fetch team schedule using `/api/event/{eventId}/division/{divisionId}/team/{teamId}/schedule/{scheduleType}`
- Use TeamId for all data fetching
- Fetch pool standings from poolsheet API when available
- Fetch roster from `/api/event/{eventId}/division/{divisionId}/team/{teamId}/roster`

#### 4. Match Detail & Live Scoring View

**User Goal**: View live score of a match OR actively score the match.

**Required Elements**:
- Match header (teams, time, court, division)
- Match status and information
- Live scoreboard (read-only for non-scorekeepers)
- Scorekeeper interface (conditional - only shown when match is locked by current user)

**Required Interactions**:
- "Lock Match for Scoring" button (spectator persona)
- Score entry controls (+/- buttons for each team)
- "Release Lock" button
- Real-time score updates visible to all viewers

**Data Requirements**:
- Use MatchId for all score operations
- Real-time synchronization of score data
- Match locking prevents concurrent scorekeepers

#### 5. My Teams View (Spectator Hub)

**User Goal**: View consolidated schedule for favorited teams only.

**Required Elements**:
- "My Teams" header
- Favorite team list (display teams user has favorited)
- Consolidated match list using same UI patterns:
   - "Live Now" component (for favorited teams' matches)
   - Collapsible time blocks (for favorited teams' matches)
   - Match cards with same functionality

**Required Interactions**:
- "Edit Favorites" button (opens team selection interface)
- All match cards and team links function identically to Club Match Hub

**Data Requirements**:
- Filter matches by favorited TeamIds
- Store favorites as array of TeamIds in persistence
- Apply same filtering logic as Club Match Hub but only for favorited teams

#### 6. Coverage Plan View (Media Hub)

**User Goal**: Review selected coverage plan, identify conflicts, and see coverage gaps.

**Required Elements**:

1. **Coverage Statistics**:
   - Total matches in plan
   - Number of conflicts
   - **Teams Covered** (interactive): Display as "Teams Covered: X / Y"
   - Tapping teams covered statistic opens detailed breakdown:
     - List of teams that ARE in coverage plan
     - List of teams that are NOT in coverage plan (coverage gaps)

2. **Conflict List** (Prioritized Display):
   - Show only matches with time conflicts
   - Clearly indicate which matches conflict with each other
   - Prioritize conflicts at top of view

3. **Full Coverage List**:
   - Display all selected matches using collapsible time blocks
   - Same UI patterns as Club Match Hub for consistency
   - Visual indication of which teams are already covered

**Required Interactions**:
- "Remove from Plan" button on each match card
- Teams Covered statistic: Interactive, opens detailed team breakdown
- All match cards and team links function identically to Club Match Hub

**Data Requirements**:
- Store selected matches as array of MatchIds
- Calculate conflicts by comparing match time ranges
- Calculate team coverage statistics using TeamIds from matches
- Persist coverage plan using MatchIds

#### 7. Filters View

**User Goal**: Temporarily narrow down the "All Matches" view by specific criteria.

**Required Elements**:
- "Filters" header
- List of all divisions for selected club (with checkboxes/toggles)
- List of all teams for selected club (with checkboxes/toggles)
- **Coverage Gap Filter** (Media persona only):
   - "Show only teams NOT in my coverage plan" option
   - This is the most powerful tool for identifying coverage gaps
   - Instantly hides all teams already covered

**Required Interactions**:
- Checkboxes/toggles for divisions (multi-select)
- Checkboxes/toggles for teams (multi-select)
- "Apply Filters" button:
   - Applies filters to Club Match Hub
   - Closes filter view
   - Shows active indicator on Filters navigation item
- "Clear Filters" button: Resets all filter selections

**Data Requirements**:
- Filter by DivisionIds (when available)
- Filter by TeamIds (when available)
- Coverage gap filter: Exclude matches for teams already in coverage plan

### Coverage Tracking Requirements

The application must provide three complementary methods for tracking team coverage (media persona):

1. **Interactive Statistics**:
   - On Coverage Plan view, "Teams Covered: X / Y" must be interactive
   - Tapping reveals detailed breakdown of covered vs. uncovered teams
   - This provides explicit feedback on coverage gaps

2. **Visual Indicators**:
   - On Club Match Hub, when in media persona, show visual icon (checkmark/camera) next to team names that are already in coverage plan
   - Provides at-a-glance feedback while scanning matches
   - Helps prevent duplicate coverage selections

3. **Dedicated Filter**:
   - In Filters view, provide "Show only teams NOT in my coverage plan" filter
   - Most powerful tool - instantly hides already-covered teams
   - Allows focus on coverage gaps only

**Implementation Note**: All three methods should use TeamIds for accurate tracking, not text matching.

### UX Patterns That Worked Well

The following UX patterns have proven effective and should be considered:

1. **"Live Now" Section at Top**: Non-collapsible, always visible section for in-progress matches provides immediate context
2. **Collapsible Time Blocks**: Accordion pattern for grouping matches by time improves scanability of long schedules
3. **Persistent Bottom Navigation**: Mobile-first navigation pattern provides quick access to main views
4. **Visual Coverage Indicators**: At-a-glance feedback on match cards reduces cognitive load
5. **Interactive Statistics**: Tap-to-reveal detail pattern provides progressive disclosure of information

### UX Patterns to Avoid

The following patterns have caused issues and should be avoided or improved:

1. **Excessive Modal Nesting**: Avoid deep modal hierarchies (modal within modal)
2. **Hidden Primary Actions**: Primary actions (like "Lock Match") should not be buried in sub-menus
3. **Context Loss**: Ensure users can return to previous context easily (breadcrumbs or clear back navigation)
4. **Over-Collapsing**: Don't hide critical information behind too many levels of collapse/accordion

---

## 5. Visual Design Requirements

**Design Approach**: The application should use a dark theme with high contrast for readability. Previous attempts used a charcoal and gold color scheme as reference, but the development team may choose the visual design that best serves the functional requirements.

**Color Requirements**:
- Dark background for reduced eye strain in tournament environments
- High contrast text for readability
- Clear visual distinction between selected/unselected states
- Clear indication of conflicts or warnings
- Semantic color usage for status indicators (success, warning, error)

**Typography Requirements**:
- Readable font sizes (minimum 12px for body text, larger for headings)
- System fonts preferred for performance
- Clear hierarchy between headings, body text, and labels

### Responsive Design Requirements

- **Mobile Support**: Application must be fully functional on mobile devices (phones and tablets)
- **Desktop Support**: Application must be fully functional on desktop browsers
- **Touch Targets**: Interactive elements on mobile must be large enough for reliable touch input (minimum 44x44px recommended)
- **Responsive Layout**: Layout should adapt appropriately to screen size

### Accessibility Requirements

- **Color Contrast**: Text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- **Keyboard Navigation**: All interactive elements must be accessible via keyboard
- **Screen Reader Support**: Semantic HTML and ARIA labels where appropriate
- **Focus Indicators**: Clear visual indication of focused elements

### Note on Design Implementation

The development team should choose appropriate styling approach and design system. If implementing with CSS framework, consider modern utility-first approaches. Previous attempts used Tailwind CSS, but this is not a requirement.

---

## 6. API Integration Requirements

### Advanced Event Systems (AES) API

**Base URLs**:
- REST API: `https://results.advancedeventsystems.com/api`
- OData API: `https://results.advancedeventsystems.com/odata`

### Required Endpoints

1. **Fetch Court Schedule**
   ```
   GET /api/event/{eventId}/courts/{date}/{timeWindow}
   ```
   - Returns all matches across all courts for a date/time window
   - Date format: `YYYY-MM-DD`
   - Time window: minutes from start of day

2. **Fetch Event Info**
   ```
   GET /api/event/{eventId}
   ```
   - Returns event name, dates, clubs

3. **Fetch Team Schedule**
   ```
   GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/schedule/{scheduleType}
   ```
   - `scheduleType`: `'current' | 'work' | 'future' | 'past'`

4. **Fetch Team Assignments**
   ```
   GET /odata/{eventId}/nextassignments(dId=null,cId={clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode
   ```
   - Returns teams for a club

5. **Fetch Division Plays**
   ```
   GET /api/event/{eventId}/division/{divisionId}/plays
   ```
   - Returns pools/brackets for a division

6. **Fetch Pool Sheet**
   ```
   GET /api/event/{eventId}/poolsheet/{playId}
   ```
   - Returns match results for completed matches

7. **Fetch Team Roster**
   ```
   GET /api/event/{eventId}/division/{divisionId}/team/{teamId}/roster
   ```
   - Returns player list

### API Integration Requirements

- Implement error handling for all API calls
- Display user-friendly error messages when API calls fail
- Handle network errors gracefully
- Consider caching strategies to reduce API calls where appropriate
- Validate API responses before processing

Implementation details (code structure, error handling patterns) are left to the development team.

### Data Formats

- **Dates**: Unix milliseconds (JavaScript timestamps)
- **Date strings**: `YYYY-MM-DD` format
- **IDs**: Numbers (MatchId, DivisionId, ClubId, TeamId)

### Data Identification & Filtering Strategy

**CRITICAL REQUIREMENT**: The application MUST prioritize ID-based identification and filtering over text matching.

**Primary Method - ID-Based**:
- Use `DivisionId`, `ClubId`, `TeamId`, and `MatchId` from API responses when available
- Filter matches by comparing club/team IDs directly
- Reference entities (clubs, teams, divisions) by their IDs

**Fallback Method - Text Matching**:
- Use text matching ONLY when APIs do not provide ID fields
- Example: The court schedule API (`/api/event/{eventId}/courts/{date}/{timeWindow}`) may only provide text fields (`FirstTeamText`, `SecondTeamText`, `WorkTeamText`) without corresponding IDs
- When text matching is required, match against team/club names in these text fields

**Implementation Requirements**:
1. When club/team assignments API provides TeamIds for a club, use those IDs for filtering
2. When matching court schedule matches, if TeamIds are available, compare IDs directly
3. If court schedule only has text fields, fall back to text matching against team/club names
4. Maintain ID mappings where possible to enable ID-based operations even when some APIs lack IDs

**Filtering Logic**:
- Filter matches to show only those associated with the selected club
- Association determined by:
  1. **Preferred**: Match TeamIds (FirstTeamId, SecondTeamId, WorkTeamId) matching club's TeamIds
  2. **Fallback**: Text matching in FirstTeamText, SecondTeamText, WorkTeamText fields if IDs unavailable
- Filtering happens client-side after fetching data from APIs

### Real-Time Score Synchronization

**Critical Requirement**: Live scores must synchronize in real-time across all clients.

**Implementation Options** (choose one):
1. **Backend Service** (recommended): REST API endpoint for score updates + polling or WebSocket
2. **WebSocket Service**: Direct real-time connection (requires backend)
3. **Third-party Service**: Firebase, Supabase, or similar real-time database

**Score Data Structure** (TypeScript example):
```typescript
interface MatchScore {
  matchId: number; // MUST use MatchId from API, not derived identifier
  eventId: string;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
  lastUpdated: number; // Unix timestamp
  lastUpdatedBy: string; // User identifier (can be simple client ID)
}

interface SetScore {
  setNumber: number;
  team1Score: number;
  team2Score: number;
  completedAt: number; // Unix timestamp
}
```

**Critical**: All score data must reference matches by their `MatchId` from the API. Never create derived or generated identifiers.

**Match Locking** (prevents multiple scorekeepers):
- Only one user can lock a match for scorekeeping at a time
- Lock includes expiration time
- Lock is required before entering scores
- Lock can be released by scorekeeper

---

## 7. Technical Constraints & Recommendations

### Deployment Constraints

- **Hosting Platform**: Application must be deployable to Vercel (or similar static hosting)
- **Build Output**: Must produce static files suitable for CDN deployment
- **No Server-Side Rendering**: Application should function as a client-side application (SPA)

### Framework & Language Recommendations

The development team should choose appropriate technologies. Previous attempts used SvelteKit with TypeScript, but consider:

- Modern framework options that support static site generation
- TypeScript recommended for type safety, but not required
- Consider bundle size and performance implications
- Choose tools that facilitate maintainability

### State Management

- Choose state management approach that fits the selected framework
- Must support real-time synchronization for live scores
- Must persist user preferences across sessions
- Consider simplicity vs. complexity tradeoffs

### Real-Time Synchronization

The live scoring feature requires real-time data synchronization. The development team must choose and implement an appropriate solution:

**Options to Consider**:
- Backend service with REST API + polling
- WebSocket service for real-time updates
- Third-party real-time services (Firebase, Supabase, etc.)
- Edge functions or serverless functions for data persistence

**Requirements**:
- Scores must update across all connected clients within reasonable time (ideally < 2 seconds)
- Solution must handle concurrent score updates safely
- Solution must maintain data integrity

### Build & Tooling

- Use modern build tools appropriate for chosen framework
- Optimize for production bundle size
- Support hot reloading during development
- Ensure build output is compatible with Vercel deployment

---

## 8. Project Organization

### Code Organization Requirements

The development team should organize code in a way that:
- Separates concerns appropriately (UI, business logic, data fetching)
- Makes the codebase maintainable and scalable
- Follows conventions of the chosen framework
- Groups related functionality together

**Suggested Areas of Organization**:
- API client/service layer for external API calls
- State management for application data
- UI components for user interface
- Utilities for reusable logic (filtering, date formatting, etc.)
- Type definitions (if using TypeScript)

### File Naming & Conventions

- Follow conventions of the chosen framework
- Use consistent naming patterns throughout
- Make file and folder names descriptive

---

## 9. Implementation Approach

### Development Philosophy

The development team should:

1. **Start Simple**: Implement core features first, add enhancements iteratively
2. **Choose Appropriate Patterns**: Use patterns that fit the chosen framework and scale appropriately
3. **Optimize for Maintainability**: Write code that future developers can understand and modify
4. **Test Critical Paths**: Ensure core user workflows function correctly
5. **Consider Performance**: Optimize bundle size and runtime performance appropriately

### Key Implementation Decisions

The development team should make decisions on:

1. **State Management**: Choose approach that fits selected framework and requirements
2. **Real-Time Solution**: Select and implement real-time synchronization for live scores
3. **ID Mapping Strategy**: Design approach for mapping between IDs and text (when APIs provide both or only one)
4. **Routing Strategy**: Implement navigation appropriate for the chosen framework
5. **Component Architecture**: Organize UI components for reusability and maintainability
6. **Data Fetching**: Implement efficient data fetching and caching strategies
7. **Error Handling**: Design user-friendly error handling and recovery

### Code Quality

- Use TypeScript or JavaScript with appropriate type checking
- Follow consistent code formatting
- Write readable, self-documenting code
- Handle errors gracefully with user-friendly messages
- Validate user input appropriately

---

## 10. Out of Scope

### Features NOT Required

1. **Data Export**: No export functionality (JSON, CSV, etc.) needed
2. **Complex Analytics**: Keep analytics minimal if implemented at all
3. **Advanced Sharing**: Simple functionality only, no complex sharing mechanisms
4. **User Accounts**: No authentication or user accounts required (consider simple client IDs for match locking)
5. **Complex Notifications**: Simple notifications sufficient, no complex notification system needed

### Development Principles

- **Avoid Over-Engineering**: Don't build abstractions or patterns beyond what's needed
- **Keep It Simple**: Choose simpler solutions when they meet requirements
- **Focus on Core**: Prioritize core functionality over nice-to-have features
- **Separate Concerns**: Keep persona-specific features appropriately separated in UI/UX

---

## 11. Default Values & Configuration

### Default Values

- **Test Event ID**: `PTAwMDAwNDEzMTQ90` (for testing, users should be able to enter any valid Event ID)
- **Initial State**: Application should start with no club selected - user must select a club after entering Event ID

### Data Persistence

The application must persist the following user data locally (localStorage, IndexedDB, or similar):

- Event ID (EventId) and selected club (ClubId)
- User role/persona preference
- Selected matches for coverage (media persona) - store as array of MatchIds
- Favorite/followed teams (spectator persona) - store as array of TeamIds when available
- Onboarding completion status (if onboarding is implemented)

**CRITICAL**: All persisted data that references entities (matches, teams, clubs, divisions) MUST use their IDs from the API, not text names or derived identifiers. This ensures data integrity and proper matching when data is reloaded.

Implementation details for persistence are left to the development team.

---

## 12. Testing & Quality

### Essential Tests

1. **API Integration**: Verify all endpoints work correctly
2. **ID-Based Filtering**: Verify club/team filtering works using IDs when available
3. **Text Matching Fallback**: Verify text matching works correctly when IDs are unavailable
4. **Data Persistence**: Verify persisted data uses IDs, not text identifiers
5. **Conflict Detection**: Verify overlapping matches are detected
6. **Responsive Design**: Verify mobile and desktop layouts
7. **User Workflows**: Verify media and spectator personas can complete tasks

### Code Quality

- TypeScript strict mode
- ESLint for code quality
- Consistent code formatting
- Proper error handling
- User-friendly error messages

---

## 13. Deployment Configuration

### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Build Output

- Static files in `build/` directory
- SPA routing with `index.html` fallback
- No server-side rendering (pure client app)

---

## 14. Development Planning

### Planning Considerations

Before beginning implementation, the development team should plan:

1. **Technology Selection**: Choose framework, language, styling approach, and build tools
2. **Real-Time Solution**: Design and select approach for live score synchronization (see Section 6)
3. **Architecture**: Plan overall application architecture and data flow
4. **Match Locking Strategy**: Design how match locking will work (storage, conflict resolution, expiration)
5. **User Identity**: Determine approach for identifying users (for match locking and score attribution)

### Implementation Phases

Suggested implementation order:

1. **Phase 1 - Foundation**: API integration, basic match display, club selection
2. **Phase 2 - Core Features**: Match filtering, team details, coverage planning (media)
3. **Phase 3 - Live Scoring**: Match locking, score entry interface, real-time sync
4. **Phase 4 - Polish**: Conflict detection, statistics, mobile optimization

The development team should adjust phases based on their approach and priorities.

---

## 15. Success Criteria

The application should successfully:

1. ✅ Load event information and allow club selection
2. ✅ Load and filter matches for selected club
3. ✅ Display filtered matches with essential details
4. ✅ Support media persona with coverage planning features
5. ✅ Support spectator persona with team favoriting
6. ✅ **Enable safe, deterministic live scoring** (primary spectator requirement)
7. ✅ **Real-time score synchronization** visible to all spectators globally
8. ✅ Detect and display conflicts for overlapping matches
9. ✅ Prevent multiple scorekeepers per match through locking mechanism
10. ✅ Function effectively on mobile and desktop devices
11. ✅ Meet accessibility and usability requirements
12. ✅ Deploy successfully to Vercel (or compatible hosting)

---

## Appendix: Data Structures

### API Response Structures

The following describes the data structures returned by the AES API (for reference when implementing API integration):

**Match Structure** (from Court Schedule API):
- `MatchId`: number (always available - use for primary identification)
- `Division`: Object with `DivisionId` (number), `Name` (string), `ColorHex` (string)
- `FirstTeamText`: string (may be only team identifier available in some APIs)
- `SecondTeamText`: string (may be only team identifier available in some APIs)
- `WorkTeamText`: string (may be only team identifier available in some APIs)
- `FirstTeamId`: number (when available - prefer over text)
- `SecondTeamId`: number (when available - prefer over text)
- `WorkTeamId`: number (when available - prefer over text)
- `ScheduledStartDateTime`: number (Unix milliseconds)
- `ScheduledEndDateTime`: number (Unix milliseconds)
- `HasOutcome`: boolean

**Court Schedule Structure**:
- `EarliestStartTime`: number (Unix milliseconds)
- `LatestEndTime`: number (Unix milliseconds)
- `CourtSchedules`: Array of court objects, each containing:
  - `CourtId`: number
  - `Name`: string
  - `VideoLink`: string
  - `CourtMatches`: Array of Match objects

**Team Assignment Structure** (from Team Assignments API):
- Teams have `TeamId`: number (use for ID-based operations)
- Teams have `TeamName`: string
- Teams belong to a `ClubId`: number

**Filtering Requirements**:

**ID-Based Filtering (Preferred)**:
1. Fetch club's team IDs from Team Assignments API (`/odata/{eventId}/nextassignments`)
2. Filter court schedule matches by comparing TeamIds (FirstTeamId, SecondTeamId, WorkTeamId) against club's TeamIds
3. Use DivisionId, ClubId, MatchId for all ID-based operations

**Text-Based Filtering (Fallback Only)**:
- When court schedule API does not provide TeamIds, fall back to text matching
- Match team/club names in `FirstTeamText`, `SecondTeamText`, `WorkTeamText` fields
- This should be the exception, not the primary method

**Implementation Note**: The development team should implement a mapping system that associates team/club IDs with text names to enable seamless switching between ID-based and text-based matching when needed.

The development team should define appropriate data structures/types based on their chosen language and framework.

---

## Conclusion

This document specifies the functional requirements and constraints for building CourtSync. The development team should use these requirements to make unbiased implementation decisions about:

- Framework and language selection
- Architecture and code organization
- Styling approach and design system
- State management strategy
- Real-time synchronization solution
- Build and deployment approach

**Key Principles**:

1. **Requirements-Driven**: Build to meet the functional requirements specified
2. **Unbiased Decisions**: Choose technologies and patterns based on requirements, not previous attempts
3. **User-Focused**: Prioritize user needs and core functionality
4. **Maintainable**: Build for long-term maintainability
5. **Practical**: Choose solutions that balance simplicity and requirements

Previous implementation attempts may serve as reference, but should not constrain architectural or technology decisions. This is a greenfield project.
