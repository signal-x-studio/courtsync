# GitHub Copilot Instructions

This file contains instructions for GitHub Copilot when working on this codebase.

## Required Reading: Development Guides

Before suggesting any code changes, **ALWAYS** reference these guides:

1. **`docs/agent-guide-tech-stack.md`** - Tech stack, SvelteKit patterns, TypeScript conventions
2. **`docs/agent-guide-tailwind-css.md`** - Tailwind CSS v4 usage, styling patterns, color palette
3. **`docs/agent-guide-design-system.md`** - Component patterns, design tokens, UI conventions
4. **`docs/agent-guide-aes-api.md`** - API endpoints, error handling, type definitions

## Code Generation Rules

### Framework & Language
- **Use SvelteKit** - Generate `.svelte` files, NOT React components
- **Use TypeScript** - Always include proper types
- **Use Svelte syntax** - `<script lang="ts">`, reactive statements `$:`, props `export let`

### Styling
- **Tailwind CSS v4** - Use utility classes only
- **NO config file** - Never generate `tailwind.config.js`
- **Color palette** - Use `charcoal-*` and `gold-*` tokens
- **Responsive** - Always include `sm:`, `md:`, `lg:` breakpoints
- **Touch targets** - Use `min-h-[44px] sm:min-h-0` for mobile

### Component Generation
```svelte
<script lang="ts">
  import type { FilteredMatch } from '$lib/types';
  
  export let match: FilteredMatch;
  
  // Use Svelte stores
  import { coveragePlan } from '$lib/stores/coveragePlan';
  
  $: computedValue = match.MatchId * 2;
</script>

<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <!-- Use Tailwind classes -->
</div>
```

### API Calls
```typescript
import { fetchCourtSchedule } from '$lib/services/api';
import type { CourtScheduleResponse } from '$lib/types';

async function loadData() {
  try {
    const data = await fetchCourtSchedule(eventId, date, timeWindow);
    // Handle success
  } catch (error) {
    // Handle error - show user-friendly message
  }
}
```

### Import Paths
- Always use `$lib/` alias: `import { ... } from '$lib/services/api'`
- Types: `import type { ... } from '$lib/types'`
- Stores: `import { ... } from '$lib/stores/...'`
- Components: `import Component from '$lib/components/Component.svelte'`

## Patterns to Follow

### Button Pattern
```svelte
<button class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400 transition-colors min-h-[44px] sm:min-h-0">
  Action
</button>
```

### Input Pattern
```svelte
<label for="id" class="block text-xs text-[#9fa2ab] mb-1.5">Label</label>
<input
  id="id"
  class="w-full px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 focus:border-gold-500 focus:outline-none"
  style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
/>
```

### Card Pattern
```svelte
<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <!-- Content -->
</div>
```

## What NOT to Generate

- ❌ React components (`.tsx` with hooks)
- ❌ `tailwind.config.js` file
- ❌ Inline styles for static values
- ❌ JavaScript files (use TypeScript)
- ❌ `any` types
- ❌ Missing error handling
- ❌ Non-responsive layouts
- ❌ Missing accessibility features

## Color Reference

**Backgrounds**: `bg-charcoal-950`, `bg-charcoal-800`, `bg-charcoal-700`
**Text**: `text-charcoal-50`, `text-charcoal-400`, `text-[#9fa2ab]`
**Primary Actions**: `bg-gold-500`, `text-gold-400`
**Borders**: `border-charcoal-600`, `border-[#525463]`
**Focus**: `focus:border-gold-500`

## Always Include

- Error handling for API calls
- Loading states
- TypeScript types
- Responsive classes
- Hover and focus states
- Accessibility features (focus indicators, ARIA labels)

## Reference the Guides

Before suggesting code, check:
- **Tech Stack**: `docs/agent-guide-tech-stack.md`
- **Styling**: `docs/agent-guide-tailwind-css.md`
- **Design**: `docs/agent-guide-design-system.md`
- **API**: `docs/agent-guide-aes-api.md`
