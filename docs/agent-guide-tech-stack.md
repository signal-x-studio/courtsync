# Tech Stack Guide for Agents

This guide provides an overview of the technology stack used in this project. Agents should understand these technologies and their conventions when making changes to the codebase.

## Core Technologies

### Framework: SvelteKit

- **Version**: 2.7.0
- **Language**: TypeScript
- **Architecture**: SPA (Single Page Application) mode with static adapter
- **Key Characteristics**:
  - Server-side rendering (SSR) disabled - pure client-side app
  - File-based routing via `src/routes/` directory
  - Component-based architecture using `.svelte` files
  - Reactive state management with Svelte stores

#### SvelteKit Conventions

1. **Components**: Located in `src/lib/components/` with `.svelte` extension
2. **Routes**: Located in `src/routes/` directory
   - `+layout.svelte` - Layout wrapper for routes
   - `+page.svelte` - Page components
   - `+layout.ts` - Layout load functions (if needed)
   - `+page.ts` - Page load functions (if needed)
3. **Stores**: Located in `src/lib/stores/` - Svelte stores for state management
4. **Services**: Located in `src/lib/services/` - API clients and external services
5. **Utils**: Located in `src/lib/utils/` - Utility functions
6. **Types**: Located in `src/lib/types/` - TypeScript type definitions

#### Import Paths

- Use `$lib/` alias for imports from `src/lib/`
- Example: `import { fetchCourtSchedule } from '$lib/services/api'`
- Example: `import type { FilteredMatch } from '$lib/types'`

### Build Tool: Vite

- **Version**: 6.0.0
- **Configuration**: `vite.config.ts`
- **Plugins**: `@sveltejs/vite-plugin-svelte` for SvelteKit support
- **Hot Module Replacement**: Enabled in development mode

### Styling: Tailwind CSS v4

- **Version**: 4.1.16
- **Configuration**: No separate config file - uses CSS-based configuration via `@theme` directive
- **PostCSS**: Configured via `postcss.config.js` with `@tailwindcss/postcss` plugin
- **Import**: `@import "tailwindcss"` in CSS files
- **Source**: Automatically scans `.svelte`, `.js`, and `.ts` files for class names

**⚠️ Important**: This project uses Tailwind CSS v4, which has different syntax than v3:
- No `tailwind.config.js` file
- Theme configuration via CSS `@theme` directive
- Custom colors defined as CSS variables

### TypeScript

- **Version**: ~5.9.3
- **Configuration Files**:
  - `tsconfig.json` - Base configuration
  - `tsconfig.app.json` - Application-specific config
  - `tsconfig.node.json` - Node.js-specific config
- **Strict Mode**: Enabled
- **Type Checking**: Run with `npm run check`

### Static Adapter

- **Adapter**: `@sveltejs/adapter-static` v3.0.1
- **Build Output**: `build/` directory
- **Fallback**: `index.html` for SPA routing
- **Prerendering**: Disabled (pure SPA)

## Project Structure

```
src/
├── app.css              # Main Tailwind CSS file with theme
├── app.html             # HTML template
├── lib/
│   ├── components/     # Svelte components (.svelte)
│   ├── services/       # API clients and services
│   ├── stores/         # Svelte stores for state
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── routes/              # SvelteKit routes
│   ├── +layout.svelte  # Root layout
│   ├── +layout.ts      # Layout load function
│   ├── +page.svelte    # Home page
│   └── +page.ts        # Page load function
└── main.tsx            # Entry point (if React components exist)
```

## Development Workflow

### Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check TypeScript code
- `npm run lint` - Run ESLint
- `npm run test` - Run Playwright tests

### Build Process

1. Vite processes all source files
2. SvelteKit handles routing and component compilation
3. Tailwind CSS scans for classes and generates styles
4. PostCSS processes CSS with autoprefixer
5. Static files output to `build/` directory

## Key Libraries

### date-fns (v4.1.0)
- Date formatting and manipulation utilities
- Used in `src/lib/utils/dateUtils.ts`

### Playwright (v1.56.1)
- End-to-end testing framework
- Configuration: `playwright.config.ts`
- Test files: `tests/` directory

## Code Style & Standards

### TypeScript

- Always use TypeScript types - avoid `any`
- Define interfaces in `src/lib/types/index.ts`
- Use type imports: `import type { ... }` for types only
- Export types from a central location

### Svelte Components

- Use `<script lang="ts">` for TypeScript
- Props: `export let propName: Type`
- Reactive statements: `$: reactiveVar = ...`
- Use `onMount` and `onDestroy` for lifecycle hooks
- Component files use PascalCase: `MatchList.svelte`

### File Naming

- Components: PascalCase (e.g., `MatchList.svelte`)
- Stores: camelCase (e.g., `coveragePlan.ts`)
- Utils: camelCase (e.g., `dateUtils.ts`)
- Types: `index.ts` (centralized types)

### State Management

- Use Svelte stores for global state (`src/lib/stores/`)
- Store files should export a `writable` or `readable` store
- Access stores with `$` prefix: `$storeName`
- Use store factories for multiple instances (e.g., `createMatchClaiming`)

## Important Notes for Agents

1. **Do NOT create a `tailwind.config.js` file** - Tailwind v4 uses CSS-based configuration
2. **Always use TypeScript** - No JavaScript files unless absolutely necessary
3. **Follow SvelteKit conventions** - Use `$lib/` imports, proper routing structure
4. **Component organization** - Put reusable components in `src/lib/components/`
5. **Type safety** - Define types in `src/lib/types/index.ts` and import them
6. **State management** - Use Svelte stores, not React hooks or Vue composables
7. **Build output** - Static files go to `build/` directory (not `dist/`)

## Common Patterns

### Creating a New Component

```svelte
<script lang="ts">
  import type { FilteredMatch } from '$lib/types';
  
  export let match: FilteredMatch;
  export let onAction: () => void;
  
  let localState = false;
  
  $: computedValue = match.MatchId * 2;
</script>

<div class="match-card">
  <!-- Component markup -->
</div>

<style>
  /* Component-specific styles if needed */
  /* Prefer Tailwind classes over custom CSS */
</style>
```

### Creating a Store

```typescript
import { writable } from 'svelte/store';

export const myStore = writable<Type>(initialValue);

// Or create a store factory
export function createMyStore(initial: Type) {
  const { subscribe, set, update } = writable<Type>(initial);
  
  return {
    subscribe,
    set,
    update,
    // Custom methods
  };
}
```

### API Service Pattern

```typescript
import type { ApiResponse } from '$lib/types';

const API_BASE_URL = 'https://api.example.com';

export async function fetchData(id: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/data/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  
  return response.json();
}
```

## References

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte Documentation](https://svelte.dev/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
