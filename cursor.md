# Cursor AI Instructions

This file contains instructions for Cursor AI when working on this codebase.

## Development Guides - REQUIRED READING

Before making any changes, **MUST** read and follow these guides:

1. **Tech Stack Guide**: `docs/agent-guide-tech-stack.md`
   - SvelteKit framework conventions
   - TypeScript patterns
   - Project structure
   - Build configuration

2. **Tailwind CSS Guide**: `docs/agent-guide-tailwind-css.md`
   - Tailwind v4 CSS-based configuration
   - Color palette usage
   - Styling conventions
   - Responsive patterns

3. **Design System Guide**: `docs/agent-guide-design-system.md`
   - Component patterns
   - Design tokens
   - Typography scale
   - Layout conventions

4. **AES API Guide**: `docs/agent-guide-aes-api.md`
   - API endpoints
   - Error handling
   - Type definitions
   - Usage patterns

## Critical Constraints

### Framework
- **SvelteKit** only - `.svelte` files, NOT React
- **TypeScript** required - no JavaScript
- **No React hooks** - use Svelte stores and reactive statements

### Styling
- **Tailwind CSS v4** - CSS `@theme` configuration
- **NO `tailwind.config.js`** - Will cause build errors
- **Utility classes only** - No inline styles for static values
- **Color tokens**: `charcoal-*` and `gold-*` palette

### File Structure
- Components: `src/lib/components/` - PascalCase `.svelte`
- Stores: `src/lib/stores/` - camelCase `.ts`
- Services: `src/lib/services/` - API clients
- Types: `src/lib/types/index.ts` - Centralized types

### Import Paths
- Always use `$lib/` alias
- Example: `import { fetchCourtSchedule } from '$lib/services/api'`
- Example: `import type { FilteredMatch } from '$lib/types'`

## Code Generation Rules

### Component Template
```svelte
<script lang="ts">
  import type { FilteredMatch } from '$lib/types';
  import { someStore } from '$lib/stores/someStore';
  
  export let prop: Type;
  
  $: computed = prop.value * 2;
  
  function handleAction() {
    // Handler logic
  }
</script>

<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <!-- Content with Tailwind classes -->
</div>
```

### API Pattern
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
    error = err instanceof Error ? err.message : 'Failed to load';
  } finally {
    loading = false;
  }
}
```

### Styling Pattern
```svelte
<!-- Button -->
<button class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400 transition-colors min-h-[44px] sm:min-h-0">
  Action
</button>

<!-- Input -->
<input
  class="w-full px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 focus:border-gold-500 focus:outline-none"
  style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
/>
```

## Validation Checklist

Before submitting code, verify:

- [ ] Uses SvelteKit (`.svelte` files), not React
- [ ] TypeScript types defined (no `any`)
- [ ] Tailwind utility classes (no inline styles for static values)
- [ ] Responsive classes included (`sm:`, `md:`, `lg:`)
- [ ] Touch targets (`min-h-[44px]` on mobile)
- [ ] Error handling for API calls
- [ ] Loading states implemented
- [ ] Hover and focus states included
- [ ] Uses `$lib/` import alias
- [ ] Follows color palette (charcoal/gold)
- [ ] No `tailwind.config.js` created

## Common Errors to Avoid

- ❌ Creating React components instead of Svelte
- ❌ Creating `tailwind.config.js` (Tailwind v4 uses CSS)
- ❌ Using inline styles for static colors
- ❌ Missing error handling in API calls
- ❌ Forgetting responsive classes
- ❌ Using `any` type in TypeScript
- ❌ Not using `$lib/` import alias
- ❌ Missing accessibility features

## Quick Reference

**Colors**:
- Background: `bg-charcoal-950`
- Card: `bg-charcoal-800`
- Text: `text-charcoal-50`
- Muted: `text-charcoal-400`
- Primary: `bg-gold-500`

**Spacing**: `gap-3`, `gap-4`, `p-4`, `px-3 py-2`

**Border Radius**: `rounded-lg` (8px)

**Responsive**: `flex-col sm:flex-row`, `min-h-[44px] sm:min-h-0`

## When Unsure

1. Check the relevant guide in `docs/agent-guide-*.md`
2. Look at similar existing components
3. Verify patterns match the codebase
4. Test responsive behavior
5. Ensure TypeScript types are correct

## Guides Location

All guides are in `docs/` directory:
- `docs/agent-guide-tech-stack.md`
- `docs/agent-guide-tailwind-css.md`
- `docs/agent-guide-design-system.md`
- `docs/agent-guide-aes-api.md`
