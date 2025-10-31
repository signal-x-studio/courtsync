# Implementation Plan: Timeline View Coverage Planning Features

## Overview

This document outlines the step-by-step implementation plan for transforming the timeline view from an informational visualization into an actionable coverage planning tool for photographers/spectators.

**Timeline:** Estimated 4-6 weeks for full implementation
**Priority:** High-impact features first, then enhancements

---

## Phase 1: Enhanced Informational Features
**Goal:** Help users understand conflicts and make informed decisions
**Estimated Time:** 1-2 weeks

### 1.1 Conflict Details Panel
**Priority:** High  
**Estimated Time:** 2-3 days  
**Dependencies:** None

#### Tasks:
- [ ] Create `ConflictDetailsPanel` component
  - [ ] Accept selected match as prop
  - [ ] Fetch conflicting matches from conflicts Map
  - [ ] Display conflict list with:
    - Team names and identifiers
    - Court names
    - Match times
    - Travel time calculation (if court locations available)
- [ ] Add click handler to timeline match blocks
  - [ ] Open panel on conflict click
  - [ ] Highlight clicked match
- [ ] Style panel per design system
  - [ ] Dark theme with charcoal/gold palette
  - [ ] Mobile-responsive layout
  - [ ] Smooth animations/transitions
- [ ] Add close button and outside-click dismissal

#### Technical Considerations:
- Store conflict data in state (already available via `detectConflicts`)
- Use existing `TeamDetailPanel` as reference for panel structure
- Consider adding court location data if available from API

#### Files to Create/Modify:
- `src/components/ConflictDetailsPanel.tsx` (new)
- `src/components/TimelineView.tsx` (modify)
- `src/types/index.ts` (add types if needed)

---

### 1.2 Team Highlighting
**Priority:** High  
**Estimated Time:** 2-3 days  
**Dependencies:** None

#### Tasks:
- [ ] Add state for selected team identifier
  - [ ] Store selected team ID/identifier
  - [ ] Track highlighting state
- [ ] Create team highlighting logic
  - [ ] Filter matches by team identifier
  - [ ] Extract team identifier from match (use existing `getTeamIdentifier`)
- [ ] Visual highlighting implementation
  - [ ] Highlight matching matches with distinct visual style
  - [ ] Add overlay/glow effect
  - [ ] Dim non-matching matches
- [ ] Add click handler to team identifiers
  - [ ] Click team ID → highlight all matches
  - [ ] Click again → clear highlighting
  - [ ] Update timeline blocks to be clickable
- [ ] Add highlight indicator/chip
  - [ ] Show "Showing: Team X" indicator
  - [ ] Clear button

#### Technical Considerations:
- Use CSS classes for highlight styling (gold accent per style guide)
- Consider performance with many matches (use `useMemo` for filtering)
- Mobile-friendly touch targets

#### Files to Create/Modify:
- `src/components/TimelineView.tsx` (modify)
- `src/components/MatchList.tsx` (add team highlighting support)

---

### 1.3 Time Gaps Visualization
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** None

#### Tasks:
- [ ] Calculate time gaps between matches
  - [ ] Use existing `calculateTimeGap` utility
  - [ ] Calculate gaps for each court's matches
  - [ ] Identify large gaps (>30 min) and small gaps (<15 min)
- [ ] Visual gap indicators
  - [ ] Add gap visualization between match blocks
  - [ ] Color code: green for large gaps, yellow for medium, red for tight
  - [ ] Display gap duration in minutes
- [ ] Travel time warnings
  - [ ] Detect matches on different courts with tight gaps
  - [ ] Show warning indicators
  - [ ] Calculate travel time (if court locations available)
- [ ] Gap highlighting mode
  - [ ] Toggle to highlight all gaps
  - [ ] Filter to show only matches with gaps

#### Technical Considerations:
- Enhance `calculateTimeGap` utility if needed
- Consider court location data for accurate travel time
- Performance: calculate gaps on-demand or memoize

#### Files to Create/Modify:
- `src/components/TimelineView.tsx` (modify)
- `src/utils/dateUtils.ts` (enhance if needed)
- `src/types/index.ts` (add gap-related types)

---

## Phase 2: Actionable Coverage Planning Features
**Goal:** Enable users to build and manage coverage plans
**Estimated Time:** 2-3 weeks

### 2.1 Coverage Plan Builder
**Priority:** High  
**Estimated Time:** 3-4 days  
**Dependencies:** None

#### Tasks:
- [ ] Create coverage plan state management
  - [ ] Add `selectedMatches` state (Set of MatchIds)
  - [ ] Add plan persistence (localStorage)
  - [ ] Create plan context/provider (optional, for sharing)
- [ ] Add selection UI to match blocks
  - [ ] Click to select/deselect matches
  - [ ] Visual indicator (checkmark, border, background)
  - [ ] Selected state styling (gold accent)
- [ ] Create `CoveragePlanPanel` component
  - [ ] Display selected matches count
  - [ ] List selected matches with details
  - [ ] Show total coverage time
  - [ ] Calculate gaps in plan
- [ ] Add plan actions
  - [ ] Clear plan button
  - [ ] Deselect all button
  - [ ] Save plan to localStorage
- [ ] Selection across views
  - [ ] Maintain selection when switching list/timeline
  - [ ] Show selected state in both views

#### Technical Considerations:
- Use Set for O(1) lookup performance
- Consider IndexedDB for large plans (future)
- Mobile-friendly selection (tap to select)

#### Files to Create/Modify:
- `src/components/CoveragePlanPanel.tsx` (new)
- `src/components/TimelineView.tsx` (modify)
- `src/components/MatchList.tsx` (modify)
- `src/hooks/useCoveragePlan.ts` (new - custom hook)
- `src/types/index.ts` (add CoveragePlan type)

---

### 2.2 Conflict Resolution Assistant
**Priority:** High  
**Estimated Time:** 3-4 days  
**Dependencies:** 1.1 (Conflict Details Panel), 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Add "Show Conflicts Only" filter toggle
  - [ ] Add filter state to TimelineView
  - [ ] Filter matches to only show conflicts
  - [ ] Update header to show filtered count
- [ ] Enhance ConflictDetailsPanel for decision-making
  - [ ] Add "Cover Match A" / "Cover Match B" buttons
  - [ ] Add "Skip Both" option
  - [ ] Visual comparison of options
  - [ ] Show implications of each choice
- [ ] Integration with coverage plan
  - [ ] Selecting a match adds it to plan
  - [ ] Deselecting removes from plan
  - [ ] Show plan status for each conflict
- [ ] Conflict resolution workflow
  - [ ] "Next Conflict" navigation
  - [ ] Progress indicator (X of Y conflicts resolved)
  - [ ] Completion state

#### Technical Considerations:
- Filter matches efficiently (useMemo)
- Maintain conflict list order for navigation
- Sync with coverage plan state

#### Files to Create/Modify:
- `src/components/ConflictDetailsPanel.tsx` (modify)
- `src/components/TimelineView.tsx` (modify)
- `src/hooks/useCoveragePlan.ts` (modify)

---

### 2.3 Route Optimization
**Priority:** Medium  
**Estimated Time:** 3-4 days  
**Dependencies:** 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Calculate travel time between courts
  - [ ] Create court distance/location data structure
  - [ ] Implement distance calculation (if locations available)
  - [ ] Estimate travel time (walking time, default 5 min between courts)
- [ ] Optimize match sequence
  - [ ] Sort selected matches chronologically
  - [ ] Calculate total travel time
  - [ ] Identify optimal court sequence
- [ ] Visual route display
  - [ ] Show arrows/connectors between matches
  - [ ] Highlight route on timeline
  - [ ] Display route summary (total time, travel time)
- [ ] Route warnings
  - [ ] Warn about impossible transitions
  - [ ] Highlight tight transitions
  - [ ] Suggest alternatives

#### Technical Considerations:
- Start with simple distance estimation (court numbers = distance)
- Consider integration with mapping API (future enhancement)
- Performance: calculate route on plan change

#### Files to Create/Modify:
- `src/utils/routeOptimizer.ts` (new)
- `src/components/CoveragePlanPanel.tsx` (modify)
- `src/types/index.ts` (add Route type)

---

### 2.4 Export/Share Coverage Plan
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Export to CSV
  - [ ] Format selected matches as CSV
  - [ ] Include: time, team, opponent, court, travel time
  - [ ] Download button
- [ ] Export to JSON
  - [ ] Full match data as JSON
  - [ ] Include plan metadata
- [ ] Export to Calendar (ICS format)
  - [ ] Generate ICS file
  - [ ] Include match times, locations, descriptions
  - [ ] Add travel time as buffer
- [ ] Print-friendly view
  - [ ] Create print layout
  - [ ] Hide non-essential UI
  - [ ] Optimize for paper size
- [ ] Share functionality
  - [ ] Generate shareable link (future: with plan encoded)
  - [ ] Copy plan to clipboard
  - [ ] Email plan (future)

#### Technical Considerations:
- Use existing export utilities as reference
- Consider ics.js library for calendar export
- Test print styles across browsers

#### Files to Create/Modify:
- `src/utils/exportUtils.ts` (new or modify)
- `src/components/CoveragePlanPanel.tsx` (modify)
- `src/index.css` (add print styles)

---

## Phase 3: Advanced Coverage Features
**Goal:** Optimize and enhance coverage planning experience
**Estimated Time:** 1-2 weeks

### 3.1 Smart Filtering for Coverage
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** None (can be done earlier)

#### Tasks:
- [ ] Team filter dropdown
  - [ ] List all teams in matches
  - [ ] Filter timeline to selected team
  - [ ] Multi-select support
- [ ] Division filter enhancement
  - [ ] Integrate with existing division filter
  - [ ] Apply to timeline view
- [ ] Time range filter
  - [ ] Morning/Afternoon presets
  - [ ] Custom time range picker
  - [ ] Apply to timeline
- [ ] Filter presets
  - [ ] Save filter combinations
  - [ ] Quick filter buttons
  - [ ] Clear filters button
- [ ] Filter persistence
  - [ ] Save to localStorage
  - [ ] Restore on page load

#### Technical Considerations:
- Reuse existing filter logic from MatchList
- Create shared filter hook/utility
- Performance: memoize filtered results

#### Files to Create/Modify:
- `src/components/TimelineView.tsx` (modify)
- `src/hooks/useFilters.ts` (new - shared filter logic)
- `src/components/MatchList.tsx` (refactor to use shared hook)

---

### 3.2 Coverage Analytics
**Priority:** Low  
**Estimated Time:** 2-3 days  
**Dependencies:** 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Calculate coverage metrics
  - [ ] Matches covered vs available
  - [ ] Coverage percentage
  - [ ] Total coverage time
  - [ ] Teams covered count
- [ ] Visual analytics dashboard
  - [ ] Coverage efficiency chart/gauge
  - [ ] Team coverage distribution
  - [ ] Court movement visualization
  - [ ] Time utilization graph
- [ ] Analytics panel component
  - [ ] Display metrics
  - [ ] Visual charts (consider recharts or similar)
  - [ ] Export analytics report

#### Technical Considerations:
- Keep analytics lightweight (no heavy chart libraries initially)
- Use CSS for simple visualizations
- Consider chart library only if needed

#### Files to Create/Modify:
- `src/components/CoverageAnalytics.tsx` (new)
- `src/utils/analytics.ts` (new)
- `src/components/CoveragePlanPanel.tsx` (add analytics tab)

---

### 3.3 Priority System
**Priority:** Low  
**Estimated Time:** 2-3 days  
**Dependencies:** 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Priority state management
  - [ ] Store priorities per match (Map<MatchId, Priority>)
  - [ ] Priority levels: "Must Cover", "Priority", "Optional"
  - [ ] Persist to localStorage
- [ ] Priority UI
  - [ ] Right-click menu or button to set priority
  - [ ] Visual indicators (icons, colors, borders)
  - [ ] Filter by priority
- [ ] Priority sorting
  - [ ] Sort matches by priority
  - [ ] Show priority in timeline/list views
  - [ ] Priority-aware conflict resolution

#### Technical Considerations:
- Use enum for priority levels
- Visual indicators: gold for must-cover, standard for others
- Integrate with coverage plan

#### Files to Create/Modify:
- `src/components/PrioritySelector.tsx` (new)
- `src/types/index.ts` (add Priority type)
- `src/components/TimelineView.tsx` (modify)
- `src/components/MatchList.tsx` (modify)

---

### 3.4 Opportunity Detection
**Priority:** Low  
**Estimated Time:** 2-3 days  
**Dependencies:** 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Detect easy coverage opportunities
  - [ ] Find matches with no conflicts
  - [ ] Identify gaps where coverage is possible
  - [ ] Calculate coverage potential
- [ ] Visual opportunity indicators
  - [ ] Highlight easy matches (green/blue)
  - [ ] Show opportunity badges
  - [ ] Display opportunity count
- [ ] Opportunity suggestions
  - [ ] "Suggest Matches" button
  - [ ] Recommend matches based on:
    - No conflicts
    - Proximity to selected matches
    - Team preferences
  - [ ] One-click add to plan

#### Technical Considerations:
- Algorithm for opportunity scoring
- Performance: calculate opportunities on-demand
- Consider user preferences/history

#### Files to Create/Modify:
- `src/utils/opportunityDetector.ts` (new)
- `src/components/TimelineView.tsx` (modify)
- `src/components/CoveragePlanPanel.tsx` (add suggestions)

---

## Implementation Order

### Week 1: Foundation
1. **Day 1-2:** Conflict Details Panel (1.1)
2. **Day 3-4:** Team Highlighting (1.2)
3. **Day 5:** Time Gaps Visualization (1.3)

### Week 2: Core Planning Features
4. **Day 1-3:** Coverage Plan Builder (2.1)
5. **Day 4-5:** Conflict Resolution Assistant (2.2)

### Week 3: Enhanced Planning
6. **Day 1-2:** Export/Share Coverage Plan (2.4)
7. **Day 3-4:** Route Optimization (2.3)
8. **Day 5:** Testing and refinement

### Week 4: Advanced Features
9. **Day 1-2:** Smart Filtering (3.1)
10. **Day 3:** Priority System (3.3)
11. **Day 4:** Opportunity Detection (3.4)
12. **Day 5:** Coverage Analytics (3.2)

### Week 5-6: Media Coverage Tracking
13. **Day 1-3:** Coverage Status Tracking (4.1)
14. **Day 4-5:** Smart Coverage Filtering & Highlighting (4.2)
15. **Day 6-7:** Team Coverage Statistics (4.3)
16. **Day 8-10:** Multi-Person Team Coordination (4.4)
17. **Day 11-12:** Advanced Coordination Features (4.5)
18. **Day 13:** Coverage Planning Integration (4.6)

### Week 7-8: Spectator Improvements & Role-Based Views
19. **Day 1-3:** Role-Based View System (5.1)
20. **Day 4-7:** Match Claiming & Scorekeeping (5.2)
21. **Day 8-10:** Real-Time Score Updates (5.3)
22. **Day 11-13:** Spectator-Focused UI Improvements (5.4)
23. **Day 14-15:** Coach View Enhancements (5.5)
24. **Day 16-17:** Score History & Statistics (5.6)
25. **Day 18:** Real-Time Sync Architecture Documentation (5.7)

---

## Technical Architecture

### New Components Structure
```
src/
├── components/
│   ├── ConflictDetailsPanel.tsx     (new)
│   ├── CoveragePlanPanel.tsx        (new)
│   ├── CoverageAnalytics.tsx       (new)
│   ├── CoverageStats.tsx            (new)
│   ├── TeamMemberSelector.tsx       (new)
│   ├── TeamCoverageView.tsx         (new)
│   ├── PrioritySelector.tsx         (new)
│   ├── RoleSelector.tsx             (new)
│   ├── SpectatorView.tsx             (new)
│   ├── CoachView.tsx                 (new)
│   ├── Scorekeeper.tsx               (new)
│   ├── MatchClaimButton.tsx          (new)
│   ├── MatchCard.tsx                 (new)
│   ├── LiveMatchDashboard.tsx        (new)
│   ├── MyTeamsSelector.tsx           (new)
│   ├── ScoreDisplay.tsx              (new)
│   ├── LiveScoreIndicator.tsx        (new)
│   ├── ScoreHistory.tsx              (new)
│   ├── TeamStats.tsx                 (new)
│   ├── TeamMatchView.tsx             (new)
│   ├── WorkAssignmentView.tsx        (new)
│   ├── TimelineView.tsx             (modify)
│   └── MatchList.tsx                (modify)
├── hooks/
│   ├── useCoveragePlan.ts           (new)
│   ├── useCoverageStatus.ts         (new)
│   ├── useTeamCoordination.ts       (new)
│   ├── useFilters.ts                (new)
│   ├── useRole.ts                    (new)
│   ├── useMatchClaiming.ts           (new)
│   ├── useScoreSync.ts               (new)
│   └── useNotifications.ts           (new)
├── contexts/
│   └── RoleContext.tsx               (new - optional)
├── utils/
│   ├── routeOptimizer.ts            (new)
│   ├── analytics.ts                 (new)
│   ├── opportunityDetector.ts       (new)
│   ├── coverageSuggestions.ts       (new)
│   ├── coverageStats.ts             (new)
│   ├── coverageExport.ts             (new)
│   ├── coverageShare.ts              (new)
│   ├── scoreSync.ts                  (new)
│   ├── scoreShare.ts                 (new)
│   ├── scoreStats.ts                 (new)
│   └── exportUtils.ts               (modify)
├── types/
│   └── index.ts                     (modify)
└── docs/
    ├── backend-integration.md        (new)
    └── realtime-sync.md              (new)
```

### State Management Strategy
- **Local State:** Use React hooks (`useState`, `useReducer`) for component state
- **Shared State:** Use Context API for role and coverage plan (optional)
- **Persistence:** localStorage for plan, preferences, scores, and claims
- **Real-Time Sync:** BroadcastChannel API for cross-tab communication, localStorage polling
- **Future:** Consider Zustand or Redux if state becomes complex

### Performance Considerations
- Memoize expensive calculations (`useMemo`)
- Debounce filter inputs
- Lazy load analytics (only calculate when panel is open)
- Virtualize long lists if needed (react-window)

---

## Testing Strategy

### Unit Tests
- Conflict detection logic
- Route optimization algorithms
- Export utilities
- Filter logic

### Integration Tests
- Coverage plan builder workflow
- Conflict resolution flow
- Export functionality

### Manual Testing Checklist
- [ ] Timeline view with conflicts
- [ ] Team highlighting works
- [ ] Coverage plan selection persists
- [ ] Export formats are correct
- [ ] Mobile responsiveness
- [ ] Performance with 100+ matches
- [ ] Role switching works correctly
- [ ] Match claiming and release
- [ ] Score updates sync across tabs
- [ ] Spectator view displays correctly
- [ ] Coach view shows team-centric data

---

## Design Considerations

### Visual Design
- Follow existing style guide (charcoal/gold palette)
- Use gold accent for selected/important items
- Maintain content-first hierarchy
- Progressive disclosure for advanced features

### Accessibility
- WCAG 2.1 compliant touch targets (44x44px)
- Keyboard navigation support
- Screen reader announcements for state changes
- Focus management for modals/panels

### Mobile Considerations
- Touch-friendly selection
- Responsive panels (full-screen on mobile)
- Swipe gestures for navigation (future)
- Optimized for one-handed use

---

## Phase 4: Media Coverage Tracking & Team Coordination
**Goal:** Track media coverage status and coordinate across multi-person media teams
**Estimated Time:** 2-3 weeks

### 4.1 Coverage Status Tracking
**Priority:** High  
**Estimated Time:** 3-4 days  
**Dependencies:** None

#### Tasks:
- [ ] Create coverage status state management
  - [ ] Store coverage status per team (Map<TeamId, CoverageStatus>)
  - [ ] Status options: "Not Covered", "Covered", "Partially Covered", "Planned"
  - [ ] Persist to localStorage with event/date context
  - [ ] Support multiple events (store by eventId)
- [ ] Add coverage status UI
  - [ ] Right-click/long-press menu to mark team as covered
  - [ ] Coverage status badge/indicator on match cards
  - [ ] Status color coding (green = covered, gold = planned, default = uncovered)
  - [ ] Quick status toggle button
- [ ] Visual filtering by coverage status
  - [ ] Dim matches for already-covered teams (opacity ~40%)
  - [ ] Highlight uncovered teams with gold accent
  - [ ] Coverage status filter dropdown
  - [ ] Show coverage percentage in header
- [ ] Coverage history
  - [ ] Track when team was marked as covered (timestamp)
  - [ ] Show coverage date/time in tooltip
  - [ ] Undo coverage status
  - [ ] Clear all coverage status

#### Technical Considerations:
- Extract team identifier consistently (use existing `getTeamIdentifier`)
- Group matches by team to apply status across all matches
- Consider coverage by division vs. by team (allow both)
- Mobile-friendly: long-press for status menu

#### Files to Create/Modify:
- `src/hooks/useCoverageStatus.ts` (new)
- `src/components/MatchList.tsx` (modify)
- `src/components/TimelineView.tsx` (modify)
- `src/types/index.ts` (add CoverageStatus type)

---

### 4.2 Smart Coverage Filtering & Highlighting
**Priority:** High  
**Estimated Time:** 2-3 days  
**Dependencies:** 4.1 (Coverage Status Tracking)

#### Tasks:
- [ ] Uncovered teams highlighting
  - [ ] Automatically highlight matches for uncovered teams
  - [ ] Gold border/background for uncovered matches
  - [ ] Visual priority: uncovered > planned > covered
  - [ ] Legend/key explaining status colors
- [ ] Coverage-focused filters
  - [ ] "Show Only Uncovered" filter
  - [ ] "Show Only Planned" filter
  - [ ] "Show Only Covered" filter
  - [ ] Filter combinations (e.g., "Uncovered + Conflicts")
- [ ] Coverage suggestions
  - [ ] "Suggest Next Coverage" button
  - [ ] Prioritize uncovered teams with no conflicts
  - [ ] Show coverage opportunities badge
  - [ ] One-click add to plan
- [ ] Coverage scanning mode
  - [ ] Toggle to dim all covered teams
  - [ ] Emphasize uncovered teams
  - [ ] Hide covered teams completely (optional)
  - [ ] Coverage statistics overlay

#### Technical Considerations:
- Performance: memoize filtered/highlighted matches
- Visual hierarchy: ensure uncovered teams stand out
- Accessibility: maintain contrast ratios

#### Files to Create/Modify:
- `src/components/MatchList.tsx` (modify)
- `src/components/TimelineView.tsx` (modify)
- `src/utils/coverageSuggestions.ts` (new)
- `src/hooks/useCoverageStatus.ts` (modify)

---

### 4.3 Team Coverage Statistics
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** 4.1 (Coverage Status Tracking)

#### Tasks:
- [ ] Coverage dashboard component
  - [ ] Total teams count
  - [ ] Covered teams count and percentage
  - [ ] Planned teams count
  - [ ] Uncovered teams count
  - [ ] Coverage progress bar/chart
- [ ] Team-level coverage breakdown
  - [ ] List all teams with coverage status
  - [ ] Team coverage percentage (matches covered vs. total)
  - [ ] Sort by coverage status
  - [ ] Export coverage report
- [ ] Coverage timeline
  - [ ] Show coverage over time (when teams were covered)
  - [ ] Coverage rate (teams/hour)
  - [ ] Coverage gaps visualization
- [ ] Coverage goals
  - [ ] Set target coverage percentage
  - [ ] Progress indicator
  - [ ] Remaining teams to cover

#### Technical Considerations:
- Calculate statistics efficiently (useMemo)
- Lightweight visualization (CSS-based, no heavy chart libraries)
- Export coverage statistics to CSV/JSON

#### Files to Create/Modify:
- `src/components/CoverageStats.tsx` (new)
- `src/utils/coverageStats.ts` (new)
- `src/components/CoveragePlanPanel.tsx` (add stats tab)

---

### 4.4 Multi-Person Team Coordination (LocalStorage-Based)
**Priority:** High  
**Estimated Time:** 4-5 days  
**Dependencies:** 4.1 (Coverage Status Tracking)

#### Tasks:
- [ ] Team member profiles
  - [ ] Add team member name/profile (stored in localStorage)
  - [ ] Color assignment per team member
  - [ ] Profile selector/switcher
  - [ ] Default to "You" if no team configured
- [ ] Shared coverage status (localStorage + manual sync)
  - [ ] Export coverage status as JSON
  - [ ] Import coverage status from JSON
  - [ ] Merge coverage statuses (combine multiple team members)
  - [ ] Manual sync workflow (copy/paste JSON)
- [ ] Coverage assignment
  - [ ] Assign teams to specific team members
  - [ ] Visual indicator showing assigned member
  - [ ] Filter by assigned member
  - [ ] Prevent double-assignment warnings
- [ ] Team coordination view
  - [ ] Show all team members' coverage status
  - [ ] Color-coded by team member
  - [ ] Coverage map showing who's covering what
  - [ ] Gaps detection (unassigned teams)
  - [ ] Conflict detection (multiple assignments)

#### Technical Considerations:
- Use localStorage with structured keys (eventId + teamMemberId)
- Export/import JSON for manual sharing (no backend needed)
- Consider URL hash encoding for shareable links (future)
- Color scheme: assign distinct colors per team member

#### Files to Create/Modify:
- `src/hooks/useTeamCoordination.ts` (new)
- `src/components/TeamMemberSelector.tsx` (new)
- `src/components/TeamCoverageView.tsx` (new)
- `src/components/CoveragePlanPanel.tsx` (add coordination tab)
- `src/utils/coverageExport.ts` (new)

---

### 4.5 Advanced Coordination Features
**Priority:** Medium  
**Estimated Time:** 3-4 days  
**Dependencies:** 4.4 (Multi-Person Team Coordination)

#### Tasks:
- [ ] Shareable coverage link (URL-based)
  - [ ] Encode coverage status in URL hash
  - [ ] Generate shareable link
  - [ ] Import coverage from URL
  - [ ] Handle large coverage data (compression)
- [ ] Coverage conflict resolution
  - [ ] Detect when multiple team members assigned to same team
  - [ ] Resolution UI: choose which member keeps assignment
  - [ ] Merge coverage statuses intelligently
- [ ] Coverage handoff
  - [ ] Transfer coverage assignment between members
  - [ ] Handoff notes/comments
  - [ ] Handoff history
- [ ] Real-time sync suggestion (Future Enhancement)
  - [ ] Document architecture for future backend integration
  - [ ] Suggest WebSocket/SSE for real-time updates
  - [ ] Outline API requirements if backend added

#### Technical Considerations:
- URL hash encoding: use base64 encoding for coverage data
- Size limits: warn if URL exceeds ~2000 chars
- Compression: consider lz-string for larger datasets
- Backend suggestion: document Firebase/WebSocket architecture if needed

#### Files to Create/Modify:
- `src/utils/coverageShare.ts` (new)
- `src/components/TeamCoverageView.tsx` (modify)
- `src/docs/backend-integration.md` (new - documentation)

---

### 4.6 Coverage Planning Integration
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** 4.1 (Coverage Status Tracking), 2.1 (Coverage Plan Builder)

#### Tasks:
- [ ] Integrate coverage status with coverage plan
  - [ ] Show coverage status in plan panel
  - [ ] Filter plan by coverage status
  - [ ] Auto-mark as "Planned" when added to plan
  - [ ] Auto-mark as "Covered" when match completed (manual)
- [ ] Coverage-aware plan suggestions
  - [ ] Prioritize uncovered teams in suggestions
  - [ ] Filter plan suggestions by coverage status
  - [ ] Show coverage gaps in plan
- [ ] Plan-to-coverage workflow
  - [ ] Mark all planned matches as "Planned"
  - [ ] Quick action: "Mark Plan as Covered"
  - [ ] Coverage status bulk update

#### Technical Considerations:
- Sync coverage plan and coverage status
- Maintain consistency between plan and status
- Consider auto-updating status based on plan changes

#### Files to Create/Modify:
- `src/components/CoveragePlanPanel.tsx` (modify)
- `src/hooks/useCoveragePlan.ts` (modify)
- `src/hooks/useCoverageStatus.ts` (modify)

## Phase 5: Spectator Improvements & Role-Based Views
**Goal:** Support parent/spectator scorekeeping with real-time updates and role-based UI optimization
**Estimated Time:** 2-3 weeks

### 5.1 Role-Based View System
**Priority:** High  
**Estimated Time:** 3-4 days  
**Dependencies:** None

#### Tasks:
- [ ] Create user role system
  - [ ] Role types: "Media", "Spectator", "Coach" (default: "Media")
  - [ ] Role selector in header/settings
  - [ ] Persist role preference to localStorage
  - [ ] Role-specific UI adaptations
- [ ] Media View (existing)
  - [ ] Current timeline/list view optimized for coverage planning
  - [ ] Conflict detection and resolution
  - [ ] Coverage planning features
  - [ ] Keep existing functionality
- [ ] Spectator View
  - [ ] Simplified match list focused on following specific teams
  - [ ] "My Teams" filter (teams parent is following)
  - [ ] Upcoming matches prominently displayed
  - [ ] Live match indicators
  - [ ] Score display and updates
- [ ] Coach View
  - [ ] Team-centric view (all matches for team's divisions)
  - [ ] Match details and opponent information
  - [ ] Pool standings and bracket progression
  - [ ] Work assignment visibility
- [ ] View switcher UI
  - [ ] Role selector dropdown/pills in header
  - [ ] Visual indication of current role
  - [ ] Quick switch between roles
  - [ ] Remember last selected role

#### Technical Considerations:
- Use Context API or localStorage for role state
- Conditional rendering based on role
- Maintain shared state (matches, events) across roles
- Consider URL parameter for role (?role=spectator)

#### Files to Create/Modify:
- `src/hooks/useRole.ts` (new)
- `src/contexts/RoleContext.tsx` (new - optional)
- `src/App.tsx` (modify)
- `src/components/RoleSelector.tsx` (new)
- `src/components/SpectatorView.tsx` (new)
- `src/components/CoachView.tsx` (new)

---

### 5.2 Match Claiming & Scorekeeping
**Priority:** High  
**Estimated Time:** 4-5 days  
**Dependencies:** 5.1 (Role-Based View System)

#### Tasks:
- [ ] Match claiming system
  - [ ] "Claim Match" button on match cards (spectator view)
  - [ ] Claim state: "Available", "Claimed by [Name]", "Locked"
  - [ ] Show claimer name/identifier
  - [ ] Visual indicator (badge, border color)
  - [ ] Claim expiration (auto-release after match ends + buffer)
- [ ] Scorekeeping UI
  - [ ] Score input component (sets per team)
  - [ ] Current set score display
  - [ ] Match status: "Not Started", "In Progress", "Completed"
  - [ ] Score history/timeline
  - [ ] Undo/redo for score corrections
- [ ] Score persistence
  - [ ] Store scores in localStorage per match
  - [ ] Include claimer identifier and timestamp
  - [ ] Support multiple events (store by eventId)
  - [ ] Export scores for backup
- [ ] Claim management
  - [ ] Release claim button (for claimer)
  - [ ] Transfer claim option
  - [ ] Claim conflict handling (if multiple claim simultaneously)
  - [ ] Claim history/log

#### Technical Considerations:
- Use localStorage with structured keys (eventId + matchId)
- Timestamp for claim expiration logic
- Optimistic UI updates
- Handle concurrent claims gracefully (last-write-wins or conflict resolution)

#### Files to Create/Modify:
- `src/hooks/useMatchClaiming.ts` (new)
- `src/components/Scorekeeper.tsx` (new)
- `src/components/MatchClaimButton.tsx` (new)
- `src/components/MatchCard.tsx` (modify or create)
- `src/types/index.ts` (add MatchClaim, Score types)

---

### 5.3 Real-Time Score Updates (LocalStorage-Based)
**Priority:** High  
**Estimated Time:** 3-4 days  
**Dependencies:** 5.2 (Match Claiming & Scorekeeping)

#### Tasks:
- [ ] Score synchronization mechanism
  - [ ] Poll localStorage for score updates (interval-based)
  - [ ] Compare scores with timestamp to detect updates
  - [ ] Broadcast updates to all open tabs/windows (BroadcastChannel API)
  - [ ] Visual indicator for "Live" scores
- [ ] Score export/import for sharing
  - [ ] Export all scores as JSON
  - [ ] Import scores from JSON (for scorekeeper to share)
  - [ ] Manual sync workflow (scorekeeper exports, others import)
  - [ ] Shareable score link (URL hash encoding)
- [ ] Live score display
  - [ ] Real-time score updates in match cards
  - [ ] "Live" badge for in-progress matches
  - [ ] Score notifications (optional toast/alert)
  - [ ] Score change indicators (flash on update)
- [ ] Score conflict resolution
  - [ ] Detect when scorekeeper updates score
  - [ ] Show update timestamp
  - [ ] Option to refresh scores manually
  - [ ] Handle concurrent edits gracefully

#### Technical Considerations:
- Use BroadcastChannel API for cross-tab communication
- Polling interval: 2-5 seconds for live updates
- Consider WebSocket for future backend integration
- URL hash encoding for shareable score links
- Compression for large score datasets

#### Files to Create/Modify:
- `src/hooks/useScoreSync.ts` (new)
- `src/utils/scoreSync.ts` (new)
- `src/utils/scoreShare.ts` (new)
- `src/components/LiveScoreIndicator.tsx` (new)
- `src/components/ScoreDisplay.tsx` (modify)

---

### 5.4 Spectator-Focused UI Improvements
**Priority:** Medium  
**Estimated Time:** 3-4 days  
**Dependencies:** 5.1 (Role-Based View System)

#### Tasks:
- [ ] "My Teams" functionality
  - [ ] Team selector/follow list
  - [ ] Pin favorite teams to top
  - [ ] Filter matches by followed teams
  - [ ] Team color customization
- [ ] Match card redesign for spectators
  - [ ] Larger, more prominent match cards
  - [ ] Clearer time/court display
  - [ ] Score display prominently featured
  - [ ] Claim status visible
  - [ ] Quick actions (claim, follow team)
- [ ] Live match dashboard
  - [ ] "Live Now" section at top
  - [ ] Cards for currently playing matches
  - [ ] Score updates highlighted
  - [ ] Auto-refresh for live matches
- [ ] Match notifications
  - [ ] Upcoming match reminders (5 min before)
  - [ ] Score update notifications
  - [ ] Browser notifications API (optional)
  - [ ] Notification preferences

#### Technical Considerations:
- Responsive design for mobile spectators
- Touch-friendly interaction (larger tap targets)
- Performance: optimize for frequent updates
- Accessibility: screen reader announcements for score updates

#### Files to Create/Modify:
- `src/components/SpectatorView.tsx` (modify)
- `src/components/MatchCard.tsx` (modify or create)
- `src/components/LiveMatchDashboard.tsx` (new)
- `src/components/MyTeamsSelector.tsx` (new)
- `src/hooks/useNotifications.ts` (new)

---

### 5.5 Coach View Enhancements
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** 5.1 (Role-Based View System)

#### Tasks:
- [ ] Team-centric match view
  - [ ] Group matches by team
  - [ ] Show all matches for team's divisions
  - [ ] Opponent information prominently displayed
  - [ ] Match history and upcoming matches
- [ ] Pool standings integration
  - [ ] Show standings for team's pools
  - [ ] Bracket progression visualization
  - [ ] Qualification scenarios
- [ ] Work assignment visibility
  - [ ] Show team's work assignments
  - [ ] Work schedule alongside playing schedule
  - [ ] Work assignment reminders
- [ ] Coaching tools
  - [ ] Match notes/comments
  - [ ] Roster view integration
  - [ ] Player availability tracking (future)

#### Technical Considerations:
- Reuse existing pool sheet components
- Integrate with TeamDetailPanel
- Coach-specific data filtering

#### Files to Create/Modify:
- `src/components/CoachView.tsx` (modify)
- `src/components/TeamMatchView.tsx` (new)
- `src/components/WorkAssignmentView.tsx` (new)

---

### 5.6 Score History & Statistics
**Priority:** Low  
**Estimated Time:** 2-3 days  
**Dependencies:** 5.2 (Match Claiming & Scorekeeping)

#### Tasks:
- [ ] Score history tracking
  - [ ] Store score changes over time
  - [ ] Score timeline/graph per match
  - [ ] Score trends visualization
- [ ] Team statistics
  - [ ] Calculate win/loss records from scores
  - [ ] Points scored/allowed averages
  - [ ] Set win/loss statistics
  - [ ] Display in team detail view
- [ ] Score export and reporting
  - [ ] Export scores to CSV/JSON
  - [ ] Score reports by team/division
  - [ ] Print-friendly score sheets
- [ ] Score validation
  - [ ] Validate score inputs (e.g., sets to 25)
  - [ ] Warning for unusual scores
  - [ ] Score correction workflow

#### Technical Considerations:
- Lightweight statistics calculation
- Store score history efficiently
- Consider score validation rules from API if available

#### Files to Create/Modify:
- `src/utils/scoreStats.ts` (new)
- `src/components/ScoreHistory.tsx` (new)
- `src/components/TeamStats.tsx` (new)

---

### 5.7 Real-Time Sync Architecture (Future Enhancement)
**Priority:** Low  
**Estimated Time:** Document only  
**Dependencies:** 5.3 (Real-Time Score Updates)

#### Tasks:
- [ ] Document backend architecture options
  - [ ] WebSocket-based real-time sync
  - [ ] Server-Sent Events (SSE) alternative
  - [ ] Firebase Realtime Database option
  - [ ] Supabase Realtime option
- [ ] API design outline
  - [ ] Score update endpoints
  - [ ] Claim management endpoints
  - [ ] Authentication requirements
  - [ ] Rate limiting considerations
- [ ] Migration path
  - [ ] Gradual migration from localStorage
  - [ ] Backward compatibility
  - [ ] Data migration strategy

#### Technical Considerations:
- Keep localStorage as fallback
- Design for offline-first, sync when online
- Consider PWA capabilities for offline support

#### Files to Create/Modify:
- `src/docs/backend-integration.md` (modify)
- `src/docs/realtime-sync.md` (new)

---

## Future Enhancements (Post-MVP)

1. **Court Location Integration**
   - Real court locations from API
   - Accurate travel time calculations
   - Map integration

2. **Backend Integration for Team Coordination** (If Needed)
   - Real-time sync with WebSocket/SSE
   - User authentication and profiles
   - Centralized coverage status database
   - Conflict resolution via server
   - **Note:** Current localStorage + export/import approach should work for 2-3 person teams

3. **AI Suggestions**
   - ML-based match recommendations
   - Optimal coverage route suggestions
   - Conflict resolution assistance

4. **Historical Analytics**
   - Track coverage over time
   - Team performance correlation
   - Coverage effectiveness metrics

5. **Calendar Integration**
   - Sync with Google Calendar
   - Apple Calendar support
   - Event reminders

---

## Success Metrics

### User Engagement
- Coverage plans created per user
- Conflicts resolved per session
- Export usage frequency

### Feature Adoption
- Team highlighting usage
- Filter usage patterns
- Analytics panel views

### Performance
- Page load time < 2s
- Interaction response < 100ms
- Mobile performance score > 90

---

## Notes

- All features should maintain backward compatibility
- Progressive enhancement: core features work without JavaScript
- Consider feature flags for gradual rollout
- Document API changes if any
- Update README with new features

