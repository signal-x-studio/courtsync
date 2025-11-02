# CourtSync - Official Developer Documentation References

**Purpose**: This guide contains authoritative links to official documentation for all frameworks, libraries, and tools used in the CourtSync project. Always consult these resources BEFORE implementing any feature or making configuration changes.

**Last Updated**: 2025-11-02

---

## Core Framework & Build Tools

### SvelteKit 2.0

**Official Documentation**: https://svelte.dev/docs/kit

**Key Resources**:
- Creating a Project: https://svelte.dev/docs/kit/creating-a-project
- CLI Documentation: https://svelte.dev/docs/kit/cli
- Adapters: https://svelte.dev/docs/kit/adapters
- Introduction: https://kit.svelte.dev/docs

**CLI Tool - sv create**:
- Official Reference: https://svelte.dev/docs/cli/sv-create
- Blog Announcement: https://svelte.dev/blog/sv-the-svelte-cli
- npm Package: https://www.npmjs.com/package/sv

**Command Syntax**:
```bash
npx sv create [options] [path]
```

**Available Options**:
- `--template <name>` — Choose template: `minimal`, `demo`, or `library`
- `--types <option>` — Configure typechecking: `ts` or `jsdoc`
- `--no-types` — Prevent typechecking (discouraged)
- `--no-add-ons` — Skip interactive add-ons prompt
- `--install <manager>` — Install with: `npm`, `pnpm`, `yarn`, `bun`, or `deno`
- `--no-install` — Skip dependency installation
- `--from-playground <url>` — Create from Svelte playground URL

**Example**:
```bash
npx sv create --template minimal --types ts
```

---

### Svelte 5 (Runes)

**Official Documentation**: https://svelte.dev/docs/svelte

**Key Resources**:
- What are Runes?: https://svelte.dev/docs/svelte/what-are-runes
- Introducing Runes (Blog): https://svelte.dev/blog/runes
- Migration Guide: https://svelte.dev/docs/svelte/v5-migration-guide
- Getting Started: https://svelte.dev/docs/svelte/getting-started

**Core Runes**:
- `$state` — Declare reactive state variables
- `$derived` — Create computed/derived values
- `$effect` — Run side effects when dependencies change
- `$props` — Define component properties
- `$bindable` — Create bindable properties

**Architecture**: Svelte 5's reactivity is powered by signals under the hood, but you interact with runes, not signals directly.

---

### Vite 5

**Official Documentation**: https://vitejs.dev/

**Key Resources**:
- Configuration: https://vitejs.dev/config/
- Plugin API: https://vitejs.dev/guide/api-plugin.html
- Build Options: https://vitejs.dev/guide/build.html

---

## Styling

### Tailwind CSS v4

**Official Documentation**: https://tailwindcss.com/

**Key Resources**:
- v4 Release Announcement: https://tailwindcss.com/blog/tailwindcss-v4
- Upgrade Guide: https://tailwindcss.com/docs/upgrade-guide
- Beta Documentation: https://tailwindcss.com/blog/tailwindcss-v4-beta

**Release Date**: January 22, 2025 (stable)

**Key Features in v4**:
- Full builds up to 5x faster
- Incremental builds over 100x faster (measured in microseconds)
- Automatic content detection (no configuration required)
- CSS-First Configuration (customize in CSS, not JavaScript)
- Built on cascade layers, `@property`, and `color-mix()`

**Browser Support**: Safari 16.4+, Chrome 111+, Firefox 128+

**Installation**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Database & Real-time

### Supabase JavaScript Client

**Official Documentation**: https://supabase.com/docs

**Key Resources**:
- JavaScript API Reference: https://supabase.com/docs/reference/javascript/introduction
- Client Libraries: https://supabase.com/docs/guides/api/rest/client-libs
- SSR Client Creation: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- GitHub Repository: https://github.com/supabase/supabase-js
- npm Package: https://www.npmjs.com/package/@supabase/supabase-js

**Capabilities**:
- Interact with Postgres database
- Listen to database changes (real-time)
- Invoke Deno Edge Functions
- Build login and user management
- Manage large files

**Installation**:
```bash
npm install @supabase/supabase-js
```

**Repository Structure**: Monorepo with libraries in `packages/core/`

---

## Deployment

### @sveltejs/adapter-vercel

**Official Documentation**: https://svelte.dev/docs/kit/adapter-vercel

**Key Resources**:
- SvelteKit Adapters: https://svelte.dev/docs/kit/adapters
- Vercel SvelteKit Docs: https://vercel.com/docs/frameworks/full-stack/sveltekit.md
- Vercel Adapter Guide: https://vercel.com/docs/beginner-sveltekit/adapters
- npm Package: https://www.npmjs.com/package/@sveltejs/adapter-vercel

**Installation**:
```bash
npm install -D @sveltejs/adapter-vercel
```

**Configuration Options**:
- `runtime` — `'edge'`, `'nodejs20.x'`, or `'nodejs22.x'`
- `regions` — Array of edge network regions (default: `["iad1"]`) or `'all'` for edge runtime
- `split` — Enable route splitting for optimized deployments
- Image configuration for Vercel image optimization
- ISR (Incremental Static Regeneration) support

**Recommendation**: Vercel recommends installing adapter-vercel yourself (rather than using adapter-auto) for version stability and configuration control.

---

## Testing

### Vitest

**Official Documentation**: https://vitest.dev/

**Key Resources**:
- Getting Started: https://vitest.dev/guide/
- Configuration: https://vitest.dev/config/
- GitHub Repository: https://github.com/vitest-dev/vitest
- npm Package: https://www.npmjs.com/package/vitest
- DevDocs (searchable): https://devdocs.io/vitest/

**Latest Versions** (as of 2025):
- Vitest 3.0 — Released January 17, 2025
- Vitest 4.0 — Released October 22, 2025

**Key Features**:
- Next generation testing framework powered by Vite
- Native code coverage via v8 or istanbul
- Tinyspy built-in for mocking, stubbing, and spies
- Browser-based testing (stable in v4.0)
- Visual regression capabilities (v4.0)
- Playwright trace integration (v4.0)

**Weekly Downloads**: 7.7M (npm)

**Installation**:
```bash
npm install -D vitest
```

---

## Utilities

### date-fns

**Official Documentation**: https://date-fns.org/

**Key Resources**:
- Getting Started: https://date-fns.org/docs/Getting-Started
- GitHub Repository: https://github.com/date-fns/date-fns
- npm Package: https://www.npmjs.com/package/date-fns
- DevDocs (searchable): https://devdocs.io/date_fns/

**Weekly Downloads**: 26.9M (npm)

**Key Features**:
- 200+ functions for date manipulation
- Modular: Pick what you need
- Immutable & Pure: Always returns new date instances
- 100% TypeScript with handcrafted types

**Installation**:
```bash
npm install date-fns --save
```

**Timezone Support**: Available via companion package `date-fns-tz`
```bash
npm install date-fns-tz --save
```

---

## TypeScript

### TypeScript 5.x

**Official Documentation**: https://www.typescriptlang.org/

**Key Resources**:
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- TSConfig Reference: https://www.typescriptlang.org/tsconfig
- Release Notes: https://www.typescriptlang.org/docs/handbook/release-notes/overview.html

---

## Workflow Best Practices

### Documentation-First Development

**MANDATORY RULE**: Before implementing ANY feature, configuration, or using ANY command:

1. **Search Official Docs**: Use WebSearch or WebFetch to find official documentation
2. **Verify Syntax**: Check command syntax, available options, and recommended patterns
3. **Check Version**: Ensure you're using the correct syntax for the version you're targeting
4. **Review Examples**: Look for official examples in the documentation
5. **Document Reference**: Add links to the relevant docs in code comments or commit messages

### Example: Before using `sv create`

**DON'T**:
```bash
# Guessing the command syntax
npm create svelte@latest . --template skeleton --types typescript
```

**DO**:
```bash
# Step 1: Search for official documentation
WebSearch "sv create official documentation 2025"

# Step 2: Fetch the exact syntax from official docs
WebFetch https://svelte.dev/docs/cli/sv-create

# Step 3: Use the correct, verified syntax
npx sv create --template minimal --types ts --no-add-ons
```

### Error Prevention Checklist

Before running ANY command or writing ANY configuration:

- [ ] Have you checked the official documentation?
- [ ] Is the command syntax verified against official docs?
- [ ] Are all flags and options correct for this version?
- [ ] Have you reviewed official examples?
- [ ] Is the package version compatible with other dependencies?

### Documentation References in Code

Add documentation references in comments when using framework-specific features:

```typescript
// Reference: https://svelte.dev/docs/svelte/what-are-runes
let matches = $state<Match[]>([]);
let filtered = $derived(matches.filter(m => m.live));

// Reference: https://supabase.com/docs/reference/javascript/subscribe
const subscription = supabase
  .channel(`match:${matchId}`)
  .on('postgres_changes', { /* ... */ }, handler)
  .subscribe();
```

---

## Version Compatibility Matrix

| Package | Version | Released | Notes |
|---------|---------|----------|-------|
| SvelteKit | 2.0+ | 2025 | Latest stable |
| Svelte | 5.x | 2025 | Runes-based reactivity |
| Tailwind CSS | 4.0 | Jan 22, 2025 | CSS-first config |
| Supabase JS | Latest | 2025 | Monorepo structure |
| Vitest | 4.0+ | Oct 22, 2025 | Browser testing stable |
| @sveltejs/adapter-vercel | Latest | 2025 | Supports Node 20.x/22.x |
| date-fns | Latest | 2025 | 100% TypeScript |
| Vite | 5.x | 2025 | Required for SvelteKit 2.0 |

---

## Quick Reference Commands

### Verify Installation
```bash
# Check Node version (required: 18+)
node --version

# Check npm version
npm --version

# Check installed package versions
npm list --depth=0
```

### Access Help
```bash
# SvelteKit CLI help
npx sv --help
npx sv create --help

# Vite help
npx vite --help

# Vitest help
npx vitest --help
```

---

## Additional Resources

### Community & Support

- **SvelteKit Discord**: https://svelte.dev/chat
- **Supabase Discord**: https://discord.supabase.com/
- **Stack Overflow**: Use tags `sveltekit`, `svelte`, `supabase`, `tailwindcss`

### Learning Resources

- **SvelteKit Tutorial**: https://learn.svelte.dev/
- **Svelte 5 Runes Tutorial**: Included in learn.svelte.dev
- **Tailwind CSS Screencasts**: https://tailwindcss.com/screencasts

---

## Update Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-02 | Initial creation with all core dependencies | Claude |

---

**Remember**: This document should be consulted BEFORE every implementation step. When in doubt, search the official docs first!
