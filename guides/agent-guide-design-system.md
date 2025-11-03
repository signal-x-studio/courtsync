# Design System Guide for Agents

This guide documents the design system, UI components, and visual patterns used throughout the application. Agents should follow these patterns to maintain consistency.

## Design Philosophy

- **Dark Theme**: Primary design uses dark backgrounds with light text
- **Minimalist**: Clean, uncluttered interfaces
- **Accessible**: WCAG-compliant contrast ratios and focus indicators
- **Responsive**: Mobile-first design with progressive enhancement
- **Touch-Friendly**: Minimum 44px touch targets on mobile

## Color System

### Primary Palette

#### Charcoal (Dark Grays)
Used for backgrounds, borders, and text hierarchy:

| Token | Hex | Usage |
|-------|-----|-------|
| charcoal-50 | `#f8f8f9` | Primary text on dark backgrounds |
| charcoal-100 | `#e4e4e7` | Secondary text |
| charcoal-200 | `#c0c2c8` | Tertiary text |
| charcoal-300 | `#9fa2ab` | Muted text, labels |
| charcoal-400 | `#808593` | Placeholder text |
| charcoal-500 | `#6b6d7a` | Subtle borders |
| charcoal-600 | `#525463` | Default borders |
| charcoal-700 | `#454654` | Card backgrounds |
| charcoal-800 | `#3b3c48` | Panel backgrounds |
| charcoal-900 | `#2a2b35` | Deep backgrounds |
| charcoal-950 | `#18181b` | Main background |

#### Gold (Selection & Highlights)
Used ONLY for selection states, active tabs, and highlights. NOT for primary actions or warnings.

| Token | Hex | Usage |
|-------|-----|-------|
| gold-50 | `#fefce8` | Light backgrounds |
| gold-100 | `#fef9c3` | Subtle highlights |
| gold-200 | `#fef08a` | Light accents |
| gold-300 | `#fde047` | Hover states |
| gold-400 | `#facc15` | Hover buttons |
| gold-500 | `#eab308` | SELECTION ONLY (selected matches, active tabs) |
| gold-600 | `#ca8a04` | Selection hover |
| gold-700 | `#a16207` | Selection active |
| gold-800+ | Darker shades (rarely used) |

#### Brand Blue (Primary Actions)
Used for primary actions, interactive elements:

| Token | Hex | Usage |
|-------|-----|-------|
| brand-500 | `#5b7cff` | PRIMARY ACTION buttons (Claim Match, Load, primary CTAs) |
| brand-600 | `#4b65d6` | Action hover states |

**⚠️ Critical**: Use brand-500 (blue) for primary actions, NOT gold!

### Semantic Colors

- **Background**: `charcoal-950` (`#18181b`)
- **Foreground**: `charcoal-50` (`#f8f8f9`)
- **Border**: `charcoal-600` (`#525463`)

#### Semantic Status Colors

| Color | Token | Hex | Usage |
|-------|-------|-----|-------|
| Success | `success-500` or `success-light` | `#10b981` | Covered teams, successful actions |
| Warning | `warning-500` or `warning-light` | `#f59e0b` | **Conflicts, warnings** (use this, NOT gold!) |
| Error | `error-500` or `error-light` | `#ef4444` | Critical issues, destructive actions |
| Info | `info-500` or `info-light` | `#3b82f6` | Informational messages |

**⚠️ Critical**: Conflicts must use `warning-500` (amber), NOT gold or red!

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Type Scale

- **xs**: `0.75rem` (12px) - Labels, small text
- **sm**: `0.875rem` (14px) - Body text, inputs
- **base**: `1rem` (16px) - Default body text
- **lg**: `1.125rem` (18px) - Headings, emphasis
- **xl**: `1.25rem` (20px) - Large headings

### Font Weights

- **medium**: `500` - Buttons, labels
- **semibold**: `600` - Headings, emphasis
- **bold**: `700` - Strong emphasis (rarely used)

### Text Colors

- **Primary**: `text-charcoal-50` or `text-[#f8f8f9]`
- **Secondary**: `text-charcoal-400` or `text-[#9fa2ab]`
- **Muted**: `text-charcoal-500` or `text-[#808593]`
- **Accent**: `text-gold-500` or `text-gold-400`

## Component Patterns

### Buttons

#### Primary Button

```svelte
<button class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors min-h-[44px] sm:min-h-0">
  Primary Action
</button>
```

**Use for**: Main actions, form submissions, primary CTAs

**⚠️ Use brand-500 (blue), NOT gold-500!**

#### Secondary Button

```svelte
<button class="px-4 py-2 bg-charcoal-700 text-charcoal-100 rounded-lg hover:bg-charcoal-600 transition-colors border border-charcoal-600">
  Secondary Action
</button>
```

**Use for**: Secondary actions, alternative options

#### Small Button

```svelte
<button class="px-2 py-1 text-xs font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors">
  Small Action
</button>
```

**Use for**: Compact spaces, inline actions

#### Button States

- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`
- **Loading**: Change text to "Loading..." and reduce opacity
- **Active**: `active:scale-95` for tactile feedback

### Form Inputs

#### Text Input

```svelte
<label for="inputId" class="block text-xs text-[#9fa2ab] mb-1.5">
  Label Text
</label>
<input
  id="inputId"
  type="text"
  class="w-full px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 focus:border-gold-500 focus:outline-none"
  style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
  placeholder="Placeholder text"
/>
```

#### Date Input

Same pattern as text input, use `type="date"`

#### Number Input

Same pattern as text input, use `type="number"`

#### Select Dropdown

```svelte
<select
  class="px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 focus:border-gold-500 focus:outline-none"
  style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
>
  <option>Option 1</option>
</select>
```

### Cards & Panels

#### Basic Card

```svelte
<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <!-- Card content -->
</div>
```

#### Card with Header

```svelte
<div class="bg-charcoal-800 rounded-lg border border-charcoal-600">
  <div class="px-4 py-3 border-b border-charcoal-600">
    <h3 class="text-base font-semibold text-charcoal-50">Card Title</h3>
  </div>
  <div class="p-4">
    <!-- Card content -->
  </div>
</div>
```

### Badges & Tags

#### Status Badge

```svelte
<span class="px-2 py-1 text-xs font-semibold rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600">
  Status
</span>
```

#### Highlight Badge (Gold)

```svelte
<span class="px-2 py-1 text-xs font-semibold rounded bg-gold-500/20 text-gold-400 border border-gold-500/50">
  Highlight
</span>
```

### Modals & Dialogs

#### Modal Overlay

```svelte
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  <div class="bg-charcoal-900 rounded-lg border border-charcoal-700 shadow-xl max-w-md w-full p-4">
    <!-- Modal content -->
  </div>
</div>
```

**Z-index**: Use `z-50` for modals, `z-20` for dropdowns

### Navigation & Tabs

#### Tab Group

```svelte
<div class="flex gap-1 bg-charcoal-700 rounded-lg p-1">
  <button
    class="px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 {$activeTab === 'tab1' ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-300 hover:text-charcoal-50'}"
  >
    Tab 1
  </button>
</div>
```

### Lists & Tables

#### Match List Item

```svelte
<div class="flex items-center justify-between p-3 bg-charcoal-800 rounded-lg border border-charcoal-600 hover:bg-charcoal-700 transition-colors">
  <div class="flex-1">
    <!-- Content -->
  </div>
  <div class="flex items-center gap-2">
    <!-- Actions -->
  </div>
</div>
```

### Status Indicators

#### Success Indicator

```svelte
<div class="w-2 h-2 bg-green-500 rounded-full border border-white"></div>
```

#### Warning Indicator

```svelte
<div class="w-2 h-2 bg-yellow-500 rounded-full border border-white"></div>
```

#### Error Indicator

```svelte
<div class="w-2 h-2 bg-red-500 rounded-full border border-white"></div>
```

## Layout Patterns

### Page Container

```svelte
<main class="min-h-screen bg-charcoal-950 p-4 sm:p-6">
  <!-- Page content -->
</main>
```

### Section Spacing

```svelte
<section class="space-y-4">
  <!-- Section content with consistent spacing -->
</section>
```

### Flex Layouts

```svelte
<!-- Row layout -->
<div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <!-- Responsive: column on mobile, row on desktop -->
</div>

<!-- Centered content -->
<div class="flex items-center justify-center">
  <!-- Content -->
</div>

<!-- Space between -->
<div class="flex items-center justify-between">
  <!-- Content -->
</div>
```

### Grid Layouts

```svelte
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>
```

## Responsive Breakpoints

- **Mobile**: Default (< 640px)
- **sm**: 640px and up
- **md**: 768px and up (rarely used)
- **lg**: 1024px and up

### Mobile-First Pattern

Always design for mobile first, then enhance:

```svelte
<!-- Mobile: full width, Desktop: constrained -->
<div class="w-full sm:max-w-2xl mx-auto">

<!-- Mobile: column, Desktop: row -->
<div class="flex flex-col sm:flex-row gap-3">

<!-- Mobile: large touch target, Desktop: compact -->
<button class="min-h-[44px] sm:min-h-0">
```

## Spacing Scale

Consistent spacing using Tailwind's scale:

- **2**: 8px - Tight spacing
- **3**: 12px - Default spacing
- **4**: 16px - Standard spacing
- **6**: 24px - Loose spacing
- **8**: 32px - Extra loose spacing

**Pattern**: Use `gap-3` or `gap-4` for most layouts

## Border Radius

- **rounded**: 4px - Small elements
- **rounded-lg**: 8px - Cards, buttons, inputs
- **rounded-full**: 9999px - Pills, badges, circles

## Shadows

Shadows are minimal in dark theme:

- **Dropdown hover**: `hover:shadow-lg`
- **Modals**: `shadow-xl`

## Animation & Transitions

### Transitions

```svelte
<!-- Color transitions -->
<div class="transition-colors hover:bg-charcoal-600">

<!-- All transitions -->
<div class="transition-all">
```

### Common Transitions

- **Colors**: `transition-colors` (150ms default)
- **Transform**: `transition-transform` for scale/translate
- **Opacity**: Built into opacity changes

### Reduced Motion

Respect `prefers-reduced-motion` - animations are disabled for users who prefer reduced motion (handled in base styles).

## Accessibility

### Focus Indicators

- **Default**: 2px solid gold-500 outline with 2px offset
- **Custom**: `focus:border-gold-500 focus:outline-none`

### Color Contrast

- Text on dark backgrounds: `charcoal-50` on `charcoal-950` (high contrast)
- Text on light backgrounds: `charcoal-950` on `gold-500`

### Touch Targets

- Minimum 44px height on mobile (`min-h-[44px]`)
- Remove on desktop (`sm:min-h-0`)

## Print Styles

Elements with `.no-print` class are hidden when printing:

```svelte
<button class="no-print">Hide when printing</button>
```

## Common Patterns

### Loading States

```svelte
<button
  disabled={loading}
  class="disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Loading...' : 'Submit'}
</button>
```

### Empty States

```svelte
<div class="text-center py-12 text-charcoal-400 text-sm">
  No items found
</div>
```

### Error States

```svelte
<div class="px-3 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50">
  Error message
</div>
```

### Success States

```svelte
<div class="px-3 py-2 bg-green-500/20 text-green-400 rounded border border-green-500/50">
  Success message
</div>
```

## Component Composition

### Label + Input Pattern

```svelte
<div class="flex-1">
  <label for="id" class="block text-xs text-[#9fa2ab] mb-1.5">
    Label
  </label>
  <input id="id" ... />
</div>
```

### Filter Bar Pattern

```svelte
<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
  <div class="flex items-center gap-2">
    <span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Filter:</span>
    <!-- Filter controls -->
  </div>
</div>
```

### Action Button Group

```svelte
<div class="flex items-center gap-2">
  <button>Action 1</button>
  <button>Action 2</button>
</div>
```

## Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Spacing unit | 4px (base) | All spacing multiples |
| Border radius | 4px (rounded), 8px (rounded-lg) | Consistent rounding |
| Border width | 1px | Default borders |
| Focus ring | 2px solid gold-500, 2px offset | All focusable elements |
| Transition duration | 150ms | Default transitions |
| Touch target | 44px min height | Mobile interactive elements |
| Z-index modals | 50 | Modal overlays |
| Z-index dropdowns | 20 | Dropdown menus |

## Quick Reference

**Primary Background**: `bg-charcoal-950`
**Card Background**: `bg-charcoal-800`
**Primary Text**: `text-charcoal-50`
**Muted Text**: `text-charcoal-400`
**Primary Button**: `bg-gold-500 text-charcoal-950`
**Border**: `border-charcoal-600`
**Focus**: `focus:border-gold-500`

## Checklist for New Components

When creating new components:

- [ ] Use charcoal palette for backgrounds and text
- [ ] Use gold palette for primary actions
- [ ] Include hover and focus states
- [ ] Add responsive classes (`sm:`, `md:`, `lg:`)
- [ ] Use `min-h-[44px]` for mobile touch targets
- [ ] Include `transition-colors` for state changes
- [ ] Follow spacing scale (2, 3, 4)
- [ ] Use semantic HTML elements
- [ ] Ensure color contrast meets WCAG AA
- [ ] Test with keyboard navigation
- [ ] Test on mobile viewport
