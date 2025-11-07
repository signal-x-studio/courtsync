Purpose
-------
This file tells AI coding agents the essential, repo-specific knowledge needed to be productive in CourtSync.

Quick summary
-------------
- Framework: SvelteKit (Svelte 5) + TypeScript (strict). See `svelte.config.js` and `vite.config.ts`.
- Realtime backend: Supabase (client at `src/lib/supabase/client.ts`, DB actions in `src/lib/supabase/actions.ts`).
- Hosting: Vercel via `@sveltejs/adapter-vercel` (see `svelte.config.js`).
- Tests: Unit — Vitest (`vitest.config.ts` / `npm run test`). E2E / visual — Playwright (`e2e/`, `npm run test:e2e`).

Essential patterns & where to look
---------------------------------
- Routing/pages: `src/routes/` — SvelteKit file-based routes. Example: match page `src/routes/match/[matchId]/+page.svelte` handles live scoring and locking.
- UI composition: components under `src/lib/components/*` and global styles in `src/app.css`.
- State & cross-component comms: stores in `src/lib/stores/*` (examples: `clientId`, `event`, `persona`, `liveScore`). Stores + Supabase realtime feed are the primary cross-component communication path.
- Supabase usage: client in `src/lib/supabase/client.ts`; DB actions (locking, score updates, reads) in `src/lib/supabase/actions.ts`. Edit these when changing DB behavior or concurrency rules.
- Types: `src/lib/types/*` (look at `src/lib/types/supabase.ts`) — keep changes compatible with existing types.

Workflows & important commands
-----------------------------
- Install: `npm install` (see `package.json`).
- Local dev: `npm run dev` (starts Vite/SvelteKit).
- Type check / sync: `npm run check` runs `svelte-kit sync` and `svelte-check` — run before commits.
- Unit tests: `npm run test` (Vitest). UI runner: `npm run test:ui`.
- E2E tests: `npm run test:e2e` (Playwright). Use `--headed`/`--debug` for interactive debugging.
- Visual tests update: `npm run test:visual --update-snapshots`.
- Build & preview: `npm run build` / `npm run preview`.

Environment and deployment
--------------------------
- Uses public Supabase keys for client: set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (copy `.env.example` -> `.env`). These variables are loaded in `src/lib/supabase/client.ts` via `$env/static/public`.
- Vercel: adapter configured in `svelte.config.js` (runtime `nodejs20.x`, `split: true`). Deploy via Vercel dashboard or `vercel --prod`.

Concurrency & locking rules (explicit, not generic)
-------------------------------------------------
- Locking is implemented in the DB and in `src/lib/supabase/actions.ts`.
  - `lockMatch(matchId, clientId, eventId)` sets `locked_by` and `locked_at` (creates row if needed).
  - `unlockMatch(matchId, clientId?)` clears the lock; if a `clientId` is provided the unlock only succeeds when that client owns the lock.
  - `updateScore(...)` validates lock ownership (`locked_by`) before applying updates.
- UI uses real-time subscription + stores to reflect lock state; see `src/routes/match/[matchId]/+page.svelte` for UI gating (`isLocked`, `canEdit`) and toast messages.

Conventions & small rules to follow
---------------------------------
- Code edits touching scoring/locking: update `src/lib/supabase/actions.ts` (server-side effect) and `src/routes/match/[matchId]/+page.svelte` (client gating + UX). Tests: add unit tests in `src/**/*.{test,spec}.ts` and e2e scenarios under `e2e/`.
- Store pattern: prefer small focused stores (see `clientId`, `liveScore`, `persona`) and import them as `$lib/stores/<name>`.
- Keep DB interaction centralized in `src/lib/supabase/*` — avoid sprinkling raw Supabase queries across routes.
- Types-first: keep TypeScript types in `src/lib/types/*` in sync with DB migrations (see `supabase/` folder for migrations/sql).

Where to check for more context
------------------------------
- Architecture doc: `docs/sveltekit-architecture.md` (read before large refactors).
- E2E & visual test examples: `e2e/` and `playwright.config.ts`.
- Migration SQL & Supabase notes: `supabase/`.

If you change behavior, run these locally
---------------------------------------
1. `npm run check` — ensure SvelteKit sync and TypeScript checks pass.
2. `npm run test` — run unit tests.
3. `npm run test:e2e` (or the headed/debug variants) — verify critical flows (match locking, live scoring).

Short examples (copy/edit patterns)
----------------------------------
- To change lock semantics: modify `src/lib/supabase/actions.ts::lockMatch` and update derived UI in `src/routes/match/[matchId]/+page.svelte` where `isLocked`/`canEdit` are derived from the `liveScore` store.
- To add a new API-like helper: add functions under `src/lib/supabase/` and export them; unit test them under `src/lib/supabase/*.test.ts` and add an e2e that exercises the UI flow.

Questions / unknowns to ask the maintainers
-----------------------------------------
- Are there any Supabase Row Level Security (RLS) policies or server-side functions not checked into the repo? See `supabase/`.
- Are there intended compatibility constraints for the public anon key usage (some features may require service role keys)?

Done — ask me if you'd like a longer-form agent persona or templates for PR message prompts, test generation, or automatic changelog notes.
