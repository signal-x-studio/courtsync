# Tailwind CSS & Styling Guide for Agents

This guide outlines the proper implementation of Tailwind CSS and CSS styling conventions used in this project. **Agents must follow these patterns strictly.**

## Tailwind CSS Version

- **Version**: 4.1.16
- **Important**: This is Tailwind CSS v4, which has significant differences from v3
- **Configuration**: CSS-based via `@theme` directive (NO `tailwind.config.js` file)

## Setup & Configuration

### CSS Import

Tailwind is imported in `src/app.css`:

```css
@import "tailwindcss";

@source "../**/*.{svelte,js,ts}";
```

The `@source` directive tells Tailwind which files to scan for classes.

### Theme Configuration

Custom theme values are defined in `src/app.css` using the `@theme` directive:

```css
@theme {
  /* Custom color tokens */
  --color-charcoal-50: #f8f8f9;
  --color-charcoal-100: #e4e4e7;
  /* ... more charcoal shades ... */
  
  --color-gold-50: #fefce8;
  --color-gold-100: #fef9c3;
  /* ... more gold shades ... */
  
  /* Semantic colors */
  --color-background: #18181b;
  --color-foreground: #f8f8f9;
  --color-border: #454654;
}
```

## Color Palette

### Charcoal Palette (Dark Grays)

Use for backgrounds, borders, and muted text:

- `charcoal-50` through `charcoal-950` (50 = lightest, 950 = darkest)
- Examples: `bg-charcoal-800`, `text-charcoal-400`, `border-charcoal-600`

### Gold Palette (Accent/Yellow)

Use for primary actions, highlights, and accents:

- `gold-50` through `gold-950`
- Examples: `bg-gold-500`, `text-gold-300`, `border-gold-600`

### Semantic Colors

- `background` - Main background color (`#18181b`)
- `foreground` - Main text color (`#f8f8f9`)
- `border` - Default border color (`#454654`)

## Styling Conventions

### 1. Use Tailwind Utility Classes

**✅ CORRECT**:
```svelte
<button class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400">
  Click me
</button>
```

**❌ WRONG**:
```svelte
<button style="padding: 1rem; background: #eab308;">
  Click me
</button>
```

### 2. Inline Styles Only for Dynamic Values

Use inline `style` attribute ONLY when values are dynamic (computed from JavaScript):

**✅ CORRECT**:
```svelte
<div style="background-color: {match.Division.ColorHex};">
  Match Info
</div>
```

**❌ WRONG**:
```svelte
<!-- Static colors should use Tailwind classes -->
<div style="background-color: #454654;">
  Match Info
</div>
```

### 3. Color Usage Patterns

#### Background Colors

- **Dark backgrounds**: `bg-charcoal-800`, `bg-charcoal-900`, `bg-charcoal-950`
- **Card backgrounds**: `bg-charcoal-800`, `bg-charcoal-700`
- **Input backgrounds**: `bg-charcoal-700` or `bg-[#454654]` (if exact match needed)
- **Primary actions**: `bg-gold-500` or `bg-gold-600`
- **Hover states**: `hover:bg-gold-400`, `hover:bg-charcoal-600`

#### Text Colors

- **Primary text**: `text-charcoal-50` or `text-[#f8f8f9]`
- **Secondary text**: `text-charcoal-400` or `text-[#9fa2ab]`
- **Muted text**: `text-charcoal-500` or `text-[#808593]`
- **Accent text**: `text-gold-500` or `text-gold-400`
- **Labels**: `text-charcoal-400` or `text-[#9fa2ab]` with `text-xs`

#### Border Colors

- **Default borders**: `border-charcoal-600` or `border-[#525463]`
- **Focus borders**: `focus:border-gold-500` or `focus:border-[#eab308]`
- **Hover borders**: `hover:border-charcoal-500`

### 4. Spacing & Layout

- **Padding**: `p-2`, `p-3`, `p-4` (8px, 12px, 16px)
- **Margin**: `m-2`, `m-3`, `m-4`
- **Gap**: `gap-2`, `gap-3`, `gap-4` for flex/grid
- **Rounded corners**: `rounded`, `rounded-lg` (4px, 8px)
- **Border radius**: `rounded-lg` for cards, `rounded` for buttons

### 5. Typography

- **Font sizes**: `text-xs`, `text-sm`, `text-base`, `text-lg`
- **Font weights**: `font-medium`, `font-semibold`, `font-bold`
- **Uppercase labels**: `text-xs text-[#9fa2ab] uppercase tracking-wider`

### 6. Responsive Design

Use Tailwind breakpoints:

- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up

**Pattern**: Mobile-first, then add responsive classes:

```svelte
<div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <!-- Mobile: column, Desktop: row -->
</div>
```

**Touch-friendly sizes**:
- Use `min-h-[44px]` for interactive elements on mobile
- Use `sm:min-h-0` to remove min-height on desktop

### 7. States & Interactions

#### Hover States

```svelte
<button class="bg-charcoal-700 hover:bg-charcoal-600 transition-colors">
  Hover me
</button>
```

#### Focus States

```svelte
<input class="focus:border-gold-500 focus:outline-none">
```

#### Disabled States

```svelte
<button class="disabled:opacity-50 disabled:cursor-not-allowed" disabled>
  Disabled
</button>
```

#### Active States

```svelte
<button class="active:scale-95 transition-transform">
  Click me
</button>
```

### 8. Common Component Patterns

#### Buttons

```svelte
<!-- Primary button -->
<button class="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg hover:bg-gold-400 transition-colors">
  Primary Action
</button>

<!-- Secondary button -->
<button class="px-4 py-2 bg-charcoal-700 text-charcoal-100 rounded-lg hover:bg-charcoal-600 transition-colors border border-charcoal-600">
  Secondary Action
</button>

<!-- Small button -->
<button class="px-2 py-1 text-xs font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400">
  Small
</button>
```

#### Input Fields

```svelte
<input
  type="text"
  class="w-full px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 focus:border-gold-500 focus:outline-none"
  style="background-color: #454654; color: #f8f8f9; border: 1px solid #525463;"
/>
```

#### Cards/Panels

```svelte
<div class="bg-charcoal-800 rounded-lg border border-charcoal-600 p-4">
  <!-- Card content -->
</div>
```

#### Labels

```svelte
<label class="block text-xs text-[#9fa2ab] mb-1.5">
  Label Text
</label>
```

## Base Styles (src/app.css)

The following base styles are defined and should be respected:

### Focus Styles

```css
*:focus-visible {
  outline: 2px solid #eab308;
  outline-offset: 2px;
}
```

### Scrollbar Styles

Custom scrollbar styling for dark theme:
- Track: `#3b3c48`
- Thumb: `#525463`
- Hover thumb: `#6b6d7a`

### Print Styles

Print-specific styles are defined in `@layer utilities`:

```css
@media print {
  .no-print {
    display: none !important;
  }
  
  body {
    background: white;
    color: black;
  }
}
```

Use `no-print` class to hide elements when printing.

## Accessibility

### Focus Indicators

- Always use `focus:border-gold-500` or `focus:outline-none` with custom focus styles
- Focus styles are defined globally in `app.css`

### Color Contrast

- Ensure sufficient contrast between text and background
- Use `text-charcoal-50` on dark backgrounds
- Use `text-charcoal-950` on light backgrounds

### Reduced Motion

Respect `prefers-reduced-motion` (handled in base styles):

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Common Mistakes to Avoid

### ❌ Don't Create tailwind.config.js

Tailwind v4 doesn't use a config file. Use `@theme` in CSS instead.

### ❌ Don't Use Arbitrary Colors for Static Values

**Wrong**:
```svelte
<div class="bg-[#454654]">
```

**Correct**:
```svelte
<div class="bg-charcoal-700">
```

### ❌ Don't Mix Inline Styles with Tailwind

**Wrong**:
```svelte
<div class="bg-charcoal-800" style="color: #f8f8f9;">
```

**Correct**:
```svelte
<div class="bg-charcoal-800 text-charcoal-50">
```

### ❌ Don't Use Custom CSS When Tailwind Can Handle It

**Wrong**:
```svelte
<style>
  .my-card {
    padding: 1rem;
    background: #454654;
  }
</style>
```

**Correct**:
```svelte
<div class="p-4 bg-charcoal-700">
```

## When to Use Custom CSS

Only use `<style>` blocks or custom CSS when:

1. **Complex animations** - Not achievable with Tailwind utilities
2. **Pseudo-elements** - `::before`, `::after` with complex content
3. **Print-specific styles** - Use `@media print` in `app.css`
4. **Dynamic styles** - Styles that depend on computed values that can't be done with Tailwind

**Example** (valid custom CSS):
```svelte
<style>
  .timeline-bar {
    position: absolute;
    left: var(--position);
    width: var(--width);
  }
</style>
```

## Hex Color Values Reference

For inline styles or when exact color matches are needed:

- **Background**: `#18181b` (charcoal-950)
- **Foreground**: `#f8f8f9` (charcoal-50)
- **Border**: `#454654` (charcoal-800)
- **Card bg**: `#3b3c48` (charcoal-900) or `#454654` (charcoal-800)
- **Input bg**: `#454654` (charcoal-800)
- **Muted text**: `#9fa2ab` (charcoal-400)
- **Secondary text**: `#c0c2c8` (charcoal-300)
- **Gold primary**: `#eab308` (gold-500)
- **Gold hover**: `#facc15` (gold-400)

## Summary Checklist

When styling components, ensure:

- [ ] Use Tailwind utility classes for all static styles
- [ ] Use inline `style` only for dynamic/computed values
- [ ] Use charcoal palette for backgrounds and borders
- [ ] Use gold palette for primary actions and accents
- [ ] Include hover and focus states
- [ ] Use responsive classes (`sm:`, `md:`, `lg:`)
- [ ] Add `min-h-[44px]` for mobile touch targets
- [ ] Use `transition-colors` or `transition-all` for smooth state changes
- [ ] Follow spacing scale (2, 3, 4 = 8px, 12px, 16px)
- [ ] Use semantic color names (`charcoal-*`, `gold-*`) instead of arbitrary values
