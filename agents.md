# Agents Development Instructions

This file contains instructions for AI agents (Claude, Copilot, Cursor, etc.) working on this codebase.

## ⚠️ CRITICAL: Read Development Guides First

**ALL agents MUST read and follow these guides before making any changes:**

### Required Guides

1. **Tech Stack Guide** (`docs/agent-guide-tech-stack.md`)
   - Complete tech stack overview
   - SvelteKit framework conventions
   - TypeScript patterns and type definitions
   - Build tooling and project structure

2. **Tailwind CSS & Styling Guide** (`docs/agent-guide-tailwind-css.md`)
   - Tailwind CSS v4 implementation (CSS-based, NO config file)
   - Color palette usage (charcoal and gold)
   - Styling conventions and patterns
   - Responsive design guidelines
   - Accessibility requirements

3. **Design System Guide** (`docs/agent-guide-design-system.md`)
   - Component patterns and templates
   - Design tokens (colors, spacing, typography)
   - Layout patterns
   - UI component specifications

4. **AES API Guide** (`docs/agent-guide-aes-api.md`)
   - All API endpoints and usage
   - Error handling patterns
   - Type definitions
   - Integration examples

## Framework Constraints

### ✅ CORRECT: SvelteKit
- Use `.svelte` files for components
- Use Svelte stores for state management
- Use reactive statements: `$:`
- Use TypeScript: `<script lang="ts">`

### ❌ WRONG: React
- Do NOT create `.tsx` files with React hooks
- Do NOT use `useState`, `useEffect`, etc.
- Do NOT use JSX syntax

## Styling Constraints

### ✅ CORRECT: Tailwind CSS v4
- Use utility classes: `class="bg-charcoal-800 text-charcoal-50"`
- Use CSS `@theme` directive (already configured)
- Use color tokens: `charcoal-*` and `gold-*`
- Use responsive classes: `sm:`, `md:`, `lg:`

### ❌ WRONG: Traditional CSS or Tailwind v3
- Do NOT create `tailwind.config.js`
- Do NOT use inline styles for static values
- Do NOT use arbitrary colors like `bg-[#454654]` (use tokens)

## Code Patterns

### Component Structure
```svelte
<script lang="ts">
  import type { FilteredMatch } from '$lib/types';
  import { someStore } from '$lib/stores/someStore';
  
  export let match: FilteredMatch;
  
  $: computedValue = match.MatchId * 2;
  
  function handleClick() {
    // Handler
  }
</script>

<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <button
    class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400 transition-colors min-h-[44px] sm:min-h-0"
    onclick={handleClick}
  >
    Action
  </button>
</div>
```

### API Integration
```typescript
import { fetchCourtSchedule } from '$lib/services/api';
import type { CourtScheduleResponse } from '$lib/types';

let loading = false;
let error: string | null = null;

async function loadSchedule() {
  loading = true;
  error = null;
  try {
    const schedule = await fetchCourtSchedule(eventId, date, timeWindow);
    // Process schedule
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load schedule';
  } finally {
    loading = false;
  }
}
```

### Store Usage
```typescript
import { writable } from 'svelte/store';

export const myStore = writable<Type>(initialValue);

// Or factory pattern
export function createMyStore(initial: Type) {
  const { subscribe, set, update } = writable<Type>(initial);
  return {
    subscribe,
    // Custom methods
  };
}
```

## Import Conventions

**Always use `$lib/` alias:**
- `import { fetchCourtSchedule } from '$lib/services/api'`
- `import type { FilteredMatch } from '$lib/types'`
- `import { coveragePlan } from '$lib/stores/coveragePlan'`
- `import Component from '$lib/components/Component.svelte'`

## Styling Checklist

When adding styles, ensure:

- [ ] Uses Tailwind utility classes (not inline styles for static values)
- [ ] Uses color tokens (`charcoal-*`, `gold-*`)
- [ ] Includes responsive classes (`sm:`, `md:`, `lg:`)
- [ ] Has hover states (`hover:bg-gold-400`)
- [ ] Has focus states (`focus:border-gold-500`)
- [ ] Mobile touch targets (`min-h-[44px] sm:min-h-0`)
- [ ] Includes transitions (`transition-colors`)
- [ ] Follows spacing scale (2, 3, 4 = 8px, 12px, 16px)

## Color Palette Quick Reference

| Use Case | Color Token | Hex Value |
|----------|------------|-----------|
| Main background | `bg-charcoal-950` | `#18181b` |
| Card background | `bg-charcoal-800` | `#3b3c48` |
| Input background | `bg-charcoal-700` | `#454654` |
| Primary text | `text-charcoal-50` | `#f8f8f9` |
| Secondary text | `text-charcoal-400` | `#9fa2ab` |
| Primary button | `bg-gold-500` | `#eab308` |
| Primary hover | `hover:bg-gold-400` | `#facc15` |
| Border | `border-charcoal-600` | `#525463` |
| Focus ring | `focus:border-gold-500` | `#eab308` |

## Common Patterns

### Button
```svelte
<button class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400 transition-colors min-h-[44px] sm:min-h-0">
  Button Text
</button>
```

### Input with Label
```svelte
<div class="flex-1">
  <label for="inputId" class="block text-xs text-[#9fa2ab] mb-1.5">
    Label Text
  </label>
  <input
    id="inputId"
    class="w-full px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 focus:border-gold-500 focus:outline-none"
    style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
  />
</div>
```

### Card
```svelte
<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <!-- Content -->
</div>
```

## Pre-Change Checklist

Before making any changes:

1. [ ] Read relevant guide from `docs/agent-guide-*.md`
2. [ ] Check existing similar components for patterns
3. [ ] Verify TypeScript types are correct
4. [ ] Ensure styling follows design system
5. [ ] Test responsive behavior
6. [ ] Verify accessibility (focus states, contrast)
7. [ ] Include error handling for API calls
8. [ ] Add loading states where needed

## Critical Mistakes to Avoid

- ❌ **Creating React components** - This is SvelteKit, use `.svelte` files
- ❌ **Creating `tailwind.config.js`** - Tailwind v4 uses CSS `@theme`
- ❌ **Using inline styles for static colors** - Use Tailwind classes
- ❌ **Skipping error handling** - Always wrap API calls in try-catch
- ❌ **Missing responsive classes** - Always include `sm:`, `md:`, `lg:`
- ❌ **Using `any` type** - Always use proper TypeScript types
- ❌ **Wrong import paths** - Always use `$lib/` alias
- ❌ **Missing accessibility** - Include focus states, ARIA labels

## Reference Links

When working on this codebase, refer to:

- **Tech Stack**: `docs/agent-guide-tech-stack.md`
- **Styling**: `docs/agent-guide-tailwind-css.md`
- **Design**: `docs/agent-guide-design-system.md`
- **API**: `docs/agent-guide-aes-api.md`

## Summary

This is a **SvelteKit + TypeScript + Tailwind CSS v4** application. Always:
1. Use Svelte components (`.svelte`)
2. Use TypeScript with proper types
3. Use Tailwind utility classes (no config file)
4. Follow the design system
5. Handle errors properly
6. Make it responsive and accessible
7. Reference the guides when unsure
