# Claude AI Assistant Instructions

This file contains instructions for Claude AI assistants working on this codebase.

## Development Guides - MUST FOLLOW

When making any changes to this codebase, you **MUST** follow these comprehensive development guides:

1. **Tech Stack Guide** (`docs/agent-guide-tech-stack.md`)
   - Understand SvelteKit framework conventions
   - Follow TypeScript patterns and type definitions
   - Use proper project structure and import paths
   - Understand build process and tooling

2. **Tailwind CSS & Styling Guide** (`docs/agent-guide-tailwind-css.md`)
   - Use Tailwind CSS v4 correctly (NO `tailwind.config.js`)
   - Follow color palette conventions (charcoal and gold)
   - Use utility classes instead of inline styles
   - Implement responsive design patterns
   - Ensure accessibility compliance

3. **Design System Guide** (`docs/agent-guide-design-system.md`)
   - Use correct component patterns (buttons, inputs, cards)
   - Follow typography scale and spacing conventions
   - Maintain consistent visual design
   - Use proper color tokens and design tokens

4. **AES API Guide** (`docs/agent-guide-aes-api.md`)
   - Use correct API endpoints from `$lib/services/api`
   - Handle errors properly with try-catch blocks
   - Follow date format conventions (YYYY-MM-DD)
   - Use TypeScript types from `$lib/types`

## Critical Rules

### Tech Stack
- **Framework**: SvelteKit (NOT React) - use `.svelte` files
- **Language**: TypeScript - always use types
- **Styling**: Tailwind CSS v4 - CSS-based configuration
- **Build**: Vite with static adapter

### Code Style
- Use `$lib/` import alias for all lib imports
- Components: PascalCase (e.g., `MatchList.svelte`)
- Stores: camelCase (e.g., `coveragePlan.ts`)
- Always use TypeScript types - avoid `any`
- Define types in `src/lib/types/index.ts`

### Styling Rules
- **NEVER** create `tailwind.config.js` - Tailwind v4 uses CSS `@theme`
- Use Tailwind utility classes for all static styles
- Use inline `style` attribute ONLY for dynamic/computed values
- Use charcoal palette for backgrounds/borders
- Use gold palette for primary actions
- Always include hover and focus states
- Use responsive classes (`sm:`, `md:`, `lg:`)
- Mobile-first: `min-h-[44px]` for touch targets

### API Integration
- Always import from `$lib/services/api`
- Wrap API calls in try-catch blocks
- Show loading states during API calls
- Display user-friendly error messages
- Use types from `$lib/types`

### Component Patterns
- Use Svelte stores for state management
- Use reactive statements: `$: reactiveVar = ...`
- Use `onMount` and `onDestroy` for lifecycle hooks
- Export props: `export let propName: Type`

## Before Making Changes

1. Read the relevant guide from `docs/agent-guide-*.md`
2. Check existing code patterns in similar components
3. Ensure TypeScript types are correct
4. Verify styling follows design system
5. Test responsive behavior
6. Ensure accessibility (focus states, contrast)

## Common Mistakes to Avoid

- ❌ Don't create `tailwind.config.js`
- ❌ Don't use React patterns (hooks, JSX) - this is SvelteKit
- ❌ Don't use inline styles for static values
- ❌ Don't skip error handling in API calls
- ❌ Don't use `any` type in TypeScript
- ❌ Don't forget responsive classes
- ❌ Don't skip accessibility features

## Reference

Always refer to the guides in `docs/` directory when unsure:
- `docs/agent-guide-tech-stack.md` - Tech stack overview
- `docs/agent-guide-tailwind-css.md` - Styling conventions
- `docs/agent-guide-design-system.md` - Design patterns
- `docs/agent-guide-aes-api.md` - API integration
