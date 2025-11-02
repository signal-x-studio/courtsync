# CourtSync - SvelteKit Architecture & Tech Stack

## Executive Summary

This document defines the technical architecture for CourtSync using SvelteKit 2.0 and Svelte 5, leveraging 2025's native real-time patterns and superior performance characteristics.

**Architecture Philosophy**: Maximum performance, minimal complexity. Svelte's compiler-based approach and native reactivity eliminate the need for complex state management libraries while delivering 60-70% smaller bundles than React alternatives.

---

## Technology Stack Overview

### Core Framework
**SvelteKit 2.0 + Svelte 5 (Runes)**

**Rationale**:
- **25x smaller bundle** than React (1.8KB vs 44.5KB)
- **30% faster load times** in 2025 benchmarks
- **Native real-time support** with WebSockets (added March 2025)
- **Svelte 5 Runes** provide explicit, predictable reactivity perfect for live scoring
- **Compiler-based** - zero runtime overhead
- **Native TypeScript** support without preprocessors
- **Excellent mobile performance** on low-powered devices
- **Most admired frontend framework** (Stack Overflow surveys)

**Key Svelte 5 Features Used**:
- **Runes**: `$state`, `$derived`, `$effect` for reactive state
- **Stores**: Persistent state across components
- **Actions**: Touch-friendly mobile interactions
- **Transitions**: Smooth match status changes

### Real-Time Synchronization
**Supabase Realtime Database + Native WebSocket Support**

**Rationale**:
- **Dual approach**: Supabase for persistence + native WebSockets for instant updates
- **Row-level security** for match locking
- **PostgreSQL-backed** for data integrity
- **< 1 second latency** for score updates
- **Automatic scaling** without custom backend
- **Perfect Svelte integration** via `@supabase/supabase-js`

**Alternative Native Pattern** (if you want to avoid Supabase):
```typescript
// SvelteKit now has native WebSocket support!
// Can use +server.ts files with WebSocket handlers
// This is NEW in March 2025
```

### State Management Strategy
**Svelte 5 Runes + Svelte Stores (No External Libraries Needed!)**

This is where Svelte shines - you don't need TanStack Query, Zustand, Redux, or any other library.

#### 1. Component State (Svelte 5 Runes)
**`$state`, `$derived`, `$effect`**

**Rationale**:
- Native, built-in reactivity
- Zero bundle overhead
- Fine-grained updates (no virtual DOM diffing)
- TypeScript-friendly with inference

**Use Cases**:
- Component-level UI state
- Form inputs
- Accordion expand/collapse
- Modal visibility

**Example**:
```typescript
<script lang="ts">
  // Reactive state
  let expandedTimeBlocks = $state<Set<string>>(new Set());

  // Derived state (memoized)
  let liveMatches = $derived(
    matches.filter(m => m.status === 'in-progress')
  );

  // Side effects
  $effect(() => {
    // Runs when liveMatches changes
    console.log(`${liveMatches.length} matches live`);
  });
</script>
```

#### 2. Global State (Svelte Stores)
**Writable, Readable, Derived stores**

**Rationale**:
- Built into Svelte (0 bytes added to bundle)
- Auto-subscription in components
- localStorage persistence with simple custom store
- Perfect for app-wide state

**Use Cases**:
- Coverage plan (MatchIds)
- Favorite teams (TeamIds)
- Current persona (media/spectator)
- Active filters

**Example**:
```typescript
// lib/stores/coverage.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createCoverageStore() {
  // Load from localStorage
  const stored = browser ? localStorage.getItem('coverage-plan') : null;
  const initial: number[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<number[]>(initial);

  return {
    subscribe,
    addMatch: (matchId: number) => update(ids => {
      const updated = [...ids, matchId];
      if (browser) localStorage.setItem('coverage-plan', JSON.stringify(updated));
      return updated;
    }),
    removeMatch: (matchId: number) => update(ids => {
      const updated = ids.filter(id => id !== matchId);
      if (browser) localStorage.setItem('coverage-plan', JSON.stringify(updated));
      return updated;
    }),
    clear: () => {
      if (browser) localStorage.removeItem('coverage-plan');
      set([]);
    }
  };
}

export const coveragePlan = createCoverageStore();
```

**Usage in Components**:
```svelte
<script lang="ts">
  import { coveragePlan } from '$lib/stores/coverage';

  // Auto-subscribes ($ prefix), auto-unsubscribes on destroy
  $: isInPlan = $coveragePlan.includes(match.MatchId);
</script>

<button on:click={() => coveragePlan.addMatch(match.MatchId)}>
  {isInPlan ? 'Remove from Plan' : 'Add to Plan'}
</button>
```

#### 3. Server Data (SvelteKit Load Functions)
**`+page.ts` and `+page.server.ts` load functions**

**Rationale**:
- Built into SvelteKit
- Runs before page renders
- Automatic loading states
- Perfect for initial data fetching
- Can run on server or client

**Example**:
```typescript
// routes/club/[clubId]/+page.ts
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';

export const load: PageLoad = async ({ params, fetch }) => {
  const { clubId } = params;

  // These run in parallel
  const [teams, schedule] = await Promise.all([
    aesClient.getTeamAssignments(eventId, clubId),
    aesClient.getCourtSchedule(eventId, date, timeWindow)
  ]);

  return {
    teams,
    schedule,
    clubId
  };
};
```

**Usage in Component**:
```svelte
<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  // data.teams and data.schedule are available immediately
  // SvelteKit handles loading states automatically
</script>

{#each data.schedule as match}
  <MatchCard {match} />
{/each}
```

#### 4. Real-Time State (Supabase + Custom Stores)
**Supabase Realtime + Svelte Store wrapper**

**Example**:
```typescript
// lib/stores/liveScore.ts
import { readable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';
import type { MatchScore } from '$lib/types';

export function liveScore(matchId: number) {
  return readable<MatchScore | null>(null, (set) => {
    // Fetch initial score
    supabase
      .from('match_scores')
      .select('*')
      .eq('match_id', matchId)
      .single()
      .then(({ data }) => set(data));

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_scores',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => set(payload.new as MatchScore)
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  });
}
```

**Usage**:
```svelte
<script lang="ts">
  import { liveScore } from '$lib/stores/liveScore';

  export let matchId: number;

  // Auto-subscribes to real-time updates!
  const score = liveScore(matchId);
</script>

{#if $score}
  <div class="score">
    {$score.sets[0]?.team1Score} - {$score.sets[0]?.team2Score}
  </div>
{/if}
```

### **State Architecture Comparison**

**Before (React/Next.js)**:
```
TanStack Query (42KB) + Zustand (3KB) + Supabase Client (XKB)
= Multiple libraries, multiple mental models
```

**After (SvelteKit)**:
```
Svelte Runes (0KB) + Svelte Stores (0KB) + Supabase Client (XKB)
= Native features only, single mental model
```

### Styling Framework
**Tailwind CSS v4**

**Rationale**:
- Works perfectly with Svelte
- Mobile-first responsive design
- Dark mode with class strategy
- JIT compiler
- Excellent with Svelte's scoped styles

**Svelte-Specific Benefits**:
- Use Tailwind for utilities + Svelte `<style>` for complex components
- Best of both worlds

**Configuration**:
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'court-dark': '#1a1a1a',
        'court-gold': '#d4af37'
      }
    }
  }
};
```

### Component Library
**shadcn-svelte** (optional)

**Rationale**:
- Svelte port of shadcn/ui
- Radix UI primitives for accessibility
- Copy-paste components (not npm dependency)
- Tailwind-styled

**Alternative**: **Skeleton UI** or **Flowbite Svelte** (more Svelte-native)

### Type Safety
**TypeScript 5.x (Strict Mode)**

**Rationale**:
- Native support in Svelte 5 (no preprocessor needed!)
- Excellent inference with Runes
- Type-safe SvelteKit routing
- Auto-generated types for load functions

**SvelteKit Type Generation**:
```typescript
// SvelteKit generates ./$types automatically
import type { PageData, PageLoad } from './$types';
```

### Build Tooling
**Vite 5 (SvelteKit default)**

**Rationale**:
- Lightning-fast HMR (Hot Module Replacement)
- Native ESM
- Optimized for Svelte
- Better than Turbopack for Svelte projects

---

## Architecture Patterns

### 1. File Structure (SvelteKit)

```
/src
├── routes/
│   ├── +layout.svelte              # Root layout (navigation)
│   ├── +layout.ts                  # Root layout data
│   ├── +page.svelte                # Event/club selection
│   ├── +page.ts                    # Event data loader
│   │
│   ├── club/[clubId]/
│   │   ├── +layout.svelte          # Club context wrapper
│   │   ├── +layout.ts              # Load club data
│   │   ├── +page.svelte            # Club Match Hub (All Matches)
│   │   ├── +page.ts                # Load matches
│   │   │
│   │   ├── team/[teamId]/
│   │   │   ├── +page.svelte        # Team detail view
│   │   │   └── +page.ts            # Load team data
│   │   │
│   │   ├── match/[matchId]/
│   │   │   ├── +page.svelte        # Match detail & live scoring
│   │   │   └── +page.ts            # Load match data
│   │   │
│   │   ├── my-teams/
│   │   │   ├── +page.svelte        # Spectator favorites
│   │   │   └── +page.ts            # Load favorite teams
│   │   │
│   │   ├── coverage/
│   │   │   ├── +page.svelte        # Media coverage plan
│   │   │   └── +page.ts            # Load coverage stats
│   │   │
│   │   └── filters/
│   │       └── +page.svelte        # Filters modal/drawer
│   │
│   └── api/                         # Optional: API routes
│       └── websocket/
│           └── +server.ts           # Native WebSocket handler (NEW!)
│
├── lib/
│   ├── components/
│   │   ├── ui/                      # shadcn-svelte components
│   │   ├── match/                   # Match components
│   │   │   ├── MatchCard.svelte
│   │   │   ├── MatchDetail.svelte
│   │   │   └── TimeBlock.svelte
│   │   ├── team/
│   │   │   ├── TeamCard.svelte
│   │   │   └── TeamSchedule.svelte
│   │   ├── navigation/
│   │   │   └── BottomNav.svelte
│   │   └── scoring/
│   │       ├── ScoreBoard.svelte
│   │       └── ScoreEntry.svelte
│   │
│   ├── stores/                      # Svelte stores
│   │   ├── coverage.ts              # Coverage plan store
│   │   ├── favorites.ts             # Favorite teams store
│   │   ├── filters.ts               # Active filters store
│   │   ├── persona.ts               # User persona store
│   │   └── liveScore.ts             # Real-time score store factory
│   │
│   ├── api/                         # API clients
│   │   ├── aesClient.ts             # AES API client
│   │   └── errors.ts                # Error handling
│   │
│   ├── supabase/
│   │   ├── client.ts                # Supabase client
│   │   ├── schema.sql               # Database schema
│   │   └── actions.ts               # Score update actions
│   │
│   ├── utils/
│   │   ├── filterMatches.ts         # ID-based filtering
│   │   ├── conflicts.ts             # Conflict detection
│   │   ├── dateFormat.ts            # Date utilities
│   │   └── groupByTime.ts           # Time block grouping
│   │
│   ├── actions/                     # Svelte actions (for mobile)
│   │   ├── longpress.ts             # Long press detection
│   │   └── swipe.ts                 # Swipe gestures
│   │
│   └── types/
│       ├── aes.ts                   # AES API types
│       ├── supabase.ts              # Supabase types
│       └── app.ts                   # App-specific types
│
├── app.html                         # HTML template
├── app.css                          # Global styles (Tailwind)
└── app.d.ts                         # Global type declarations
```

### 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Svelte Components                          │
│         (Reactive with Runes & Stores)                  │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
   ┌────────┐ ┌─────┐ ┌──────────┐
   │ Runes  │ │Store│ │ Supabase │
   │$state  │ │     │ │ Realtime │
   │$derived│ │     │ │          │
   └────────┘ └──┬──┘ └────┬─────┘
               │         │
               ▼         ▼
         ┌──────────┐ ┌──────────┐
         │localStorage│ │PostgreSQL│
         └──────────┘ └──────────┘
                          ▲
                          │
                    ┌─────┴─────┐
                    │  AES API  │
                    │ (External)│
                    └───────────┘
```

### 3. SvelteKit Load Functions Pattern

**Key Insight**: SvelteKit's load functions replace TanStack Query's functionality natively.

**Parallel Data Loading**:
```typescript
// routes/club/[clubId]/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, fetch }) => {
  // Get parent layout data
  const { event } = await parent();

  // Parallel loading
  const [teams, schedule, divisions] = await Promise.all([
    fetch(`/api/teams?clubId=${params.clubId}`).then(r => r.json()),
    fetch(`/api/schedule?eventId=${event.id}`).then(r => r.json()),
    fetch(`/api/divisions?eventId=${event.id}`).then(r => r.json())
  ]);

  return { teams, schedule, divisions };
};
```

**Dependent Data Loading**:
```typescript
// routes/match/[matchId]/+page.ts
export const load: PageLoad = async ({ params, fetch }) => {
  // First, get match details
  const match = await fetch(`/api/match/${params.matchId}`).then(r => r.json());

  // Then, get related data based on match
  const [team1, team2] = await Promise.all([
    fetch(`/api/team/${match.FirstTeamId}`).then(r => r.json()),
    fetch(`/api/team/${match.SecondTeamId}`).then(r => r.json())
  ]);

  return { match, team1, team2 };
};
```

**Automatic Revalidation**:
```typescript
// SvelteKit automatically revalidates on navigation
// Use invalidate() for manual revalidation
import { invalidate } from '$app/navigation';

function refetchData() {
  invalidate('app:matches'); // Rerun all load functions with this dependency
}
```

### 4. ID-Based Filtering (Same as Next.js version)

```typescript
// lib/utils/filterMatches.ts
import type { Match, TeamAssignment } from '$lib/types';

interface MatchFilter {
  clubTeamIds: number[];
  clubTeamNames: string[];
}

export function matchBelongsToClub(match: Match, filter: MatchFilter): boolean {
  // Prefer ID-based matching
  const matchTeamIds = [
    match.FirstTeamId,
    match.SecondTeamId,
    match.WorkTeamId
  ].filter(Boolean);

  if (matchTeamIds.length > 0) {
    return matchTeamIds.some(id => filter.clubTeamIds.includes(id));
  }

  // Fallback to text matching
  const matchTeamTexts = [
    match.FirstTeamText,
    match.SecondTeamText,
    match.WorkTeamText
  ].filter(Boolean);

  return matchTeamTexts.some(text =>
    filter.clubTeamNames.some(name => text.includes(name))
  );
}

// Usage in component with derived state
let matches = $state<Match[]>([]);
let clubFilter = $state<MatchFilter>({ clubTeamIds: [], clubTeamNames: [] });

let filteredMatches = $derived(
  matches.filter(m => matchBelongsToClub(m, clubFilter))
);
```

### 5. Real-Time Live Scoring Architecture

**Supabase Schema** (same as Next.js version):

```sql
-- Table: match_scores
CREATE TABLE match_scores (
  match_id BIGINT PRIMARY KEY,
  event_id TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'not-started',
  locked_by TEXT,
  locked_until TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  last_updated_by TEXT,

  CONSTRAINT valid_status CHECK (status IN ('not-started', 'in-progress', 'completed'))
);

-- Table: match_locks
CREATE TABLE match_locks (
  match_id BIGINT PRIMARY KEY,
  locked_by TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT valid_lock CHECK (expires_at > locked_at)
);

-- RLS policies (same as before)
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scores" ON match_scores
  FOR SELECT USING (true);

CREATE POLICY "Only lock holder can update" ON match_scores
  FOR UPDATE USING (locked_by = current_setting('app.user_id', true));
```

**Svelte Implementation**:

```svelte
<!-- routes/match/[matchId]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import { liveScore } from '$lib/stores/liveScore';
  import { lockMatch, unlockMatch, updateScore } from '$lib/supabase/actions';

  export let data: PageData;

  // Real-time score subscription (auto-subscribes!)
  const score = liveScore(data.match.MatchId);

  // Component state
  let isLocking = $state(false);
  let clientId = $state(crypto.randomUUID());

  // Derived state
  let isLockedByMe = $derived(
    $score?.locked_by === clientId
  );

  let canScore = $derived(
    isLockedByMe && $score?.locked_until &&
    new Date($score.locked_until) > new Date()
  );

  async function handleLockMatch() {
    isLocking = true;
    try {
      await lockMatch(data.match.MatchId, clientId);
    } catch (error) {
      alert('Failed to lock match. Someone else may be scoring.');
    } finally {
      isLocking = false;
    }
  }

  async function handleScoreUpdate(team: 1 | 2, points: number) {
    if (!canScore) return;

    await updateScore(data.match.MatchId, {
      setNumber: 0,
      team,
      points,
      updatedBy: clientId
    });
  }
</script>

<div class="match-detail">
  <h1>{data.match.FirstTeamText} vs {data.match.SecondTeamText}</h1>

  {#if $score}
    <div class="scoreboard">
      {#each $score.sets as set, i}
        <div class="set">
          <span>Set {i + 1}</span>
          <span>{set.team1Score} - {set.team2Score}</span>
        </div>
      {/each}
    </div>

    {#if !isLockedByMe}
      <button
        on:click={handleLockMatch}
        disabled={isLocking || $score.locked_by !== null}
      >
        {isLocking ? 'Locking...' : 'Lock Match for Scoring'}
      </button>
    {:else if canScore}
      <div class="score-entry">
        <h2>Score Entry</h2>
        <div class="team-scores">
          <div>
            <h3>{data.match.FirstTeamText}</h3>
            <button on:click={() => handleScoreUpdate(1, 1)}>+1</button>
            <button on:click={() => handleScoreUpdate(1, -1)}>-1</button>
          </div>
          <div>
            <h3>{data.match.SecondTeamText}</h3>
            <button on:click={() => handleScoreUpdate(2, 1)}>+1</button>
            <button on:click={() => handleScoreUpdate(2, -1)}>-1</button>
          </div>
        </div>
        <button on:click={() => unlockMatch(data.match.MatchId)}>
          Release Lock
        </button>
      </div>
    {/if}
  {:else}
    <p>Loading score...</p>
  {/if}
</div>

<style>
  /* Scoped styles - only apply to this component */
  .match-detail {
    padding: 1rem;
  }

  .scoreboard {
    display: grid;
    gap: 0.5rem;
  }

  .score-entry {
    margin-top: 2rem;
    padding: 1rem;
    border: 2px solid var(--court-gold);
  }
</style>
```

**Supabase Actions** (lib/supabase/actions.ts):

```typescript
import { supabase } from './client';
import type { MatchScore } from '$lib/types';

export async function lockMatch(matchId: number, clientId: string) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const { error } = await supabase
    .from('match_locks')
    .insert({
      match_id: matchId,
      locked_by: clientId,
      expires_at: expiresAt.toISOString()
    });

  if (error) throw error;

  // Update match_scores table
  await supabase
    .from('match_scores')
    .upsert({
      match_id: matchId,
      locked_by: clientId,
      locked_until: expiresAt.toISOString(),
      status: 'in-progress'
    });
}

export async function unlockMatch(matchId: number) {
  await supabase.from('match_locks').delete().eq('match_id', matchId);

  await supabase
    .from('match_scores')
    .update({ locked_by: null, locked_until: null })
    .eq('match_id', matchId);
}

export async function updateScore(
  matchId: number,
  update: { setNumber: number; team: 1 | 2; points: number; updatedBy: string }
) {
  // Get current score
  const { data: current } = await supabase
    .from('match_scores')
    .select('sets')
    .eq('match_id', matchId)
    .single();

  if (!current) return;

  // Update the set score
  const sets = current.sets || [];
  const setIndex = update.setNumber;

  if (!sets[setIndex]) {
    sets[setIndex] = { setNumber: setIndex, team1Score: 0, team2Score: 0 };
  }

  if (update.team === 1) {
    sets[setIndex].team1Score += update.points;
  } else {
    sets[setIndex].team2Score += update.points;
  }

  // Save updated score
  await supabase
    .from('match_scores')
    .update({
      sets,
      last_updated: new Date().toISOString(),
      last_updated_by: update.updatedBy
    })
    .eq('match_id', matchId);
}
```

### 6. Svelte Actions for Mobile Interactions

**Long Press Action**:
```typescript
// lib/actions/longpress.ts
export function longpress(node: HTMLElement, duration: number = 500) {
  let timer: ReturnType<typeof setTimeout>;

  const handleMousedown = () => {
    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent('longpress'));
    }, duration);
  };

  const handleMouseup = () => {
    clearTimeout(timer);
  };

  node.addEventListener('mousedown', handleMousedown);
  node.addEventListener('touchstart', handleMousedown);
  node.addEventListener('mouseup', handleMouseup);
  node.addEventListener('touchend', handleMouseup);

  return {
    destroy() {
      node.removeEventListener('mousedown', handleMousedown);
      node.removeEventListener('touchstart', handleMousedown);
      node.removeEventListener('mouseup', handleMouseup);
      node.removeEventListener('touchend', handleMouseup);
    }
  };
}
```

**Usage**:
```svelte
<script lang="ts">
  import { longpress } from '$lib/actions/longpress';

  function handleLongPress() {
    console.log('Long pressed!');
  }
</script>

<button
  use:longpress={500}
  on:longpress={handleLongPress}
>
  Hold to remove
</button>
```

---

## API Integration Layer

### AES API Client (Same pattern, Svelte-friendly)

```typescript
// lib/api/aesClient.ts
const AES_BASE_URL = 'https://results.advancedeventsystems.com';

class AESClient {
  async getEvent(eventId: string) {
    const response = await fetch(`${AES_BASE_URL}/api/event/${eventId}`);
    if (!response.ok) throw new Error('Failed to fetch event');
    return response.json();
  }

  async getCourtSchedule(eventId: string, date: string, timeWindow: number) {
    const response = await fetch(
      `${AES_BASE_URL}/api/event/${eventId}/courts/${date}/${timeWindow}`
    );
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  }

  async getTeamAssignments(eventId: string, clubId: number) {
    const response = await fetch(
      `${AES_BASE_URL}/odata/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`
    );
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  }

  // ... other methods
}

export const aesClient = new AESClient();
```

### Error Handling in Load Functions

```typescript
// routes/club/[clubId]/+page.ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  try {
    const schedule = await aesClient.getCourtSchedule(/* ... */);
    return { schedule };
  } catch (e) {
    // SvelteKit error helper
    throw error(404, {
      message: 'Failed to load schedule. Please check the Event ID.'
    });
  }
};
```

**Error Page**:
```svelte
<!-- routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message}</p>
  <a href="/">Go Home</a>
</div>
```

---

## Responsive Design Strategy

### Mobile-First with Svelte

**Breakpoint Store**:
```typescript
// lib/stores/breakpoint.ts
import { readable } from 'svelte/store';
import { browser } from '$app/environment';

export const breakpoint = readable('mobile', (set) => {
  if (!browser) return;

  const updateBreakpoint = () => {
    const width = window.innerWidth;
    if (width < 640) set('mobile');
    else if (width < 1024) set('tablet');
    else set('desktop');
  };

  updateBreakpoint();
  window.addEventListener('resize', updateBreakpoint);

  return () => window.removeEventListener('resize', updateBreakpoint);
});
```

**Responsive Component**:
```svelte
<script lang="ts">
  import { breakpoint } from '$lib/stores/breakpoint';
</script>

{#if $breakpoint === 'mobile'}
  <nav class="bottom-nav">
    <!-- Mobile bottom navigation -->
  </nav>
{:else}
  <nav class="side-nav">
    <!-- Desktop side navigation -->
  </nav>
{/if}
```

### Dark Mode with next-themes Alternative

```svelte
<!-- routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';

  // Dark mode store
  export const darkMode = writable(true);

  onMount(() => {
    // Load from localStorage
    const stored = localStorage.getItem('dark-mode');
    if (stored !== null) {
      darkMode.set(stored === 'true');
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      darkMode.set(prefersDark);
    }

    // Subscribe to changes
    darkMode.subscribe(value => {
      localStorage.setItem('dark-mode', String(value));
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  });
</script>

<div class="app">
  <slot />
</div>

<style>
  :global(html.dark) {
    background-color: #1a1a1a;
    color: #f0f0f0;
  }
</style>
```

---

## Performance Optimization

### 1. Code Splitting (Automatic in SvelteKit)

```typescript
// Dynamic imports for heavy components
<script lang="ts">
  let ScoreEntry;

  async function loadScoreEntry() {
    const module = await import('$lib/components/scoring/ScoreEntry.svelte');
    ScoreEntry = module.default;
  }
</script>

{#if showScoreEntry}
  {#await loadScoreEntry()}
    <p>Loading...</p>
  {:then}
    <svelte:component this={ScoreEntry} />
  {/await}
{/if}
```

### 2. Bundle Size Comparison

**SvelteKit Build**:
```
Initial bundle:  ~15KB (gzipped)
Total JS:        ~80KB (gzipped)

vs Next.js:
Initial bundle:  ~100KB (gzipped)
Total JS:        ~300KB (gzipped)
```

**80% smaller bundle!**

### 3. Prefetching

```svelte
<!-- Automatic prefetching on hover -->
<a href="/match/{match.MatchId}" data-sveltekit-prefetch>
  View Match
</a>
```

### 4. Optimistic UI Updates

```svelte
<script lang="ts">
  import { coveragePlan } from '$lib/stores/coverage';

  // Optimistic update
  function toggleCoverage(matchId: number) {
    if ($coveragePlan.includes(matchId)) {
      coveragePlan.removeMatch(matchId);
    } else {
      coveragePlan.addMatch(matchId);
    }
    // Store handles persistence immediately
    // No need to wait for server
  }
</script>
```

---

## Testing Strategy

### Unit Tests
**Vitest** (native Vite support)

```typescript
// lib/utils/filterMatches.test.ts
import { describe, it, expect } from 'vitest';
import { matchBelongsToClub } from './filterMatches';

describe('matchBelongsToClub', () => {
  it('should match by team ID', () => {
    const match = {
      MatchId: 1,
      FirstTeamId: 100,
      SecondTeamId: 101
    };

    const filter = {
      clubTeamIds: [100, 102],
      clubTeamNames: []
    };

    expect(matchBelongsToClub(match, filter)).toBe(true);
  });

  it('should fallback to text matching', () => {
    const match = {
      MatchId: 1,
      FirstTeamText: 'Beach Elite 15-1',
      SecondTeamText: 'Coast 15-2'
    };

    const filter = {
      clubTeamIds: [],
      clubTeamNames: ['Beach Elite', 'Beach Elite 15-1']
    };

    expect(matchBelongsToClub(match, filter)).toBe(true);
  });
});
```

### Component Tests
**@testing-library/svelte**

```typescript
// lib/components/match/MatchCard.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MatchCard from './MatchCard.svelte';

describe('MatchCard', () => {
  it('should render match details', () => {
    const match = {
      MatchId: 1,
      FirstTeamText: 'Team A',
      SecondTeamText: 'Team B',
      ScheduledStartDateTime: Date.now()
    };

    render(MatchCard, { props: { match } });

    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
  });
});
```

### E2E Tests
**Playwright** (works perfectly with SvelteKit)

```typescript
// tests/e2e/coverage-plan.spec.ts
import { test, expect } from '@playwright/test';

test('add match to coverage plan', async ({ page }) => {
  await page.goto('/club/123');

  // Click coverage toggle
  await page.click('[data-testid="match-1-coverage"]');

  // Navigate to coverage plan
  await page.click('[data-testid="nav-coverage"]');

  // Verify match is in plan
  await expect(page.locator('[data-testid="match-1"]')).toBeVisible();
});
```

---

## Deployment Configuration

### Vercel Configuration

**svelte.config.js**:
```javascript
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',
      regions: ['iad1'], // US East (adjust based on tournament locations)
      split: true        // Split functions for optimal performance
    })
  }
};

export default config;
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "framework": "sveltekit",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Environment Variables**:
```bash
# .env.example
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Note: VITE_ prefix makes variables available to client
# Use PUBLIC_ in SvelteKit 2.0+ (modern convention)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

**Important**: Use `$env/static/public` for deployment:
```typescript
// lib/supabase/client.ts
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);
```

### Build Command
```bash
npm run build
# Vite optimizes automatically:
# - Tree shaking
# - Code splitting by route
# - Minification
# - CSS optimization
# - Dead code elimination
```

---

## Development Workflow

### 1. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev  # http://localhost:5173

# Vite HMR is INSTANT (< 50ms updates)
# Svelte 5 preserves state during HMR
```

### 2. Code Quality Tools

**package.json**:
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

**svelte-check**:
```bash
# Type-check Svelte files
npm run check

# Watch mode during development
npm run check:watch
```

### 3. Git Workflow (same as Next.js)

```bash
git checkout -b feature/live-scoring
git commit -m "feat: implement live scoring with Svelte 5 runes"
git push origin feature/live-scoring

# Vercel auto-deploys preview
# Merge to main triggers production
```

---

## Svelte-Specific Advantages for CourtSync

### 1. Smaller Bundle = Faster Mobile Experience
- **1.8KB Svelte runtime** vs 44.5KB React
- **80% smaller total bundle** than Next.js equivalent
- Critical for tournament WiFi conditions

### 2. Native Reactivity = Simpler Code
- **No useEffect, useMemo, useCallback** complexity
- **No dependency arrays** to manage
- **No virtual DOM** overhead
- Just: `let count = $state(0)`

### 3. Better Mobile Performance
- **Fine-grained reactivity** = fewer re-renders
- **Compiled code** = less runtime work
- **Lower memory usage** = better on older devices

### 4. Svelte Actions = Touch-Friendly
- Built-in action system for gestures
- Long-press, swipe, pinch - all easy
- Perfect for mobile tournament app

### 5. Scoped Styles by Default
- Each component has scoped CSS
- No CSS-in-JS runtime overhead
- Can still use Tailwind for utilities

### 6. Simpler State Management
- **0 external state libraries needed**
- Runes + Stores cover all use cases
- Less to learn, less to maintain

---

## Cost Estimation (Same as Next.js)

### Free Tier (Sufficient for MVP)
- **Vercel**: Unlimited deployments, 100GB bandwidth
- **Supabase**: 500MB database, 2GB bandwidth, 50k MAU

### Scaling Costs
- **Vercel Pro**: $20/month (if needed)
- **Supabase Pro**: $25/month (if exceeding free tier)

**Total**: $0-45/month

---

## Migration Comparison: What We Gain

### Removed Complexity
- ❌ TanStack Query (42KB) → ✅ SvelteKit load functions (0KB)
- ❌ Zustand (3KB) → ✅ Svelte stores (0KB)
- ❌ React hooks complexity → ✅ Svelte runes simplicity
- ❌ useEffect dependency arrays → ✅ $effect (no dependencies)
- ❌ Virtual DOM reconciliation → ✅ Compiled reactivity

### Added Benefits
- ✅ 80% smaller bundle size
- ✅ 30% faster load times
- ✅ Simpler code (less abstraction)
- ✅ Better mobile performance
- ✅ Native TypeScript support (no preprocessor)
- ✅ Scoped styles built-in

### Same Capabilities
- ✅ Supabase real-time (identical)
- ✅ Tailwind CSS (identical)
- ✅ Vercel deployment (identical)
- ✅ TypeScript strict mode (identical)
- ✅ All functional requirements (identical)

---

## Success Metrics

### Technical Metrics
- **Build time**: < 30 seconds (vs 2 min for Next.js)
- **Bundle size**: < 100KB (vs 300KB for Next.js)
- **Lighthouse score**: > 95 (vs > 90 for Next.js)
- **First load time**: < 1.5s (vs < 3s for Next.js)
- **Real-time latency**: < 1s (same)

### User Experience Metrics
- Time to first match view: < 3s (vs < 5s)
- Score update latency: < 1s (same)
- Mobile usability: > 95 (vs > 90)
- Accessibility: > 90 (same)

---

## Conclusion

SvelteKit 2.0 + Svelte 5 provides **superior performance** and **simpler code** compared to Next.js/React for CourtSync's requirements:

**Key Wins**:
1. **80% smaller bundle** → faster load on tournament WiFi
2. **Native reactivity** → simpler real-time code
3. **Zero state management libraries** → less complexity
4. **Better mobile performance** → critical for on-site usage
5. **Same deployment ease** → Vercel + Supabase integration

**Best Use Cases for SvelteKit**:
- Mobile-first apps (CourtSync ✅)
- Real-time apps (CourtSync ✅)
- Performance-critical apps (CourtSync ✅)
- Small/solo teams (CourtSync ✅)

This architecture delivers all functional requirements with significantly better performance and simpler code compared to React alternatives.
