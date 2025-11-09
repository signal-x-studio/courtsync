# CourtSync Design System

A comprehensive design system featuring Vercel-inspired dark mode and Supabase-inspired light mode with basketball aesthetics.

## Overview

This design system provides a cohesive visual language for the CourtSync application, balancing professional polish with sports energy.

### Design Philosophy

- **Dark Mode**: Vercel-inspired with true black backgrounds and high contrast
- **Light Mode**: Supabase-inspired with soft, approachable grays
- **Primary Color**: Basketball Orange (#f97316) - Energy and competition
- **Secondary Color**: Court Blue (#3b82f6) - Professionalism and trust
- **Accent Color**: Court Gold (#d4af37) - Excellence and achievement

## Viewing the Style Guide

Navigate to `/style-guide` in your browser to view the complete design system documentation with live component examples.

**Local Development**: http://localhost:5173/style-guide

## Color Palette

### Primary Colors (Basketball Orange)
- 50-900 scale for various use cases
- Main: `primary-500` (#f97316)

### Secondary Colors (Court Blue)
- 50-900 scale for various use cases
- Main: `secondary-500` (#3b82f6)

### Accent Colors (Court Gold)
- 50-900 scale for various use cases
- Main: `accent-500` (#d4af37)

### Semantic Colors
- **Success**: Green tones for wins and positive actions
- **Warning**: Amber tones for caution and pending states
- **Error**: Red tones for losses and danger states
- **Info**: Sky blue for neutral information

## Typography

### Font Families
- **Sans-serif**: System font stack optimized for readability
- **Monospace**: For scores, metrics, and code

### Font Sizes
- `xs` (12px) - Small labels
- `sm` (14px) - Body text
- `base` (16px) - Default
- `lg` (18px) - Headings
- `xl` (20px) - Subheadings
- `2xl` (24px) - Page titles
- `3xl` (30px) - Hero text
- `4xl` (36px) - Display text
- `5xl` (48px) - Large scores

## Components

### Buttons
- **Variants**: primary, secondary, accent, outline, ghost
- **Sizes**: sm, default, lg
- **States**: default, hover, active, disabled, focus

### Forms
- **Input**: Text inputs with focus states
- **Textarea**: Multi-line text inputs
- **Select**: Dropdown selections

### Cards
- **Default**: Standard bordered card
- **Hover**: Subtle elevation on hover
- **Interactive**: Full interactive card with click states

### Badges
- **Variants**: primary, secondary, accent, success, warning, error
- **Usage**: Status indicators, labels, tags

### Alerts
- **Variants**: info, success, warning, error
- **Usage**: System messages and notifications

### Tables
- Standard table styling with hover states
- Responsive design

## Layout

### Spacing Scale
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px
- `4xl`: 96px

### Border Radius
- `sm`: 4px
- `md`: 8px
- `lg`: 12px
- `xl`: 16px
- `2xl`: 24px
- `full`: 9999px (pill shape)

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Usage

### CSS Custom Properties

The design system uses CSS custom properties for theming:

```css
/* Light mode (default) */
--bg: var(--color-light-bg);
--fg: var(--color-light-fg);
--muted: var(--color-light-muted);
--subtle: var(--color-light-subtle);
--border: var(--color-light-border);
--border-hover: var(--color-light-border-hover);

/* Dark mode */
.dark {
  --bg: var(--color-dark-bg);
  --fg: var(--color-dark-fg);
  /* ... */
}
```

### Utility Classes

Common utility classes available:

```html
<!-- Text colors -->
<p class="text-muted">Muted text</p>

<!-- Backgrounds -->
<div class="bg-subtle">Subtle background</div>

<!-- Borders -->
<div class="border-default">Default border</div>

<!-- Cards -->
<div class="card">Standard card</div>
<div class="card-hover">Hover card</div>
<div class="card-interactive">Interactive card</div>

<!-- Buttons -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary btn-sm">Small Secondary</button>

<!-- Inputs -->
<input class="input" placeholder="Text input" />
<textarea class="textarea"></textarea>
<select class="select">...</select>

<!-- Badges -->
<span class="badge badge-success">Success</span>

<!-- Alerts -->
<div class="alert alert-info">Information</div>
```

### Component Classes

#### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

#### Score Visualization
```html
<div class="score-bar">
  <div class="score-fill bg-primary-500" style="width: 75%"></div>
</div>

<span class="score-number">42</span>
```

#### Metrics
```html
<div>
  <p class="metric-label">Total Wins</p>
  <p class="metric-value">156</p>
</div>
```

## Dark Mode Support

All components automatically adapt to dark mode when the `.dark` class is applied to the root element or any parent container.

```html
<!-- Enable dark mode -->
<html class="dark">
  <!-- All components will use dark mode colors -->
</html>
```

## Best Practices

1. **Consistency**: Use design tokens and utility classes instead of arbitrary values
2. **Accessibility**: Ensure sufficient color contrast (WCAG AA minimum)
3. **Responsiveness**: Test components across all breakpoints
4. **Performance**: Use CSS custom properties for dynamic theming
5. **Semantic Colors**: Use semantic colors (success, warning, error) for status indicators

## Migration from Previous System

The new design system maintains backward compatibility while introducing:
- Extended color palette with semantic meanings
- Consistent spacing and typography scales
- Enhanced component states and interactions
- Improved dark mode support
- Basketball-themed color scheme

## Resources

- **Style Guide**: `/style-guide` - Interactive component showcase
- **Source**: `src/app.css` - Complete design system implementation
- **Tailwind v4**: Uses CSS-first configuration with `@theme` directive
