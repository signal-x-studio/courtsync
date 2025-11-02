# CourtSync - SvelteKit Implementation Plan

## Overview
Implement CourtSync volleyball tournament app using SvelteKit 2.0 + Svelte 5, Supabase for real-time scoring, and Tailwind CSS. This plan follows the architecture in `docs/sveltekit-architecture.md` and requirements in `docs/product-requirements.md`.

## Architecture Summary
- **Framework**: SvelteKit 2.0 + Svelte 5 (Runes)
- **State**: Svelte Stores (built-in, 0KB overhead)
- **Real-Time**: Supabase Realtime Database
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel with @sveltejs/adapter-vercel
- **Key Benefit**: 80% smaller bundle than React alternatives

---

## Documentation-First Development Workflow

**MANDATORY**: Before implementing ANY phase, step, feature, or running ANY command, you MUST follow this workflow:

### Pre-Implementation Checklist

For each implementation step, complete ALL of the following:

1. **Consult Official Documentation**
   - Check `guides/developer-documentation-references.md` for the relevant official docs link
   - Use WebSearch to find the most current official documentation if needed
   - Use WebFetch to extract specific syntax, examples, and best practices

2. **Verify Command Syntax**
   - Confirm the exact command syntax from official docs
   - Verify all flags, options, and arguments are correct
   - Check for version-specific changes or deprecations

3. **Review Official Examples**
   - Look for official examples in the documentation
   - Understand the recommended patterns and conventions
   - Note any gotchas or common mistakes mentioned

4. **Check Compatibility**
   - Verify the package/feature is compatible with our tech stack
   - Confirm version requirements are met
   - Check for any peer dependency requirements

5. **Document Your Work**
   - Add documentation references in code comments
   - Include relevant doc links in commit messages
   - Update guides if you discover important information

### Error Prevention

**Classes of Errors to Avoid**:

- **Command Syntax Errors**: Using incorrect flags, outdated commands, or wrong argument formats
  - Example: Using `npm create svelte@latest` instead of `npx sv create`
  - Prevention: Always check official CLI docs before running commands

- **Configuration Errors**: Using deprecated config options or incorrect structure
  - Example: Using JavaScript config when CSS-first is the v4 standard (Tailwind)
  - Prevention: Review official configuration guides

- **Version Incompatibility**: Using features from wrong versions or incompatible packages
  - Example: Using Svelte 4 syntax (`$:`) in Svelte 5 project
  - Prevention: Check version compatibility matrix in guides

- **Missing Dependencies**: Forgetting to install required peer dependencies
  - Prevention: Review package documentation for dependency requirements

### Documentation Reference Format

When implementing features, use this format in code:

```typescript
// Reference: [Official Doc URL]
// Purpose: [What this code does]
// Note: [Any version-specific or important considerations]

[Your implementation code]
```

**Example**:
```typescript
// Reference: https://svelte.dev/docs/svelte/what-are-runes
// Purpose: Create reactive state for match list
// Note: Svelte 5 runes replace Svelte 4's implicit reactivity
let matches = $state<Match[]>([]);
```

### Workflow for Each Phase

Before starting any phase:

1. **Read the phase requirements** in this plan
2. **Identify all technologies/commands** that will be used
3. **Look up official docs** for each technology in `guides/developer-documentation-references.md`
4. **WebFetch specific pages** to get exact syntax and examples
5. **Implement with verified information**
6. **Test the implementation**
7. **Document what you learned** (update guides if needed)

### Quick Reference

**Documentation Guide**: `guides/developer-documentation-references.md`

**Key Official Docs**:
- SvelteKit: https://svelte.dev/docs/kit
- Svelte 5: https://svelte.dev/docs/svelte/what-are-runes
- Tailwind v4: https://tailwindcss.com/blog/tailwindcss-v4
- Supabase: https://supabase.com/docs/reference/javascript/introduction
- Vitest: https://vitest.dev/guide/

**When in Doubt**: Search official docs first. Never guess syntax or assume features exist.

---

## Phase 1: Project Initialization & Configuration

**BEFORE STARTING**: Review the following official documentation:
- SvelteKit CLI: https://svelte.dev/docs/cli/sv-create
- Tailwind CSS v4 Installation: https://tailwindcss.com/blog/tailwindcss-v4
- Vercel Adapter: https://svelte.dev/docs/kit/adapter-vercel
- Vitest Configuration: https://vitest.dev/guide/

### 1.1 Initialize SvelteKit Project

**Documentation Reference**: https://svelte.dev/docs/cli/sv-create

```bash
# Use the official sv CLI (replaces create-svelte)
npx sv create --template minimal --types ts

# The command will prompt for add-ons (prettier, eslint, vitest, playwright, tailwindcss)
# Select: prettier, eslint, vitest (we'll configure tailwindcss manually later)

# Install dependencies
npm install
```

**Note**: The `sv` CLI replaces the previous `create-svelte` tool. Use `--template minimal` for a barebones scaffold, `--types ts` for TypeScript support.

### 1.2 Install Core Dependencies

**Documentation References**:
- Supabase: https://supabase.com/docs/reference/javascript/introduction
- Tailwind v4: https://tailwindcss.com/blog/tailwindcss-v4
- Vercel Adapter: https://svelte.dev/docs/kit/adapter-vercel
- date-fns: https://date-fns.org/docs/Getting-Started

```bash
# Supabase client
npm install @supabase/supabase-js

# Tailwind CSS v4
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Vercel adapter
npm install -D @sveltejs/adapter-vercel

# Date utilities (for formatting)
npm install date-fns
```

### 1.3 Configure SvelteKit for Vercel

**Documentation Reference**: https://svelte.dev/docs/kit/adapter-vercel

**File**: `svelte.config.js`
```javascript
// Reference: https://svelte.dev/docs/kit/adapter-vercel
// Purpose: Configure SvelteKit to deploy on Vercel with route splitting
// Note: runtime 'nodejs20.x' is stable; 'nodejs22.x' also available
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',
      split: true
    })
  }
};

export default config;
```

### 1.4 Configure Tailwind CSS

**Documentation Reference**: https://tailwindcss.com/blog/tailwindcss-v4

**File**: `tailwind.config.ts`
```typescript
// Reference: https://tailwindcss.com/blog/tailwindcss-v4
// Purpose: Configure Tailwind CSS v4 with custom color palette for CourtSync
// Note: v4 supports CSS-first config, but TypeScript config still works
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'court-dark': '#1a1a1a',
        'court-charcoal': '#2d2d2d',
        'court-gold': '#d4af37',
        'court-gold-dark': '#b8941f'
      }
    }
  }
} satisfies Config;
```

### 1.5 Configure TypeScript

**Documentation Reference**: https://www.typescriptlang.org/tsconfig

**File**: `tsconfig.json`
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

**Note**: Strict mode is enabled to catch type errors early and ensure type safety throughout the codebase.

### 1.6 Setup Environment Variables

**Documentation Reference**: https://supabase.com/docs/reference/javascript/introduction

**File**: `.env.example`
```bash
# Supabase connection details
# Reference: https://supabase.com/docs/reference/javascript/introduction
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**File**: `.env` (gitignored)
```bash
# Copy from .env.example and fill in real values
```

**Note**: In SvelteKit, variables prefixed with `PUBLIC_` are exposed to the browser. The `SUPABASE_ANON_KEY` is safe to expose as it's used client-side with Row-Level Security (RLS).

### 1.7 Create .gitignore
**File**: `.gitignore`
```
.DS_Store
node_modules
/build
/.svelte-kit
/package
.env
.env.*
!.env.example
.vercel
.vercel_build_output
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
```

### 1.8 Configure Vitest

**Documentation Reference**: https://vitest.dev/config/

**File**: `vite.config.ts`
```typescript
// Reference: https://vitest.dev/config/
// Purpose: Configure Vitest for unit testing with SvelteKit integration
// Note: SvelteKit plugin must be included for proper component testing
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
```

### 1.9 Initialize Git Repository and Create Initial Commit
```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "chore: initial SvelteKit project setup

- Initialize SvelteKit 2.0 with TypeScript
- Configure Tailwind CSS v4
- Setup Vercel adapter
- Configure strict TypeScript
- Add Vitest for testing
- Create .gitignore and .env.example

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Add remote repository
git remote add origin git@github.com:signal-x-studio/courtsync-v2.git

# Create main branch (if not already on main)
git branch -M main

# Push to remote
git push -u origin main
```

**Note**: Ensure you have SSH keys configured for GitHub before pushing. If you need to set up SSH keys, follow [GitHub's SSH key documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

---

## Phase 2: Type Definitions & Core Utilities

### 2.1 Create AES API Types
**File**: `src/lib/types/aes.ts`
```typescript
export interface Match {
  MatchId: number;
  Division: {
    DivisionId: number;
    Name: string;
    ColorHex: string;
  };
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
}

export interface TeamAssignment {
  TeamId: number;
  TeamName: string;
  TeamCode: string;
  ClubId: number;
  ClubName: string;
  DivisionId: number;
  DivisionName: string;
}

export interface EventInfo {
  EventId: string;
  Name: string;
  StartDate: number;
  EndDate: number;
  Clubs: Array<{ ClubId: number; Name: string }>;
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

export interface TeamSchedule {
  Current: Match[];
  Work: Match[];
  Future: Match[];
  Past: Match[];
}

export interface PoolStandings {
  PoolId: number;
  PoolName: string;
  Teams: Array<{
    TeamId: number;
    TeamName: string;
    Wins: number;
    Losses: number;
    PointsFor: number;
    PointsAgainst: number;
  }>;
}
```

### 2.2 Create Supabase Types
**File**: `src/lib/types/supabase.ts`
```typescript
export interface MatchScore {
  match_id: number;
  event_id: string;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
  locked_by: string | null;
  locked_until: string | null;
  last_updated: string;
  last_updated_by: string | null;
}

export interface SetScore {
  setNumber: number;
  team1Score: number;
  team2Score: number;
  completedAt?: string;
}

export interface MatchLock {
  match_id: number;
  locked_by: string;
  locked_at: string;
  expires_at: string;
}
```

### 2.3 Create App Types
**File**: `src/lib/types/app.ts`
```typescript
import type { Match } from './aes';

export type Persona = 'media' | 'spectator';

export interface MatchFilter {
  clubTeamIds: number[];
  clubTeamNames: string[];
  divisionIds?: number[];
  favoriteTeamIds?: number[];
}

export interface TimeBlock {
  time: string;
  timestamp: number;
  matches: Match[];
}

export interface CoverageStats {
  totalMatches: number;
  conflicts: number;
  teamsCovered: number;
  totalTeams: number;
  coveredTeamIds: number[];
  uncoveredTeamIds: number[];
}
```

### 2.4 Create Filtering Utilities
**File**: `src/lib/utils/filterMatches.ts`
```typescript
import type { Match, MatchFilter, TimeBlock } from '$lib/types';

export function matchBelongsToClub(match: Match, filter: MatchFilter): boolean {
  const matchTeamIds = [
    match.FirstTeamId,
    match.SecondTeamId,
    match.WorkTeamId
  ].filter((id): id is number => id !== undefined && id !== null);

  if (matchTeamIds.length > 0) {
    return matchTeamIds.some(id => filter.clubTeamIds.includes(id));
  }

  const matchTeamTexts = [
    match.FirstTeamText,
    match.SecondTeamText,
    match.WorkTeamText
  ].filter((text): text is string => Boolean(text));

  return matchTeamTexts.some(text =>
    filter.clubTeamNames.some(name => text.includes(name))
  );
}

export function groupMatchesByTime(matches: Match[]): TimeBlock[] {
  const grouped = new Map<number, Match[]>();

  matches.forEach(match => {
    const time = match.ScheduledStartDateTime;
    if (!grouped.has(time)) {
      grouped.set(time, []);
    }
    grouped.get(time)!.push(match);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, matches]) => ({
      time: new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }),
      timestamp,
      matches
    }));
}

export function detectConflicts(matches: Match[]): Set<number> {
  const conflicts = new Set<number>();

  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      const m1 = matches[i];
      const m2 = matches[j];

      if (
        m1.ScheduledStartDateTime < m2.ScheduledEndDateTime &&
        m2.ScheduledStartDateTime < m1.ScheduledEndDateTime
      ) {
        conflicts.add(m1.MatchId);
        conflicts.add(m2.MatchId);
      }
    }
  }

  return conflicts;
}

export function getMatchStatus(match: Match): 'upcoming' | 'live' | 'completed' {
  const now = Date.now();
  if (match.HasOutcome) return 'completed';
  if (match.ScheduledStartDateTime <= now && match.ScheduledEndDateTime >= now) {
    return 'live';
  }
  return 'upcoming';
}
```

---

## Phase 3: API Integration Layer

### 3.1 Create AES API Client
**File**: `src/lib/api/aesClient.ts`
```typescript
import type { EventInfo, CourtSchedule, TeamAssignment, Match } from '$lib/types/aes';

const AES_BASE_URL = 'https://results.advancedeventsystems.com';

class AESClient {
  async getEvent(eventId: string): Promise<EventInfo> {
    const response = await fetch(`${AES_BASE_URL}/api/event/${eventId}`);
    if (!response.ok) throw new Error('Failed to fetch event');
    return response.json();
  }

  async getCourtSchedule(
    eventId: string,
    date: string,
    timeWindow: number = 1440
  ): Promise<CourtSchedule> {
    const response = await fetch(
      `${AES_BASE_URL}/api/event/${eventId}/courts/${date}/${timeWindow}`
    );
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  }

  async getTeamAssignments(eventId: string, clubId: number): Promise<TeamAssignment[]> {
    const response = await fetch(
      `${AES_BASE_URL}/odata/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`
    );
    if (!response.ok) throw new Error('Failed to fetch teams');
    const data = await response.json();
    return data.value || [];
  }

  async getTeamSchedule(
    eventId: string,
    divisionId: number,
    teamId: number,
    scheduleType: 'current' | 'work' | 'future' | 'past'
  ): Promise<Match[]> {
    const response = await fetch(
      `${AES_BASE_URL}/api/event/${eventId}/division/${divisionId}/team/${teamId}/schedule/${scheduleType}`
    );
    if (!response.ok) throw new Error('Failed to fetch team schedule');
    return response.json();
  }

  async getDivisionPlays(eventId: string, divisionId: number): Promise<any> {
    const response = await fetch(
      `${AES_BASE_URL}/api/event/${eventId}/division/${divisionId}/plays`
    );
    if (!response.ok) throw new Error('Failed to fetch division plays');
    return response.json();
  }

  async getPoolSheet(eventId: string, playId: number): Promise<any> {
    const response = await fetch(
      `${AES_BASE_URL}/api/event/${eventId}/poolsheet/${playId}`
    );
    if (!response.ok) throw new Error('Failed to fetch pool sheet');
    return response.json();
  }

  async getTeamRoster(
    eventId: string,
    divisionId: number,
    teamId: number
  ): Promise<any[]> {
    const response = await fetch(
      `${AES_BASE_URL}/api/event/${eventId}/division/${divisionId}/team/${teamId}/roster`
    );
    if (!response.ok) throw new Error('Failed to fetch roster');
    return response.json();
  }
}

export const aesClient = new AESClient();
```

### 3.2 Create Supabase Client
**File**: `src/lib/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
```

### 3.3 Create Supabase Actions
**File**: `src/lib/supabase/actions.ts`
```typescript
import { supabase } from './client';
import type { MatchScore } from '$lib/types/supabase';

export async function lockMatch(
  matchId: number,
  clientId: string,
  eventId: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const { error: lockError } = await supabase
    .from('match_locks')
    .insert({
      match_id: matchId,
      locked_by: clientId,
      expires_at: expiresAt.toISOString()
    });

  if (lockError) throw lockError;

  await supabase
    .from('match_scores')
    .upsert({
      match_id: matchId,
      event_id: eventId,
      locked_by: clientId,
      locked_until: expiresAt.toISOString(),
      status: 'in-progress',
      sets: []
    });
}

export async function unlockMatch(matchId: number): Promise<void> {
  await supabase.from('match_locks').delete().eq('match_id', matchId);
  await supabase
    .from('match_scores')
    .update({ locked_by: null, locked_until: null })
    .eq('match_id', matchId);
}

export async function updateScore(
  matchId: number,
  setNumber: number,
  team: 1 | 2,
  points: number,
  clientId: string
): Promise<void> {
  const { data: current } = await supabase
    .from('match_scores')
    .select('sets')
    .eq('match_id', matchId)
    .single();

  if (!current) return;

  const sets = current.sets || [];
  if (!sets[setNumber]) {
    sets[setNumber] = { setNumber, team1Score: 0, team2Score: 0 };
  }

  if (team === 1) {
    sets[setNumber].team1Score = Math.max(0, sets[setNumber].team1Score + points);
  } else {
    sets[setNumber].team2Score = Math.max(0, sets[setNumber].team2Score + points);
  }

  await supabase
    .from('match_scores')
    .update({
      sets,
      last_updated: new Date().toISOString(),
      last_updated_by: clientId
    })
    .eq('match_id', matchId);
}

export async function getMatchScore(matchId: number): Promise<MatchScore | null> {
  const { data } = await supabase
    .from('match_scores')
    .select('*')
    .eq('match_id', matchId)
    .single();

  return data;
}
```

---

## Phase 4: Svelte Stores (State Management)

### 4.1 Create Event Store
**File**: `src/lib/stores/event.ts`
```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const DEFAULT_EVENT_ID = 'PTAwMDAwNDEzMTQ90';

function createEventStore() {
  const stored = browser ? localStorage.getItem('current-event-id') : null;
  const initial = stored || DEFAULT_EVENT_ID;

  const { subscribe, set } = writable<string>(initial);

  return {
    subscribe,
    set: (value: string) => {
      if (browser) localStorage.setItem('current-event-id', value);
      set(value);
    }
  };
}

export const eventId = createEventStore();
```

### 4.2 Create Client ID Store
**File**: `src/lib/stores/clientId.ts`
```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createClientIdStore() {
  const stored = browser ? localStorage.getItem('client-id') : null;
  const initial = stored || (browser ? crypto.randomUUID() : '');

  if (browser && !stored) {
    localStorage.setItem('client-id', initial);
  }

  const { subscribe } = writable<string>(initial);

  return { subscribe };
}

export const clientId = createClientIdStore();
```

### 4.3 Create Coverage Plan Store
**File**: `src/lib/stores/coverage.ts`
```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createCoverageStore() {
  const stored = browser ? localStorage.getItem('coverage-plan') : null;
  const initial: number[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<number[]>(initial);

  return {
    subscribe,
    addMatch: (matchId: number) => update(ids => {
      if (ids.includes(matchId)) return ids;
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

### 4.4 Create Favorites Store
**File**: `src/lib/stores/favorites.ts`
```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createFavoritesStore() {
  const stored = browser ? localStorage.getItem('favorite-teams') : null;
  const initial: number[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<number[]>(initial);

  return {
    subscribe,
    addTeam: (teamId: number) => update(ids => {
      if (ids.includes(teamId)) return ids;
      const updated = [...ids, teamId];
      if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
      return updated;
    }),
    removeTeam: (teamId: number) => update(ids => {
      const updated = ids.filter(id => id !== teamId);
      if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
      return updated;
    }),
    toggleTeam: (teamId: number) => update(ids => {
      const updated = ids.includes(teamId)
        ? ids.filter(id => id !== teamId)
        : [...ids, teamId];
      if (browser) localStorage.setItem('favorite-teams', JSON.stringify(updated));
      return updated;
    }),
    clear: () => {
      if (browser) localStorage.removeItem('favorite-teams');
      set([]);
    }
  };
}

export const favoriteTeams = createFavoritesStore();
```

### 4.5 Create Persona Store
**File**: `src/lib/stores/persona.ts`
```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Persona } from '$lib/types/app';

function createPersonaStore() {
  const stored = browser ? localStorage.getItem('persona') : null;
  const initial: Persona = (stored as Persona) || 'spectator';

  const { subscribe, set } = writable<Persona>(initial);

  return {
    subscribe,
    set: (value: Persona) => {
      if (browser) localStorage.setItem('persona', value);
      set(value);
    }
  };
}

export const persona = createPersonaStore();
```

### 4.6 Create Filters Store
**File**: `src/lib/stores/filters.ts`
```typescript
import { writable } from 'svelte/store';

interface Filters {
  divisionIds: number[];
  teamIds: number[];
  showOnlyUncovered: boolean;
}

function createFiltersStore() {
  const { subscribe, set, update } = writable<Filters>({
    divisionIds: [],
    teamIds: [],
    showOnlyUncovered: false
  });

  return {
    subscribe,
    setDivisions: (divisionIds: number[]) => update(f => ({ ...f, divisionIds })),
    setTeams: (teamIds: number[]) => update(f => ({ ...f, teamIds })),
    setShowOnlyUncovered: (value: boolean) => update(f => ({ ...f, showOnlyUncovered: value })),
    clear: () => set({ divisionIds: [], teamIds: [], showOnlyUncovered: false }),
    reset: () => set({ divisionIds: [], teamIds: [], showOnlyUncovered: false })
  };
}

export const filters = createFiltersStore();
```

### 4.7 Create Live Score Store Factory
**File**: `src/lib/stores/liveScore.ts`
```typescript
import { readable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';
import type { MatchScore } from '$lib/types/supabase';

export function liveScore(matchId: number) {
  return readable<MatchScore | null>(null, (set) => {
    // Fetch initial score
    supabase
      .from('match_scores')
      .select('*')
      .eq('match_id', matchId)
      .single()
      .then(({ data }) => set(data))
      .catch(() => set(null));

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

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  });
}
```

---

## Phase 5: UI Components

### 5.1 Create Loading Skeleton
**File**: `src/lib/components/ui/MatchCardSkeleton.svelte`
```svelte
<div class="match-card bg-court-charcoal rounded-lg p-4 animate-pulse">
  <div class="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
  <div class="space-y-2">
    <div class="h-6 bg-gray-700 rounded w-3/4"></div>
    <div class="h-4 bg-gray-700 rounded w-16"></div>
    <div class="h-6 bg-gray-700 rounded w-2/3"></div>
  </div>
  <div class="h-3 bg-gray-700 rounded w-1/2 mt-3"></div>
</div>
```

### 5.2 Create Match Card Component
**File**: `src/lib/components/match/MatchCard.svelte`
```svelte
<script lang="ts">
  import type { Match } from '$lib/types/aes';
  import { coveragePlan } from '$lib/stores/coverage';
  import { favoriteTeams } from '$lib/stores/favorites';
  import { persona } from '$lib/stores/persona';
  import { getMatchStatus } from '$lib/utils/filterMatches';
  import { format } from 'date-fns';

  export let match: Match;
  export let showCoverageToggle = false;
  export let isConflict = false;

  // Use $derived for Svelte 5 reactivity
  let isInCoverage = $derived($coveragePlan.includes(match.MatchId));
  let isTeam1Favorite = $derived(
    match.FirstTeamId ? $favoriteTeams.includes(match.FirstTeamId) : false
  );
  let isTeam2Favorite = $derived(
    match.SecondTeamId ? $favoriteTeams.includes(match.SecondTeamId) : false
  );
  let status = $derived(getMatchStatus(match));

  function toggleCoverage() {
    if (isInCoverage) {
      coveragePlan.removeMatch(match.MatchId);
    } else {
      coveragePlan.addMatch(match.MatchId);
    }
  }

  function formatTime(timestamp: number): string {
    return format(timestamp, 'h:mm a');
  }
</script>

<div
  class="match-card bg-court-charcoal rounded-lg p-4 border-2 transition-colors"
  class:border-red-500={isConflict}
  class:border-court-gold={isInCoverage && !isConflict}
  class:border-gray-700={!isConflict && !isInCoverage}
>
  <div class="flex justify-between items-start mb-2">
    <div class="text-sm text-gray-400">
      {formatTime(match.ScheduledStartDateTime)}
      {#if match.CourtName}
        • {match.CourtName}
      {/if}
      {#if status === 'live'}
        <span class="ml-2 text-red-400 font-semibold">🔴 LIVE</span>
      {/if}
    </div>
    {#if showCoverageToggle && $persona === 'media'}
      <button
        on:click={toggleCoverage}
        class="text-xs px-2 py-1 rounded transition-colors"
        class:bg-court-gold={isInCoverage}
        class:text-court-dark={isInCoverage}
        class:bg-gray-700={!isInCoverage}
        class:text-gray-300={!isInCoverage}
        aria-label={isInCoverage ? 'Remove from coverage plan' : 'Add to coverage plan'}
      >
        {isInCoverage ? '✓ Coverage' : '+ Coverage'}
      </button>
    {/if}
  </div>

  <a
    href="/match/{match.MatchId}"
    class="block hover:opacity-80 transition-opacity"
    aria-label="View match details for {match.FirstTeamText} vs {match.SecondTeamText}"
  >
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        {#if isTeam1Favorite}
          <span class="text-court-gold" aria-label="Favorited team">★</span>
        {/if}
        <span class="font-semibold">{match.FirstTeamText}</span>
      </div>
      <div class="text-gray-400 text-sm">vs</div>
      <div class="flex items-center gap-2">
        {#if isTeam2Favorite}
          <span class="text-court-gold" aria-label="Favorited team">★</span>
        {/if}
        <span class="font-semibold">{match.SecondTeamText}</span>
      </div>
    </div>

    <div class="mt-2 text-xs text-gray-500">
      {match.Division.Name}
    </div>
  </a>

  {#if isConflict}
    <div class="mt-2 text-xs text-red-400">
      ⚠️ Conflict with another match
    </div>
  {/if}
</div>
```

### 5.3 Create Time Block Component
**File**: `src/lib/components/match/TimeBlock.svelte`
```svelte
<script lang="ts">
  import type { TimeBlock } from '$lib/types/app';
  import MatchCard from './MatchCard.svelte';

  export let block: TimeBlock;
  export let conflicts: Set<number>;
  export let showCoverageToggle = false;

  let expanded = $state(true); // Default expanded for better UX
</script>

<div class="time-block mb-4">
  <button
    on:click={() => expanded = !expanded}
    class="w-full flex justify-between items-center bg-court-charcoal p-4 rounded-t-lg hover:bg-gray-800 transition-colors"
    aria-expanded={expanded}
    aria-label="{expanded ? 'Collapse' : 'Expand'} matches at {block.time}"
  >
    <div class="flex items-center gap-4">
      <span class="text-lg font-semibold text-court-gold">{block.time}</span>
      <span class="text-sm text-gray-400">
        {block.matches.length} {block.matches.length === 1 ? 'match' : 'matches'}
      </span>
    </div>
    <span class="text-gray-400 transition-transform duration-200" class:rotate-180={expanded}>
      ▼
    </span>
  </button>

  {#if expanded}
    <div class="grid gap-3 p-4 bg-court-dark rounded-b-lg">
      {#each block.matches as match (match.MatchId)}
        <MatchCard
          {match}
          isConflict={conflicts.has(match.MatchId)}
          {showCoverageToggle}
        />
      {/each}
    </div>
  {/if}
</div>
```

### 5.4 Create Bottom Navigation
**File**: `src/lib/components/navigation/BottomNav.svelte`
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { persona } from '$lib/stores/persona';
  import { filters } from '$lib/stores/filters';

  let currentPath = $derived($page.url.pathname);
  let isMedia = $derived($persona === 'media');
  let hasActiveFilters = $derived(
    $filters.divisionIds.length > 0 ||
    $filters.teamIds.length > 0 ||
    $filters.showOnlyUncovered
  );
</script>

<nav
  class="fixed bottom-0 left-0 right-0 bg-court-charcoal border-t border-gray-800 md:relative md:border-0 z-50"
  aria-label="Main navigation"
>
  <div class="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
    <a
      href="/club"
      class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px]"
      class:text-court-gold={currentPath.includes('/club')}
      class:text-gray-400={!currentPath.includes('/club')}
      aria-label="All Matches"
      aria-current={currentPath.includes('/club') ? 'page' : undefined}
    >
      <span class="text-xl" aria-hidden="true">📋</span>
      <span class="text-xs">All Matches</span>
    </a>

    <a
      href="/my-teams"
      class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px]"
      class:text-court-gold={currentPath.includes('/my-teams')}
      class:text-gray-400={!currentPath.includes('/my-teams')}
      aria-label="My Teams"
      aria-current={currentPath.includes('/my-teams') ? 'page' : undefined}
    >
      <span class="text-xl" aria-hidden="true">⭐</span>
      <span class="text-xs">My Teams</span>
    </a>

    {#if isMedia}
      <a
        href="/coverage"
        class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px]"
        class:text-court-gold={currentPath.includes('/coverage')}
        class:text-gray-400={!currentPath.includes('/coverage')}
        aria-label="Coverage Plan"
        aria-current={currentPath.includes('/coverage') ? 'page' : undefined}
      >
        <span class="text-xl" aria-hidden="true">📷</span>
        <span class="text-xs">Coverage</span>
      </a>
    {/if}

    <a
      href="/filters"
      class="flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[60px] relative"
      class:text-court-gold={currentPath.includes('/filters')}
      class:text-gray-400={!currentPath.includes('/filters')}
      aria-label="Filters{hasActiveFilters ? ' (active)' : ''}"
      aria-current={currentPath.includes('/filters') ? 'page' : undefined}
    >
      <span class="text-xl" aria-hidden="true">🔍</span>
      <span class="text-xs">Filters</span>
      {#if hasActiveFilters}
        <span class="absolute top-1 right-2 w-2 h-2 bg-court-gold rounded-full" aria-hidden="true"></span>
      {/if}
    </a>
  </div>
</nav>
```

### 5.5 Create Error Boundary
**File**: `src/lib/components/ui/ErrorBoundary.svelte`
```svelte
<script lang="ts">
  export let error: string = '';
  export let retry: (() => void) | null = null;
</script>

{#if error}
  <div class="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center" role="alert">
    <p class="text-red-400 mb-4">{error}</p>
    {#if retry}
      <button
        on:click={retry}
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    {/if}
  </div>
{:else}
  <slot />
{/if}
```

---

## Phase 6: Routes & Pages

### 6.1 Root Layout
**File**: `src/routes/+layout.svelte`
```svelte
<script lang="ts">
  import '../app.css';
  import BottomNav from '$lib/components/navigation/BottomNav.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let showNav = $derived(!$page.url.pathname.startsWith('/match/'));

  onMount(() => {
    // Apply dark mode by default
    document.documentElement.classList.add('dark');
  });
</script>

<svelte:head>
  <title>CourtSync - Volleyball Tournament Scheduling</title>
  <meta name="description" content="Track volleyball tournament matches and live scores in real-time" />
  <meta property="og:title" content="CourtSync" />
  <meta property="og:description" content="Volleyball tournament scheduling and live scoring app" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-court-dark text-gray-100">
  <main class="pb-20 md:pb-0">
    <slot />
  </main>
  {#if showNav}
    <BottomNav />
  {/if}
</div>
```

**File**: `src/app.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html.dark {
    @apply bg-court-dark text-gray-100;
  }

  body {
    @apply antialiased;
  }
}

@layer utilities {
  .touch-target {
    @apply min-h-[44px] min-w-[44px];
  }
}
```

### 6.2 Event/Club Selection Page
**File**: `src/routes/+page.svelte`
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventId as eventIdStore } from '$lib/stores/event';

  let eventId = $state($eventIdStore);
  let loading = $state(false);
  let error = $state('');

  function loadEvent() {
    if (!eventId.trim()) {
      error = 'Please enter an Event ID';
      return;
    }

    loading = true;
    error = '';

    // Save to store
    eventIdStore.set(eventId);

    // Navigate to club selection
    goto(`/club-selection`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      loadEvent();
    }
  }
</script>

<div class="max-w-md mx-auto p-6 mt-20">
  <h1 class="text-3xl font-bold text-court-gold mb-2 text-center">
    CourtSync
  </h1>
  <p class="text-center text-gray-400 mb-8">
    Volleyball Tournament Scheduling
  </p>

  <div class="space-y-4">
    <div>
      <label for="eventId" class="block text-sm font-medium mb-2">
        Event ID
      </label>
      <input
        id="eventId"
        type="text"
        bind:value={eventId}
        on:keydown={handleKeydown}
        placeholder="Enter Event ID"
        class="w-full px-4 py-3 bg-court-charcoal border border-gray-700 rounded-lg focus:outline-none focus:border-court-gold touch-target"
        aria-describedby={error ? 'error-message' : undefined}
      />
    </div>

    {#if error}
      <p id="error-message" class="text-red-400 text-sm" role="alert">{error}</p>
    {/if}

    <button
      on:click={loadEvent}
      disabled={loading}
      class="w-full py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark transition-colors disabled:opacity-50 touch-target"
    >
      {loading ? 'Loading...' : 'Load Event'}
    </button>
  </div>

  <div class="mt-8 text-center text-sm text-gray-500">
    <p>Default Event ID:</p>
    <code class="text-xs bg-court-charcoal px-2 py-1 rounded">PTAwMDAwNDEzMTQ90</code>
  </div>
</div>
```

### 6.3 Club Selection Page
**File**: `src/routes/club-selection/+page.ts`
```typescript
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { eventId } from '$lib/stores/event';

export const load: PageLoad = async () => {
  const currentEventId = get(eventId);

  try {
    const event = await aesClient.getEvent(currentEventId);
    return {
      event,
      eventId: currentEventId
    };
  } catch (e) {
    throw error(404, 'Failed to load event. Please check the Event ID.');
  }
};
```

**File**: `src/routes/club-selection/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  export let data: PageData;

  let searchQuery = $state('');

  let filteredClubs = $derived(
    data.event.Clubs.filter(club =>
      club.Name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function selectClub(clubId: number) {
    goto(`/club/${clubId}`);
  }
</script>

<div class="max-w-2xl mx-auto p-6">
  <div class="mb-6">
    <a href="/" class="text-court-gold hover:underline text-sm">← Change Event</a>
    <h1 class="text-2xl font-bold text-court-gold mt-2">
      {data.event.Name}
    </h1>
    <p class="text-sm text-gray-400">
      Select a club to view matches
    </p>
  </div>

  <div class="mb-4">
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search clubs..."
      class="w-full px-4 py-3 bg-court-charcoal border border-gray-700 rounded-lg focus:outline-none focus:border-court-gold"
      aria-label="Search clubs"
    />
  </div>

  <div class="space-y-2">
    {#each filteredClubs as club (club.ClubId)}
      <button
        on:click={() => selectClub(club.ClubId)}
        class="w-full text-left px-4 py-4 bg-court-charcoal rounded-lg hover:bg-gray-800 transition-colors border border-gray-700 hover:border-court-gold touch-target"
      >
        <span class="font-semibold">{club.Name}</span>
      </button>
    {:else}
      <p class="text-gray-400 text-center py-8">No clubs found</p>
    {/each}
  </div>
</div>
```

### 6.4 Club Match Hub (Main View)
**File**: `src/routes/club/[clubId]/+page.ts`
```typescript
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { eventId } from '$lib/stores/event';

export const load: PageLoad = async ({ params }) => {
  const currentEventId = get(eventId);
  const clubId = parseInt(params.clubId);

  try {
    const today = new Date().toISOString().split('T')[0];

    const [teams, schedule] = await Promise.all([
      aesClient.getTeamAssignments(currentEventId, clubId),
      aesClient.getCourtSchedule(currentEventId, today, 1440)
    ]);

    return {
      eventId: currentEventId,
      clubId,
      teams,
      schedule,
      date: today
    };
  } catch (e) {
    throw error(500, 'Failed to load club data');
  }
};
```

**File**: `src/routes/club/[clubId]/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import TimeBlock from '$lib/components/match/TimeBlock.svelte';
  import MatchCard from '$lib/components/match/MatchCard.svelte';
  import MatchCardSkeleton from '$lib/components/ui/MatchCardSkeleton.svelte';
  import { matchBelongsToClub, groupMatchesByTime, detectConflicts } from '$lib/utils/filterMatches';
  import { persona } from '$lib/stores/persona';
  import { filters } from '$lib/stores/filters';
  import { coveragePlan } from '$lib/stores/coverage';

  export let data: PageData;

  // Create filter from club teams
  let filter = $derived({
    clubTeamIds: data.teams.map(t => t.TeamId),
    clubTeamNames: data.teams.map(t => t.TeamName)
  });

  // Filter matches for this club
  let allMatches = $derived(
    data.schedule.CourtSchedules.flatMap(court =>
      court.CourtMatches.map(match => ({ ...match, CourtName: court.Name }))
    )
  );

  let clubMatches = $derived(
    allMatches.filter(m => matchBelongsToClub(m, filter))
  );

  // Apply active filters
  let filteredMatches = $derived(
    clubMatches.filter(match => {
      // Division filter
      if ($filters.divisionIds.length > 0) {
        if (!$filters.divisionIds.includes(match.Division.DivisionId)) {
          return false;
        }
      }

      // Team filter
      if ($filters.teamIds.length > 0) {
        const matchTeamIds = [match.FirstTeamId, match.SecondTeamId].filter(Boolean);
        if (!matchTeamIds.some(id => $filters.teamIds.includes(id!))) {
          return false;
        }
      }

      // Show only uncovered (media persona)
      if ($filters.showOnlyUncovered && $persona === 'media') {
        const matchTeamIds = [match.FirstTeamId, match.SecondTeamId].filter(Boolean);
        const isAnyCovered = matchTeamIds.some(id =>
          data.teams.some(t =>
            t.TeamId === id &&
            clubMatches.some(m =>
              $coveragePlan.includes(m.MatchId) &&
              (m.FirstTeamId === id || m.SecondTeamId === id)
            )
          )
        );
        if (isAnyCovered) return false;
      }

      return true;
    })
  );

  // Group by time
  let timeBlocks = $derived(groupMatchesByTime(filteredMatches));

  // Detect conflicts
  let conflicts = $derived(detectConflicts(filteredMatches));

  // Live matches
  let now = $state(Date.now());
  let liveMatches = $derived(
    filteredMatches.filter(
      m => m.ScheduledStartDateTime <= now && m.ScheduledEndDateTime >= now
    )
  );

  // Update current time every minute
  $effect(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 60000);

    return () => clearInterval(interval);
  });
</script>

<div class="max-w-screen-xl mx-auto p-4">
  <div class="mb-6 flex justify-between items-start">
    <div>
      <a href="/club-selection" class="text-court-gold hover:underline text-sm">
        ← Change Club
      </a>
      <h1 class="text-2xl font-bold text-court-gold mt-2">
        Club Matches
      </h1>
      <p class="text-gray-400 text-sm">
        {filteredMatches.length} matches • {data.teams.length} teams
        {#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
          <span class="text-court-gold">• Filtered</span>
        {/if}
      </p>
    </div>

    <a
      href="/filters"
      class="px-4 py-2 bg-court-charcoal rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
    >
      🔍 Filters
    </a>
  </div>

  {#if liveMatches.length > 0}
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-3 text-red-400">🔴 Live Now</h2>
      <div class="grid gap-3">
        {#each liveMatches as match (match.MatchId)}
          <MatchCard {match} showCoverageToggle={$persona === 'media'} />
        {/each}
      </div>
    </div>
  {/if}

  <div>
    <h2 class="text-xl font-semibold mb-3">Schedule</h2>
    {#if timeBlocks.length > 0}
      {#each timeBlocks as block (block.timestamp)}
        <TimeBlock {block} {conflicts} showCoverageToggle={$persona === 'media'} />
      {/each}
    {:else}
      <p class="text-gray-400 text-center py-8">
        No matches found
        {#if $filters.divisionIds.length > 0 || $filters.teamIds.length > 0}
          with current filters
        {/if}
      </p>
    {/if}
  </div>
</div>
```

### 6.5 Match Detail & Live Scoring Page
**File**: `src/routes/match/[matchId]/+page.ts`
```typescript
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  return {
    matchId: parseInt(params.matchId)
  };
};
```

**File**: `src/routes/match/[matchId]/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { liveScore } from '$lib/stores/liveScore';
  import { clientId } from '$lib/stores/clientId';
  import { eventId } from '$lib/stores/event';
  import { lockMatch, unlockMatch, updateScore } from '$lib/supabase/actions';
  import { goto } from '$app/navigation';

  export let data: PageData;

  const score = liveScore(data.matchId);
  let isLocking = $state(false);
  let currentSet = $state(0);
  let error = $state('');

  let isLockedByMe = $derived($score?.locked_by === $clientId);
  let lockExpired = $derived(
    $score?.locked_until ? new Date($score.locked_until) < new Date() : false
  );
  let canScore = $derived(isLockedByMe && !lockExpired);

  // Auto-release if lock expired
  $effect(() => {
    if (lockExpired && isLockedByMe) {
      unlockMatch(data.matchId);
    }
  });

  async function handleLock() {
    isLocking = true;
    error = '';
    try {
      await lockMatch(data.matchId, $clientId, $eventId);
    } catch (e) {
      error = 'Failed to lock match. Someone else may be scoring.';
    } finally {
      isLocking = false;
    }
  }

  async function handleUnlock() {
    await unlockMatch(data.matchId);
    goto(-1);
  }

  async function addPoint(team: 1 | 2) {
    if (!canScore) return;
    try {
      await updateScore(data.matchId, currentSet, team, 1, $clientId);
    } catch (e) {
      error = 'Failed to update score';
    }
  }

  async function subtractPoint(team: 1 | 2) {
    if (!canScore) return;
    try {
      await updateScore(data.matchId, currentSet, team, -1, $clientId);
    } catch (e) {
      error = 'Failed to update score';
    }
  }
</script>

<div class="max-w-2xl mx-auto p-4">
  <div class="mb-6">
    <button
      on:click={() => goto(-1)}
      class="text-court-gold hover:underline text-sm"
    >
      ← Back
    </button>
    <h1 class="text-2xl font-bold mt-2">Match Details</h1>
  </div>

  {#if error}
    <div class="mb-4 bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400" role="alert">
      {error}
    </div>
  {/if}

  {#if $score}
    <div class="bg-court-charcoal rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Scoreboard</h2>
      {#if $score.sets.length > 0}
        <div class="space-y-2">
          {#each $score.sets as set, i}
            <div class="flex justify-between items-center p-3 bg-court-dark rounded">
              <span class="text-gray-400">Set {i + 1}</span>
              <span class="text-2xl font-bold tabular-nums">
                {set.team1Score} - {set.team2Score}
              </span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-400">No scores yet</p>
      {/if}
    </div>

    {#if !isLockedByMe && !$score.locked_by}
      <button
        on:click={handleLock}
        disabled={isLocking}
        class="w-full py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark disabled:opacity-50 transition-colors touch-target"
      >
        {isLocking ? 'Locking...' : 'Lock Match for Scoring'}
      </button>
    {:else if isLockedByMe && canScore}
      <div class="bg-court-charcoal rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Score Entry</h2>

        <div class="mb-6">
          <label for="current-set" class="block text-sm font-medium mb-2">
            Current Set
          </label>
          <input
            id="current-set"
            type="number"
            bind:value={currentSet}
            min="0"
            max="4"
            class="w-full px-4 py-2 bg-court-dark border border-gray-700 rounded focus:outline-none focus:border-court-gold"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="font-semibold mb-3 text-center">Team 1</h3>
            <div class="text-center text-3xl font-bold mb-3">
              {$score.sets[currentSet]?.team1Score ?? 0}
            </div>
            <div class="flex gap-2">
              <button
                on:click={() => addPoint(1)}
                class="flex-1 py-3 bg-green-600 rounded hover:bg-green-700 transition-colors font-semibold touch-target"
                aria-label="Add point to team 1"
              >
                +1
              </button>
              <button
                on:click={() => subtractPoint(1)}
                class="flex-1 py-3 bg-red-600 rounded hover:bg-red-700 transition-colors font-semibold touch-target"
                aria-label="Subtract point from team 1"
              >
                -1
              </button>
            </div>
          </div>

          <div>
            <h3 class="font-semibold mb-3 text-center">Team 2</h3>
            <div class="text-center text-3xl font-bold mb-3">
              {$score.sets[currentSet]?.team2Score ?? 0}
            </div>
            <div class="flex gap-2">
              <button
                on:click={() => addPoint(2)}
                class="flex-1 py-3 bg-green-600 rounded hover:bg-green-700 transition-colors font-semibold touch-target"
                aria-label="Add point to team 2"
              >
                +1
              </button>
              <button
                on:click={() => subtractPoint(2)}
                class="flex-1 py-3 bg-red-600 rounded hover:bg-red-700 transition-colors font-semibold touch-target"
                aria-label="Subtract point from team 2"
              >
                -1
              </button>
            </div>
          </div>
        </div>

        <button
          on:click={handleUnlock}
          class="w-full py-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors touch-target"
        >
          Release Lock & Go Back
        </button>
      </div>
    {:else if $score.locked_by && !isLockedByMe}
      <div class="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4" role="status">
        <p class="text-yellow-400">
          Match is currently being scored by another user
        </p>
      </div>
    {:else if lockExpired}
      <div class="bg-orange-900/20 border border-orange-600 rounded-lg p-4" role="status">
        <p class="text-orange-400">
          Your scoring lock has expired. Lock the match again to continue scoring.
        </p>
        <button
          on:click={handleLock}
          class="mt-3 w-full py-2 bg-court-gold text-court-dark rounded hover:bg-court-gold-dark transition-colors"
        >
          Lock Again
        </button>
      </div>
    {/if}
  {:else}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-court-gold"></div>
    </div>
  {/if}
</div>
```

---

## Phase 7: Missing Routes Implementation

### 7.1 My Teams Page
**File**: `src/routes/my-teams/+page.ts`
```typescript
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { eventId, favoriteTeams } from '$lib/stores';

export const load: PageLoad = async () => {
  const currentEventId = get(eventId);
  const favorites = get(favoriteTeams);

  if (favorites.length === 0) {
    return {
      eventId: currentEventId,
      matches: [],
      teams: []
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const schedule = await aesClient.getCourtSchedule(currentEventId, today, 1440);

    // Filter matches for favorite teams
    const allMatches = schedule.CourtSchedules.flatMap(court =>
      court.CourtMatches.map(match => ({ ...match, CourtName: court.Name }))
    );

    const favoriteMatches = allMatches.filter(match => {
      const matchTeamIds = [match.FirstTeamId, match.SecondTeamId].filter(Boolean);
      return matchTeamIds.some(id => favorites.includes(id!));
    });

    return {
      eventId: currentEventId,
      matches: favoriteMatches,
      favoriteTeamIds: favorites
    };
  } catch (e) {
    throw error(500, 'Failed to load team matches');
  }
};
```

**File**: `src/routes/my-teams/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import TimeBlock from '$lib/components/match/TimeBlock.svelte';
  import MatchCard from '$lib/components/match/MatchCard.svelte';
  import { groupMatchesByTime, detectConflicts } from '$lib/utils/filterMatches';
  import { favoriteTeams } from '$lib/stores/favorites';

  export let data: PageData;

  let timeBlocks = $derived(groupMatchesByTime(data.matches));
  let conflicts = $derived(detectConflicts(data.matches));

  let now = $state(Date.now());
  let liveMatches = $derived(
    data.matches.filter(
      m => m.ScheduledStartDateTime <= now && m.ScheduledEndDateTime >= now
    )
  );

  $effect(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 60000);

    return () => clearInterval(interval);
  });
</script>

<div class="max-w-screen-xl mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-court-gold">My Teams</h1>
    <p class="text-gray-400 text-sm">
      {$favoriteTeams.length} favorite {$favoriteTeams.length === 1 ? 'team' : 'teams'}
      • {data.matches.length} {data.matches.length === 1 ? 'match' : 'matches'}
    </p>
  </div>

  {#if $favoriteTeams.length === 0}
    <div class="text-center py-12 bg-court-charcoal rounded-lg">
      <p class="text-gray-400 mb-4">You haven't favorited any teams yet</p>
      <p class="text-sm text-gray-500">
        Star teams from match cards to track them here
      </p>
    </div>
  {:else if data.matches.length === 0}
    <div class="text-center py-12 bg-court-charcoal rounded-lg">
      <p class="text-gray-400">No matches found for your favorite teams today</p>
    </div>
  {:else}
    {#if liveMatches.length > 0}
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-3 text-red-400">🔴 Live Now</h2>
        <div class="grid gap-3">
          {#each liveMatches as match (match.MatchId)}
            <MatchCard {match} />
          {/each}
        </div>
      </div>
    {/if}

    <div>
      <h2 class="text-xl font-semibold mb-3">Schedule</h2>
      {#each timeBlocks as block (block.timestamp)}
        <TimeBlock {block} {conflicts} />
      {/each}
    </div>
  {/if}
</div>
```

### 7.2 Coverage Plan Page
**File**: `src/routes/coverage/+page.ts`
```typescript
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { eventId, coveragePlan } from '$lib/stores';

export const load: PageLoad = async ({ url }) => {
  const currentEventId = get(eventId);
  const coverage = get(coveragePlan);
  const clubId = parseInt(url.searchParams.get('clubId') || '0');

  if (!clubId || coverage.length === 0) {
    return {
      eventId: currentEventId,
      matches: [],
      teams: [],
      clubId
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const [teams, schedule] = await Promise.all([
      aesClient.getTeamAssignments(currentEventId, clubId),
      aesClient.getCourtSchedule(currentEventId, today, 1440)
    ]);

    const allMatches = schedule.CourtSchedules.flatMap(court =>
      court.CourtMatches.map(match => ({ ...match, CourtName: court.Name }))
    );

    const coverageMatches = allMatches.filter(m => coverage.includes(m.MatchId));

    return {
      eventId: currentEventId,
      matches: coverageMatches,
      teams,
      clubId
    };
  } catch (e) {
    throw error(500, 'Failed to load coverage plan');
  }
};
```

**File**: `src/routes/coverage/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import type { CoverageStats } from '$lib/types/app';
  import TimeBlock from '$lib/components/match/TimeBlock.svelte';
  import MatchCard from '$lib/components/match/MatchCard.svelte';
  import { groupMatchesByTime, detectConflicts } from '$lib/utils/filterMatches';
  import { coveragePlan } from '$lib/stores/coverage';

  export let data: PageData;

  let timeBlocks = $derived(groupMatchesByTime(data.matches));
  let conflicts = $derived(detectConflicts(data.matches));

  let conflictingMatches = $derived(
    data.matches.filter(m => conflicts.has(m.MatchId))
  );

  // Calculate coverage statistics
  let stats = $derived<CoverageStats>(() => {
    const teamIdsCovered = new Set<number>();
    data.matches.forEach(match => {
      if (match.FirstTeamId) teamIdsCovered.add(match.FirstTeamId);
      if (match.SecondTeamId) teamIdsCovered.add(match.SecondTeamId);
    });

    const allTeamIds = new Set(data.teams.map(t => t.TeamId));
    const uncoveredTeamIds = Array.from(allTeamIds).filter(id => !teamIdsCovered.has(id));

    return {
      totalMatches: data.matches.length,
      conflicts: conflicts.size,
      teamsCovered: teamIdsCovered.size,
      totalTeams: data.teams.length,
      coveredTeamIds: Array.from(teamIdsCovered),
      uncoveredTeamIds
    };
  }());

  let showStats = $state(false);
</script>

<div class="max-w-screen-xl mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-court-gold">Coverage Plan</h1>
    <p class="text-gray-400 text-sm">
      Media photography coverage planning
    </p>
  </div>

  {#if $coveragePlan.length === 0}
    <div class="text-center py-12 bg-court-charcoal rounded-lg">
      <p class="text-gray-400 mb-4">No matches in coverage plan yet</p>
      <p class="text-sm text-gray-500">
        Add matches from the All Matches view
      </p>
    </div>
  {:else}
    <!-- Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-court-charcoal rounded-lg p-4">
        <div class="text-2xl font-bold text-court-gold">{stats.totalMatches}</div>
        <div class="text-sm text-gray-400">Total Matches</div>
      </div>

      <div class="bg-court-charcoal rounded-lg p-4">
        <div class="text-2xl font-bold text-red-400">{stats.conflicts}</div>
        <div class="text-sm text-gray-400">Conflicts</div>
      </div>

      <button
        on:click={() => showStats = !showStats}
        class="bg-court-charcoal rounded-lg p-4 hover:bg-gray-800 transition-colors text-left"
      >
        <div class="text-2xl font-bold text-court-gold">
          {stats.teamsCovered} / {stats.totalTeams}
        </div>
        <div class="text-sm text-gray-400">Teams Covered ▼</div>
      </button>
    </div>

    {#if showStats}
      <div class="mb-6 bg-court-charcoal rounded-lg p-4">
        <h3 class="font-semibold mb-3">Coverage Breakdown</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm text-green-400 mb-2">✓ Covered Teams ({stats.coveredTeamIds.length})</h4>
            <div class="text-sm text-gray-400 space-y-1">
              {#each data.teams.filter(t => stats.coveredTeamIds.includes(t.TeamId)) as team}
                <div>{team.TeamName}</div>
              {/each}
            </div>
          </div>
          <div>
            <h4 class="text-sm text-red-400 mb-2">✗ Not Covered ({stats.uncoveredTeamIds.length})</h4>
            <div class="text-sm text-gray-400 space-y-1">
              {#each data.teams.filter(t => stats.uncoveredTeamIds.includes(t.TeamId)) as team}
                <div>{team.TeamName}</div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Conflicts Section -->
    {#if conflictingMatches.length > 0}
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-3 text-red-400">⚠️ Conflicts</h2>
        <div class="grid gap-3">
          {#each conflictingMatches as match (match.MatchId)}
            <MatchCard {match} isConflict={true} showCoverageToggle={true} />
          {/each}
        </div>
      </div>
    {/if}

    <!-- Full Coverage List -->
    <div>
      <h2 class="text-xl font-semibold mb-3">All Matches in Plan</h2>
      {#each timeBlocks as block (block.timestamp)}
        <TimeBlock {block} {conflicts} showCoverageToggle={true} />
      {/each}
    </div>
  {/if}
</div>
```

### 7.3 Filters Page
**File**: `src/routes/filters/+page.ts`
```typescript
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { eventId } from '$lib/stores/event';

export const load: PageLoad = async ({ url }) => {
  const currentEventId = get(eventId);
  const clubId = parseInt(url.searchParams.get('clubId') || '0');

  if (!clubId) {
    return {
      teams: [],
      divisions: [],
      clubId
    };
  }

  try {
    const teams = await aesClient.getTeamAssignments(currentEventId, clubId);

    // Extract unique divisions
    const divisionMap = new Map();
    teams.forEach(team => {
      if (!divisionMap.has(team.DivisionId)) {
        divisionMap.set(team.DivisionId, {
          DivisionId: team.DivisionId,
          Name: team.DivisionName
        });
      }
    });

    return {
      teams,
      divisions: Array.from(divisionMap.values()),
      clubId
    };
  } catch (e) {
    throw error(500, 'Failed to load filter options');
  }
};
```

**File**: `src/routes/filters/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { filters } from '$lib/stores/filters';
  import { persona } from '$lib/stores/persona';
  import { goto } from '$app/navigation';

  export let data: PageData;

  let selectedDivisions = $state<number[]>($filters.divisionIds);
  let selectedTeams = $state<number[]>($filters.teamIds);
  let showOnlyUncovered = $state($filters.showOnlyUncovered);

  function toggleDivision(divisionId: number) {
    if (selectedDivisions.includes(divisionId)) {
      selectedDivisions = selectedDivisions.filter(id => id !== divisionId);
    } else {
      selectedDivisions = [...selectedDivisions, divisionId];
    }
  }

  function toggleTeam(teamId: number) {
    if (selectedTeams.includes(teamId)) {
      selectedTeams = selectedTeams.filter(id => id !== teamId);
    } else {
      selectedTeams = [...selectedTeams, teamId];
    }
  }

  function applyFilters() {
    filters.setDivisions(selectedDivisions);
    filters.setTeams(selectedTeams);
    filters.setShowOnlyUncovered(showOnlyUncovered);
    goto(-1);
  }

  function clearFilters() {
    selectedDivisions = [];
    selectedTeams = [];
    showOnlyUncovered = false;
    filters.clear();
  }
</script>

<div class="max-w-2xl mx-auto p-4">
  <div class="mb-6">
    <button
      on:click={() => goto(-1)}
      class="text-court-gold hover:underline text-sm"
    >
      ← Back
    </button>
    <h1 class="text-2xl font-bold text-court-gold mt-2">Filters</h1>
  </div>

  {#if data.divisions.length === 0 && data.teams.length === 0}
    <div class="text-center py-12 bg-court-charcoal rounded-lg">
      <p class="text-gray-400">No filter options available</p>
      <p class="text-sm text-gray-500 mt-2">Select a club first</p>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Divisions -->
      {#if data.divisions.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-3">Divisions</h2>
          <div class="space-y-2">
            {#each data.divisions as division}
              <label class="flex items-center gap-3 p-3 bg-court-charcoal rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedDivisions.includes(division.DivisionId)}
                  on:change={() => toggleDivision(division.DivisionId)}
                  class="w-5 h-5 rounded border-gray-700 bg-court-dark text-court-gold focus:ring-court-gold"
                />
                <span>{division.Name}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Teams -->
      {#if data.teams.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-3">Teams</h2>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            {#each data.teams as team}
              <label class="flex items-center gap-3 p-3 bg-court-charcoal rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team.TeamId)}
                  on:change={() => toggleTeam(team.TeamId)}
                  class="w-5 h-5 rounded border-gray-700 bg-court-dark text-court-gold focus:ring-court-gold"
                />
                <span>{team.TeamName}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Media-specific filters -->
      {#if $persona === 'media'}
        <div>
          <h2 class="text-lg font-semibold mb-3">Coverage Filters</h2>
          <label class="flex items-center gap-3 p-3 bg-court-charcoal rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              bind:checked={showOnlyUncovered}
              class="w-5 h-5 rounded border-gray-700 bg-court-dark text-court-gold focus:ring-court-gold"
            />
            <div>
              <div class="font-medium">Show only uncovered teams</div>
              <div class="text-sm text-gray-400">
                Hide teams already in your coverage plan
              </div>
            </div>
          </label>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          on:click={applyFilters}
          class="flex-1 py-3 bg-court-gold text-court-dark font-semibold rounded-lg hover:bg-court-gold-dark transition-colors touch-target"
        >
          Apply Filters
        </button>
        <button
          on:click={clearFilters}
          class="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors touch-target"
        >
          Clear
        </button>
      </div>
    </div>
  {/if}
</div>
```

### 7.4 Team Detail Page
**File**: `src/routes/team/[teamId]/+page.ts`
```typescript
import type { PageLoad } from './$types';
import { aesClient } from '$lib/api/aesClient';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { eventId } from '$lib/stores/event';

export const load: PageLoad = async ({ params, url }) => {
  const currentEventId = get(eventId);
  const teamId = parseInt(params.teamId);
  const divisionId = parseInt(url.searchParams.get('divisionId') || '0');

  if (!divisionId) {
    throw error(400, 'Division ID required');
  }

  try {
    const [current, work, future, past, roster] = await Promise.all([
      aesClient.getTeamSchedule(currentEventId, divisionId, teamId, 'current'),
      aesClient.getTeamSchedule(currentEventId, divisionId, teamId, 'work'),
      aesClient.getTeamSchedule(currentEventId, divisionId, teamId, 'future'),
      aesClient.getTeamSchedule(currentEventId, divisionId, teamId, 'past'),
      aesClient.getTeamRoster(currentEventId, divisionId, teamId)
    ]);

    return {
      eventId: currentEventId,
      teamId,
      divisionId,
      schedule: { current, work, future, past },
      roster
    };
  } catch (e) {
    throw error(500, 'Failed to load team details');
  }
};
```

**File**: `src/routes/team/[teamId]/+page.svelte`
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import MatchCard from '$lib/components/match/MatchCard.svelte';
  import { favoriteTeams } from '$lib/stores/favorites';
  import { goto } from '$app/navigation';

  export let data: PageData;

  let activeTab = $state<'schedule' | 'roster'>('schedule');
  let isFavorite = $derived($favoriteTeams.includes(data.teamId));

  function toggleFavorite() {
    favoriteTeams.toggleTeam(data.teamId);
  }
</script>

<div class="max-w-screen-xl mx-auto p-4">
  <div class="mb-6">
    <button
      on:click={() => goto(-1)}
      class="text-court-gold hover:underline text-sm"
    >
      ← Back
    </button>

    <div class="flex justify-between items-start mt-2">
      <h1 class="text-2xl font-bold text-court-gold">
        Team Details
      </h1>
      <button
        on:click={toggleFavorite}
        class="px-4 py-2 rounded-lg transition-colors touch-target"
        class:bg-court-gold={isFavorite}
        class:text-court-dark={isFavorite}
        class:bg-gray-700={!isFavorite}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '★' : '☆'} {isFavorite ? 'Favorited' : 'Favorite'}
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-2 mb-6 border-b border-gray-700">
    <button
      on:click={() => activeTab = 'schedule'}
      class="px-4 py-2 transition-colors border-b-2"
      class:border-court-gold={activeTab === 'schedule'}
      class:text-court-gold={activeTab === 'schedule'}
      class:border-transparent={activeTab !== 'schedule'}
      class:text-gray-400={activeTab !== 'schedule'}
    >
      Schedule
    </button>
    <button
      on:click={() => activeTab = 'roster'}
      class="px-4 py-2 transition-colors border-b-2"
      class:border-court-gold={activeTab === 'roster'}
      class:text-court-gold={activeTab === 'roster'}
      class:border-transparent={activeTab !== 'roster'}
      class:text-gray-400={activeTab !== 'roster'}
    >
      Roster
    </button>
  </div>

  {#if activeTab === 'schedule'}
    <div class="space-y-6">
      {#if data.schedule.current.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-3 text-red-400">Current Matches</h2>
          <div class="grid gap-3">
            {#each data.schedule.current as match (match.MatchId)}
              <MatchCard {match} />
            {/each}
          </div>
        </div>
      {/if}

      {#if data.schedule.work.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-3">Work Assignments</h2>
          <div class="grid gap-3">
            {#each data.schedule.work as match (match.MatchId)}
              <MatchCard {match} />
            {/each}
          </div>
        </div>
      {/if}

      {#if data.schedule.future.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-3">Upcoming Matches</h2>
          <div class="grid gap-3">
            {#each data.schedule.future as match (match.MatchId)}
              <MatchCard {match} />
            {/each}
          </div>
        </div>
      {/if}

      {#if data.schedule.past.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-3">Past Matches</h2>
          <div class="grid gap-3">
            {#each data.schedule.past as match (match.MatchId)}
              <MatchCard {match} />
            {/each}
          </div>
        </div>
      {/if}

      {#if data.schedule.current.length === 0 && data.schedule.work.length === 0 && data.schedule.future.length === 0 && data.schedule.past.length === 0}
        <p class="text-gray-400 text-center py-8">No matches found for this team</p>
      {/if}
    </div>
  {:else}
    <div>
      {#if data.roster.length > 0}
        <div class="grid gap-2">
          {#each data.roster as player}
            <div class="bg-court-charcoal rounded-lg p-4">
              <div class="font-semibold">{player.Name || 'Unknown Player'}</div>
              {#if player.Number}
                <div class="text-sm text-gray-400">#{player.Number}</div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-400 text-center py-8">No roster information available</p>
      {/if}
    </div>
  {/if}
</div>
```

---

## Phase 8: Supabase Database Setup

### 8.1 Create Database Schema
**File**: `supabase/schema.sql`
```sql
-- Match Scores Table
CREATE TABLE IF NOT EXISTS match_scores (
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

-- Match Locks Table
CREATE TABLE IF NOT EXISTS match_locks (
  match_id BIGINT PRIMARY KEY,
  locked_by TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT valid_lock CHECK (expires_at > locked_at)
);

-- Indexes for performance
CREATE INDEX idx_match_scores_event ON match_scores(event_id);
CREATE INDEX idx_match_scores_status ON match_scores(status);
CREATE INDEX idx_match_locks_expires ON match_locks(expires_at);

-- Enable Row Level Security
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_locks ENABLE ROW LEVEL SECURITY;

-- Policies for match_scores
-- NOTE: These are permissive for MVP. In production, restrict based on lock ownership.
CREATE POLICY "Anyone can view scores" ON match_scores
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert scores" ON match_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update scores" ON match_scores
  FOR UPDATE USING (true);

-- TODO: Production policy should be:
-- CREATE POLICY "Only lock holder can update" ON match_scores
--   FOR UPDATE USING (
--     locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
--     OR locked_by IS NULL
--   );

-- Policies for match_locks
CREATE POLICY "Anyone can view locks" ON match_locks
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert locks" ON match_locks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete locks" ON match_locks
  FOR DELETE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE match_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE match_locks;

-- Function to auto-cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM match_locks
  WHERE expires_at < NOW();

  UPDATE match_scores
  SET locked_by = NULL, locked_until = NULL
  WHERE locked_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every 5 minutes (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks()');
```

### 8.2 Setup Instructions
**File**: `SUPABASE_SETUP.md`
```markdown
# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created

## 2. Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy contents of `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables were created in Table Editor

## 3. Enable Realtime

1. Go to Database > Replication in Supabase dashboard
2. Find `match_scores` table
3. Click toggle to enable realtime
4. Find `match_locks` table
5. Click toggle to enable realtime

## 4. Get API Credentials

1. Go to Settings > API in Supabase dashboard
2. Copy "Project URL" → Add to `.env` as `PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → Add to `.env` as `PUBLIC_SUPABASE_ANON_KEY`

## 5. Configure Environment Variables

Create `.env` file:
\`\`\`bash
PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## 6. Verify Setup

Run the app and try to:
1. Navigate to a match
2. Click "Lock Match for Scoring"
3. Add some points
4. Open the same match in another browser/tab
5. Verify you see the score update in real-time

## Notes

- RLS policies are currently permissive for MVP
- For production, implement stricter policies (see comments in schema.sql)
- Consider enabling pg_cron extension for automatic lock cleanup
```

---

## Phase 9: Testing & Quality

### 9.1 Create Unit Tests
**File**: `src/lib/utils/filterMatches.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { matchBelongsToClub, detectConflicts, getMatchStatus } from './filterMatches';
import type { Match } from '$lib/types/aes';

describe('matchBelongsToClub', () => {
  it('should match by team ID (preferred)', () => {
    const match: Partial<Match> = {
      MatchId: 1,
      FirstTeamId: 100,
      SecondTeamId: 101,
      FirstTeamText: 'Team A',
      SecondTeamText: 'Team B'
    };

    const filter = {
      clubTeamIds: [100, 102],
      clubTeamNames: []
    };

    expect(matchBelongsToClub(match as Match, filter)).toBe(true);
  });

  it('should fallback to text matching when no IDs available', () => {
    const match: Partial<Match> = {
      MatchId: 1,
      FirstTeamText: 'Beach Elite 15-1',
      SecondTeamText: 'Coast 15-2'
    };

    const filter = {
      clubTeamIds: [],
      clubTeamNames: ['Beach Elite']
    };

    expect(matchBelongsToClub(match as Match, filter)).toBe(true);
  });

  it('should not match when neither ID nor text matches', () => {
    const match: Partial<Match> = {
      MatchId: 1,
      FirstTeamId: 100,
      SecondTeamId: 101,
      FirstTeamText: 'Team A',
      SecondTeamText: 'Team B'
    };

    const filter = {
      clubTeamIds: [200, 201],
      clubTeamNames: ['Team C']
    };

    expect(matchBelongsToClub(match as Match, filter)).toBe(false);
  });
});

describe('detectConflicts', () => {
  it('should detect overlapping matches', () => {
    const matches: Partial<Match>[] = [
      {
        MatchId: 1,
        ScheduledStartDateTime: 1000,
        ScheduledEndDateTime: 2000
      },
      {
        MatchId: 2,
        ScheduledStartDateTime: 1500,
        ScheduledEndDateTime: 2500
      }
    ];

    const conflicts = detectConflicts(matches as Match[]);
    expect(conflicts.has(1)).toBe(true);
    expect(conflicts.has(2)).toBe(true);
  });

  it('should not detect conflicts for non-overlapping matches', () => {
    const matches: Partial<Match>[] = [
      {
        MatchId: 1,
        ScheduledStartDateTime: 1000,
        ScheduledEndDateTime: 2000
      },
      {
        MatchId: 2,
        ScheduledStartDateTime: 2000,
        ScheduledEndDateTime: 3000
      }
    ];

    const conflicts = detectConflicts(matches as Match[]);
    expect(conflicts.size).toBe(0);
  });
});

describe('getMatchStatus', () => {
  it('should return "completed" for matches with outcome', () => {
    const match: Partial<Match> = {
      HasOutcome: true,
      ScheduledStartDateTime: Date.now() - 10000,
      ScheduledEndDateTime: Date.now() + 10000
    };

    expect(getMatchStatus(match as Match)).toBe('completed');
  });

  it('should return "live" for ongoing matches', () => {
    const match: Partial<Match> = {
      HasOutcome: false,
      ScheduledStartDateTime: Date.now() - 10000,
      ScheduledEndDateTime: Date.now() + 10000
    };

    expect(getMatchStatus(match as Match)).toBe('live');
  });

  it('should return "upcoming" for future matches', () => {
    const match: Partial<Match> = {
      HasOutcome: false,
      ScheduledStartDateTime: Date.now() + 10000,
      ScheduledEndDateTime: Date.now() + 20000
    };

    expect(getMatchStatus(match as Match)).toBe('upcoming');
  });
});
```

### 9.2 Run Tests
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

---

## Phase 10: Polish & UX Enhancements

### 10.1 Add Toast Notifications (Optional)
**File**: `src/lib/components/ui/Toast.svelte`
```svelte
<script lang="ts">
  export let message: string;
  export let type: 'success' | 'error' | 'info' = 'info';
  export let onClose: () => void;

  let visible = $state(true);

  $effect(() => {
    const timer = setTimeout(() => {
      visible = false;
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div
    class="fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-opacity duration-300"
    class:bg-green-600={type === 'success'}
    class:bg-red-600={type === 'error'}
    class:bg-blue-600={type === 'info'}
    role="alert"
  >
    <p class="text-white font-medium">{message}</p>
  </div>
{/if}
```

### 10.2 Add Persona Switcher
**File**: `src/lib/components/navigation/PersonaSwitcher.svelte`
```svelte
<script lang="ts">
  import { persona } from '$lib/stores/persona';
</script>

<div class="fixed top-4 left-4 z-40">
  <button
    on:click={() => persona.set($persona === 'media' ? 'spectator' : 'media')}
    class="px-4 py-2 bg-court-charcoal rounded-lg border border-gray-700 hover:border-court-gold transition-colors text-sm"
    aria-label="Switch persona to {$persona === 'media' ? 'spectator' : 'media'}"
  >
    {$persona === 'media' ? '📷 Media' : '👤 Spectator'}
  </button>
</div>
```

Add to root layout:
```svelte
<script lang="ts">
  import PersonaSwitcher from '$lib/components/navigation/PersonaSwitcher.svelte';
</script>

<PersonaSwitcher />
```

---

## Phase 11: Deployment

### 11.1 Create Vercel Configuration
**File**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "framework": "sveltekit",
  "env": {
    "PUBLIC_SUPABASE_URL": "@supabase-url",
    "PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### 11.2 Create README
**File**: `README.md`
```markdown
# CourtSync

Volleyball tournament scheduling and live scoring app built with SvelteKit 5.

## Tech Stack

- **SvelteKit 2.0** + **Svelte 5** (Runes)
- **Supabase** (real-time database)
- **Tailwind CSS v4**
- **TypeScript** (strict mode)
- **Vercel** (deployment)

## Features

- 📋 Event and club-based match filtering
- ⭐ Favorite teams tracking
- 📷 Media coverage planning
- 🔴 Real-time live scoring
- 🔒 Match locking prevents concurrent scoring
- 📱 Mobile-first responsive design
- 🌙 Dark mode by default

## Setup

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure environment variables
\`\`\`bash
cp .env.example .env
# Fill in Supabase credentials
\`\`\`

### 3. Setup Supabase
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions:
- Create project at supabase.com
- Run \`supabase/schema.sql\` in SQL editor
- Enable Realtime for tables
- Add credentials to \`.env\`

### 4. Run development server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173)

## Development

\`\`\`bash
# Type checking
npm run check

# Linting
npm run lint

# Testing
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - \`PUBLIC_SUPABASE_URL\`
   - \`PUBLIC_SUPABASE_ANON_KEY\`
4. Deploy

Or use Vercel CLI:
\`\`\`bash
vercel --prod
\`\`\`

## Project Structure

\`\`\`
src/
├── routes/           # SvelteKit routes (pages)
├── lib/
│   ├── components/   # Svelte components
│   ├── stores/       # Svelte stores (state)
│   ├── api/          # API clients
│   ├── supabase/     # Supabase integration
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
└── app.css          # Global styles
\`\`\`

## Architecture

See [docs/sveltekit-architecture.md](./docs/sveltekit-architecture.md) for detailed architecture documentation.

## License

MIT
```

### 11.3 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Or connect GitHub repository to Vercel dashboard for automatic deployments.

---

## Implementation Checklist

### Phase 1: Initialization ✅
- [ ] Initialize SvelteKit project
- [ ] Install dependencies
- [ ] Configure TypeScript
- [ ] Configure Tailwind CSS
- [ ] Setup environment variables
- [ ] Create .gitignore

### Phase 2: Types & Utilities ✅
- [ ] Create AES API types
- [ ] Create Supabase types
- [ ] Create app types
- [ ] Create filtering utilities
- [ ] Create conflict detection

### Phase 3: API Integration ✅
- [ ] Create AES API client
- [ ] Create Supabase client
- [ ] Create Supabase actions
- [ ] Add error handling

### Phase 4: State Management ✅
- [ ] Create event ID store
- [ ] Create client ID store
- [ ] Create coverage plan store
- [ ] Create favorites store
- [ ] Create persona store
- [ ] Create filters store
- [ ] Create live score store factory

### Phase 5: UI Components ✅
- [ ] Create loading skeleton
- [ ] Create match card
- [ ] Create time block
- [ ] Create bottom navigation
- [ ] Create error boundary

### Phase 6: Core Routes ✅
- [ ] Create root layout
- [ ] Create event selection page
- [ ] Create club selection page
- [ ] Create club match hub
- [ ] Create match detail page

### Phase 7: Additional Routes ✅
- [ ] Create My Teams page
- [ ] Create Coverage Plan page
- [ ] Create Filters page
- [ ] Create Team Detail page

### Phase 8: Database Setup ✅
- [ ] Create Supabase schema
- [ ] Setup Supabase project
- [ ] Enable Realtime
- [ ] Configure RLS policies

### Phase 9: Testing ✅
- [ ] Write unit tests
- [ ] Write component tests (optional)
- [ ] Write E2E tests (optional)
- [ ] Test on mobile devices

### Phase 10: Polish ✅
- [ ] Add toast notifications (optional)
- [ ] Add persona switcher
- [ ] Add accessibility labels
- [ ] Test keyboard navigation
- [ ] Add loading states

### Phase 11: Deployment ✅
- [ ] Configure Vercel
- [ ] Create README
- [ ] Deploy to Vercel
- [ ] Verify production build
- [ ] Test live scoring in production

---

## Success Criteria

### Performance Metrics
- ✅ Bundle size < 100KB (gzipped)
- ✅ First load < 1.5s
- ✅ Real-time score updates < 1s latency
- ✅ Lighthouse score > 95

### Functional Requirements
- ✅ Event/club selection works
- ✅ Match filtering by club works
- ✅ Live scoring with match locking works
- ✅ Real-time synchronization works
- ✅ Coverage planning works (media persona)
- ✅ Team favorites work (spectator persona)
- ✅ Filters work (divisions, teams, uncovered)
- ✅ Conflict detection works
- ✅ Mobile-responsive design

### User Experience
- ✅ Mobile-friendly navigation
- ✅ Touch targets ≥ 44px
- ✅ Loading states present
- ✅ Error handling graceful
- ✅ Accessibility labels present
- ✅ Dark mode by default

---

## Notes

- **Svelte 5 Syntax**: Use `$state`, `$derived`, `$effect` consistently
- **ID-Based Filtering**: Always prefer TeamId/MatchId/DivisionId over text matching
- **Client ID**: Persisted in localStorage for lock ownership
- **Event ID**: Persisted in store for session continuity
- **RLS Policies**: Currently permissive for MVP; tighten for production
- **Lock Expiration**: Auto-release on client-side when detected

## Next Steps After MVP

1. Add pool standings display
2. Implement push notifications for favorite teams
3. Add offline support with service workers
4. Implement user accounts (optional)
5. Add analytics tracking
6. Performance monitoring
7. Tighten RLS policies
8. Add E2E test coverage
9. Implement PWA features
10. Add sharing functionality
