# Workspace-Wide Design System

**Version:** 1.0.0
**Last Updated:** 2025-10-24
**Maintained By:** Nino Chavez
**Scope:** All projects in ~/Workspace

## Purpose

This document serves as the unified design system reference for all projects in the workspace. It synthesizes design principles, patterns, and tokens from multiple projects to ensure consistency while allowing project-specific customization.

## Projects Analyzed

This design system is informed by:

1. **nino-chavez-gallery** - Premium photography portfolio (emotion-driven design, cinematic motion)
2. **SemantIQ** - Enterprise knowledge graph platform (depth-first hierarchy, layering system)
3. **agentic-commerce-narrator** - Commerce transformation platform (dual-mode narrative, data-centric)
4. **nino-chavez-website** - Personal brand website (modern animations, intersection observers)
5. **signal-dispatch-blog** - Athletic design blog (named timing system, prose optimization)
6. **aiq** - Analytics intelligence platform (dark mode-first, metric typography, semantic colors)

---

## Core Design Principles

### 1. Depth-First Visual Hierarchy

**Originated From:** SemantIQ, nino-chavez-gallery

Use 3-4 color shades with two-shadow technique for realistic depth perception:

```css
/* Two-Shadow Technique */
box-shadow:
  inset 0 1px 0 hsl(0 0% 100% / 0.5),  /* Subtle highlight */
  0 2px 4px hsl(0 0% 0% / 0.08),        /* Ambient shadow */
  0 4px 8px hsl(0 0% 0% / 0.06);        /* Depth shadow */
```

**Key Principle:**
- Lighter shades = elevated/interactive elements
- Darker shades = background/recessed surfaces
- Never use flat shadows alone

### 2. Data-Centric Design

**Originated From:** agentic-commerce-narrator, aiq

UI supports data exploration, never competes with content:

- 60%+ whitespace ratio for breathing room
- Clear visual hierarchy guides users through complex data
- Typography optimized for numeric display (tabular numerals)
- Semantic colors convey meaning at a glance

### 3. Motion as Enhancement, Not Decoration

**Originated From:** nino-chavez-website, signal-dispatch-blog

Every animation serves a functional purpose:

- **Named Timing System** - Semantic durations communicate intent
- **Athletic Easing** - Movement inspired by natural physics
- **Staggered Entrance** - Sequential reveals guide attention
- **Scroll-Driven** - Enhance discovery without distraction
- **60fps Performance** - Use `transform` and `opacity` only

### 4. Accessibility-First

**Originated From:** All projects

WCAG AAA compliance minimum:

- 7:1 contrast ratio for normal text
- `prefers-reduced-motion` support in all animations
- Semantic HTML for screen readers
- Keyboard navigation for all interactions
- Focus indicators with 2px minimum outline

### 5. Professional Quality Standards

**Originated From:** nino-chavez-gallery, aiq

Rivaling Linear, Stripe, Apple for polish:

- Consistent design tokens across all surfaces
- Sophisticated micro-interactions
- No emojis (use professional icon systems)
- Attention to typography details (kerning, line-height, font weights)

---

## Unified Design Token System

### Color System

#### Neutral Palette (Universal)

Used across all projects for text, backgrounds, borders:

```css
/* Light Theme Neutrals */
--neutral-50:  #f9fafb;
--neutral-100: #f3f4f6;
--neutral-200: #e5e7eb;
--neutral-300: #d1d5db;
--neutral-400: #9ca3af;
--neutral-500: #6b7280;
--neutral-600: #4b5563;
--neutral-700: #374151;
--neutral-800: #1f2937;
--neutral-900: #111827;
```

#### Brand Color Palettes (Project-Specific)

**Agentic Commerce (Blue - Progressive/Autonomous):**
```css
--brand-50:  #eff6ff;
--brand-500: #3b82f6;
--brand-900: #1e3a8a;
```

**Signal Dispatch (Violet + Orange - Athletic):**
```css
--brand-violet-500: #8b5cf6;
--brand-orange-500: #f97316;
```

**AIQ (Dark Mode - Analytics):**
```css
--bg-primary: #0D0D0D;
--bg-secondary: #1A1A1A;
--brand-accent: #3B82F6;
```

#### Semantic Data Colors (Universal for Analytics)

**Originated From:** aiq, agentic-commerce-narrator

```css
--semantic-success: #10B981;  /* Growth, positive trends, KPI increases */
--semantic-warning: #F59E0B;  /* Opportunities, caution, stagnation */
--semantic-error:   #EF4444;  /* Decline, issues, KPI decreases */
--semantic-info:    #3B82F6;  /* Neutral information, baseline data */
--semantic-neutral: #6B7280;  /* No change, baseline reference */
```

**Usage:** Apply to metrics, KPIs, trend indicators, data visualizations

#### Background Layers (Universal)

```css
/* Light Theme */
--bg-page:  hsl(210 20% 96%);  /* Page background (deepest) */
--bg-dark:  hsl(210 20% 92%);  /* Secondary containers */
--bg:       hsl(210 20% 98%);  /* Primary cards & content */
--bg-light: hsl(0 0% 100%);    /* Elevated interactive elements */

/* Dark Theme (AIQ pattern) */
--bg-page:  #0D0D0D;
--bg-dark:  #1A1A1A;
--bg:       #1F1F1F;
--bg-light: #2A2A2A;
```

---

## Typography System

### Font Families (Universal)

**Primary:** Inter Variable
```css
--font-family-base: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-family-mono: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
```

**Why Inter Variable:**
- Used across all 6 projects
- Professional, modern, highly legible
- Variable font for flexible weights
- Excellent numeric display

### Standard Type Scale

```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

### Metric-Specific Typography

**Originated From:** aiq

For dashboards, analytics, KPI displays:

```css
--text-metric-2xl: 3rem;      /* 48px - Large dashboard numbers */
--text-metric-xl:  2.25rem;   /* 36px - Standard metrics */
--text-metric-lg:  1.5rem;    /* 24px - Small metrics */
--text-metric-md:  1.125rem;  /* 18px - Metric labels */
```

**Implementation:**
```css
.text-metric-2xl {
  font-size: var(--text-metric-2xl);
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;  /* Fixed-width numbers */
}
```

### Prose Max-Widths

**Originated From:** signal-dispatch-blog

```css
--prose-width-blog:      65ch;  /* Optimal reading (45-75 chars/line) */
--prose-width-editorial: 80ch;  /* Technical docs, wider format */
--prose-width-narrow:    50ch;  /* Captions, sidebars */
```

**Usage:**
```tsx
<article className="prose-blog mx-auto">
  <p>Long-form content with optimal line length...</p>
</article>
```

---

## Motion & Animation System

### Named Duration System (Athletic/Responsive)

**Originated From:** signal-dispatch-blog

Semantic naming that communicates intent:

```css
--duration-flash:      0.06s;   /* 60ms  - Instant feedback */
--duration-reaction:   0.12s;   /* 120ms - Quick response */
--duration-quick-snap: 0.09s;   /* 90ms  - Micro-interactions */
--duration-transition: 0.16s;   /* 160ms - Standard state changes */
--duration-sequence:   0.22s;   /* 220ms - Sequential animations */
--duration-flow:       0.3s;    /* 300ms - Smooth movements */
--duration-power:      0.4s;    /* 400ms - Dramatic effects */
```

**Usage Guidelines:**
- **flash**: Instant visual feedback on clicks, taps
- **reaction**: Button state changes, immediate responses
- **quick-snap**: Snappy micro-interactions, icon animations
- **transition**: Standard hover states, color changes
- **sequence**: Staggered list items, sequential reveals
- **flow**: Smooth page transitions, modal appearances
- **power**: Dramatic reveals, feature introductions

### Named Easing Functions (Athletic System)

**Originated From:** signal-dispatch-blog

Movement inspired by natural physics:

```css
--athletic-snap:   cubic-bezier(0.4, 0, 0.2, 1);      /* Quick, responsive */
--athletic-flow:   cubic-bezier(0.25, 0.1, 0.25, 1);  /* Smooth, natural */
--athletic-power:  cubic-bezier(0.4, 0, 0.6, 1);      /* Powerful, decisive */
--athletic-sprint: cubic-bezier(0.55, 0, 0.1, 1);     /* Fast exit */
--athletic-glide:  cubic-bezier(0.25, 0, 0.75, 1);    /* Graceful movement */
--modern-ease:     cubic-bezier(0.16, 1, 0.3, 1);     /* Contemporary smooth */
```

**Usage Mapping:**
- **athletic-snap**: Button clicks, quick state changes
- **athletic-flow**: Card hovers, smooth transitions
- **athletic-power**: Page transitions, important reveals
- **athletic-sprint**: Exit animations, dismissals
- **athletic-glide**: Scrolling effects, parallax
- **modern-ease**: Contemporary UI, sophisticated feel

### Staggered Animations

**Originated From:** aiq, nino-chavez-website

Sequential entrance animations that guide attention:

```css
--stagger-delay-base: 0.05s;  /* 50ms - standard lists (3-8 items) */
--stagger-delay-fast: 0.03s;  /* 30ms - longer lists (9+ items) */
--stagger-delay-slow: 0.08s;  /* 80ms - dramatic reveals */
```

**Implementation:**
```tsx
// Svelte component
{#each items as item, index}
  <div
    class="stagger-item"
    style="animation-delay: {index * 0.05}s"
  >
    {item.content}
  </div>
{/each}
```

```css
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: stagger-fade-in var(--duration-flow) var(--athletic-flow) forwards;
}

@keyframes stagger-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Best Practices:**
- Use 50ms base delay for standard lists (3-8 items)
- Use 30ms for longer lists (9+ items) to avoid cumulative delay
- Use 80ms for dramatic reveals (hero sections, features)
- Maximum total delay should not exceed 400ms

### Intersection Observer Animations

**Originated From:** nino-chavez-website

Scroll-triggered animations that enhance discovery:

```typescript
// Svelte action for scroll-triggered animations
export function inView(node: HTMLElement, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        node.classList.add('in-view');
        observer.unobserve(node);
      }
    });
  }, { threshold: 0.1, ...options });

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
```

**CSS:**
```css
[data-in-view] {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity var(--duration-flow) var(--athletic-flow),
    transform var(--duration-flow) var(--athletic-flow);
}

[data-in-view].in-view {
  opacity: 1;
  transform: translateY(0);
}
```

**Usage:**
```svelte
<section data-in-view use:inView>
  <h2>Appears on scroll</h2>
</section>
```

### Scroll-Driven Parallax

**Originated From:** nino-chavez-website

```typescript
export function parallax(node: HTMLElement, speed: number = 0.5) {
  const handleScroll = () => {
    const rect = node.getBoundingClientRect();
    const offset = (window.scrollY - rect.top) * speed;
    node.style.transform = `translateY(${offset}px)`;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return {
    destroy() {
      window.removeEventListener('scroll', handleScroll);
    }
  };
}
```

### Accessibility Support

**Universal Requirement:**

```css
@media (prefers-reduced-motion: reduce) {
  .stagger-item,
  [data-in-view],
  .animated {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

---

## Shadow System

### Two-Shadow Technique

**Originated From:** SemantIQ, nino-chavez-gallery

Realistic depth perception using inset highlight + drop shadows:

```css
/* Small Elevation */
--shadow-sm:
  inset 0 1px 0 hsl(0 0% 100% / 0.4),
  0 1px 2px hsl(0 0% 0% / 0.06);

/* Standard Elevation */
--shadow-md:
  inset 0 1px 0 hsl(0 0% 100% / 0.5),
  0 2px 4px hsl(0 0% 0% / 0.08),
  0 4px 8px hsl(0 0% 0% / 0.06);

/* Prominent Elevation */
--shadow-lg:
  inset 0 1px 0 hsl(0 0% 100% / 0.6),
  0 6px 12px hsl(0 0% 0% / 0.10),
  0 12px 24px hsl(0 0% 0% / 0.12);

/* Maximum Elevation */
--shadow-xl:
  inset 0 2px 0 hsl(0 0% 100% / 0.7),
  0 12px 24px hsl(0 0% 0% / 0.12),
  0 24px 48px hsl(0 0% 0% / 0.16);

/* Recessed/Sunken Effect */
--shadow-inset:
  inset 0 2px 4px hsl(0 0% 0% / 0.12),
  inset 0 -2px 3px hsl(0 0% 100% / 0.40);
```

**Dark Mode Adjustments:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-sm:
      inset 0 1px 0 hsl(0 0% 100% / 0.1),
      0 1px 2px hsl(0 0% 0% / 0.4);

    --shadow-md:
      inset 0 1px 0 hsl(0 0% 100% / 0.1),
      0 2px 4px hsl(0 0% 0% / 0.5),
      0 4px 8px hsl(0 0% 0% / 0.4);
  }
}
```

---

## Spacing System

### Universal Scale (4px Base Unit)

```css
--space-0:   0;
--space-1:   0.25rem;  /* 4px */
--space-2:   0.5rem;   /* 8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
--space-24:  6rem;     /* 96px */
```

**Common Patterns:**
- **Component padding:** 12px (space-3) to 24px (space-6)
- **Section spacing:** 48px (space-12) to 64px (space-16)
- **Element gaps:** 8px (space-2) to 16px (space-4)
- **Page margins:** 32px (space-8) to 80px (space-20)

---

## Iconography

### Universal Standard: Lucide Icons

**Why Lucide:**
- Consistent across all projects
- Professional, semantic, MIT-licensed
- 1000+ icons with consistent 24x24 grid
- React, Vue, Svelte support
- Customizable stroke width

**Usage:**
```tsx
import { ChevronRight, Check, X, Search } from 'lucide-react';

<Search size={20} strokeWidth={2} className="text-neutral-600" />
```

**Size Scale:**
```css
--icon-xs: 14px;  /* Inline text icons */
--icon-sm: 16px;  /* Small UI elements */
--icon-md: 20px;  /* Standard buttons/inputs */
--icon-lg: 24px;  /* Large actions */
--icon-xl: 32px;  /* Feature highlights */
```

**Stroke Width:**
- Standard: 2px (default, most cases)
- Thin: 1.5px (delicate, refined UIs)
- Bold: 2.5px (emphasis, headers)

**Guidelines:**
- **NO EMOJIS** - Use Lucide icons exclusively
- Match icon color to surrounding text
- Use ARIA labels for accessibility
- Consistent stroke width within sections

---

## Border Radius System

```css
--radius-sm:   0.375rem;  /* 6px  - Small components */
--radius-md:   0.5rem;    /* 8px  - Standard cards, buttons */
--radius-lg:   0.75rem;   /* 12px - Large cards */
--radius-xl:   1rem;      /* 16px - Prominent features */
--radius-2xl:  1.5rem;    /* 24px - Hero sections */
--radius-full: 9999px;    /* Circular - avatars, badges */
```

---

## Component Patterns

### Cards (Universal)

```tsx
// Standard Card
<div className="bg-white rounded-lg p-6 border border-neutral-200
                shadow-sm hover:shadow-md hover:-translate-y-0.5
                transition-all duration-200">
  {/* Content */}
</div>

// Elevated Card with Two-Shadow Technique
<div className="bg-white rounded-lg p-6 shadow-md-elevated
                hover:shadow-lg-elevated hover:-translate-y-1
                transition-all duration-200">
  {/* Content */}
</div>
```

### Buttons (Universal)

```tsx
// Primary Action
<button className="bg-brand-500 text-white font-semibold px-6 py-3 rounded-md
                   shadow-sm hover:bg-brand-600 hover:shadow-md hover:-translate-y-px
                   active:bg-brand-700 active:shadow-sm active:translate-y-0
                   transition-all duration-200">
  Action Label
</button>

// Secondary Action
<button className="bg-neutral-100 text-neutral-700 font-semibold px-6 py-3 rounded-md
                   shadow-sm hover:bg-neutral-200 hover:shadow-md
                   transition-all duration-200">
  Action Label
</button>

// Ghost Button
<button className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100
                   font-medium px-4 py-2 rounded-md transition-all duration-200">
  Link Action
</button>
```

### Inputs (Universal)

```tsx
<input
  type="text"
  className="w-full bg-white border border-neutral-300 rounded-md px-4 py-3
             text-base text-neutral-900 placeholder:text-neutral-400
             shadow-inset-recessed
             focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-100
             transition-all duration-200"
  placeholder="Enter value..."
/>
```

### Metric Cards (Analytics Projects)

```tsx
// KPI Card
<div className="bg-white rounded-lg p-6 border border-neutral-200 shadow-sm">
  <h4 className="text-metric-md text-neutral-600 mb-2">Active Users</h4>
  <p className="text-metric-2xl text-semantic-success mb-1">+42%</p>
  <p className="text-sm text-neutral-500">vs last month</p>
</div>

// Inline Metric
<div className="flex items-baseline gap-2">
  <span className="text-metric-xl text-semantic-success">$1.2M</span>
  <span className="text-sm text-semantic-success">Revenue Growth</span>
</div>
```

---

## Project-Specific Overrides

### Agentic Commerce Narrator

**Primary Colors:**
```css
--traditional-500: #6b7280;  /* Neutral/process-driven */
--agentic-500: #3b82f6;      /* Progressive/autonomous */
```

**Use Cases:**
- Traditional approach: Neutral grays
- Agentic approach: Blue spectrum
- Dual-mode narrative comparison

**Documentation:**
- `/docs/design/VISUAL_DESIGN_SYSTEM.md`
- `/docs/design/QUICK_REFERENCE.md`

### AIQ (Analytics Intelligence)

**Dark Mode-First:**
```css
--bg-primary: #0D0D0D;
--bg-secondary: #1A1A1A;
```

**Metric Typography:**
```css
--text-metric-2xl: 3rem;  /* Large dashboard numbers */
```

**Semantic Colors:**
- Heavily uses semantic data visualization colors
- Green/red/amber for trends
- Blue for neutral information

### Signal Dispatch Blog

**Athletic Design System:**
```css
--brand-violet: #8b5cf6;
--brand-orange: #f97316;
```

**Named Timing:**
- Extensive use of named durations (reaction, quick-snap, flow)
- Athletic easing functions throughout

**Prose Optimization:**
- 65ch max-width for blog content
- Optimized for reading comfort

### Nino Chavez Gallery

**Emotion-Driven Design:**
- Cinematic motion with spring physics
- 60% whitespace ratio
- Premium quality standards

**Motion Tokens:**
- Spring-based animations
- Sophisticated entrance effects
- Parallax scrolling

### Nino Chavez Website

**Modern Animation System:**
- Enhanced Intersection Observer patterns
- Scroll-driven animations
- Staggered entrance effects

### SemantIQ

**Depth-First Hierarchy:**
- 3-4 color shade layering
- Two-shadow technique originated here
- Theme-agnostic design principles

---

## Accessibility Checklist

**Universal Requirements for All Projects:**

- [ ] Color contrast ratio 7:1 minimum (WCAG AAA)
- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicators visible (2px outline minimum)
- [ ] Touch targets minimum 44x44px
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] ARIA labels on complex components
- [ ] Alt text on all meaningful images
- [ ] Logical heading structure (h1-h6)
- [ ] `prefers-reduced-motion` support for all animations
- [ ] Screen reader testing with NVDA/JAWS/VoiceOver

---

## Common Mistakes to Avoid

**Universal Don'ts:**

❌ **Don't:**
- Use emojis (use Lucide icons instead)
- Hardcode colors (use CSS variables or Tailwind classes)
- Skip hover/focus states
- Create tiny touch targets (<44px)
- Animate `width`, `height`, or `top`/`left` (poor performance)
- Use flat shadows (always use two-shadow technique)
- Ignore `prefers-reduced-motion`
- Mix brand colors inconsistently

✅ **Do:**
- Use design tokens exclusively
- Add smooth transitions (200-250ms standard)
- Maintain consistent spacing
- Test on mobile screens
- Verify color contrast
- Use semantic HTML elements
- Animate `transform` and `opacity` only
- Respect user motion preferences

---

## Technology Stack

### Common Technologies Across Projects

**Frontend Frameworks:**
- Svelte 5 (Runes) - agentic-commerce-narrator, nino-chavez-website
- React 18 - aiq, nino-chavez-gallery
- SvelteKit 2.x - signal-dispatch-blog, nino-chavez-website

**Styling:**
- Tailwind CSS v4 - All projects
- CSS Custom Properties - Universal
- PostCSS - Build processing

**Animation Libraries:**
- Framer Motion - aiq, nino-chavez-gallery
- Native CSS Animations - nino-chavez-website, signal-dispatch-blog
- Intersection Observer API - nino-chavez-website

**Icon Systems:**
- Lucide React - aiq, agentic-commerce-narrator
- Lucide Svelte - signal-dispatch-blog, nino-chavez-website

---

## Implementation Strategy

### For New Projects

1. **Start with Universal Tokens**
   - Copy base color system (neutrals, semantics)
   - Copy typography scale
   - Copy spacing system
   - Copy shadow system
   - Copy motion tokens

2. **Add Project-Specific Brand Colors**
   - Define primary brand color palette
   - Define accent colors if needed
   - Override CSS variables for theming

3. **Implement Component Patterns**
   - Start with card, button, input patterns
   - Add project-specific components
   - Maintain consistency with universal patterns

4. **Test Accessibility**
   - Run contrast checks
   - Test keyboard navigation
   - Verify `prefers-reduced-motion`
   - Test with screen readers

### For Existing Projects

1. **Audit Current Design Tokens**
   - Compare with universal system
   - Identify inconsistencies
   - Document project-specific needs

2. **Incremental Migration**
   - Replace hardcoded values with tokens
   - Update components one at a time
   - Maintain backward compatibility

3. **Document Deviations**
   - Record project-specific overrides
   - Explain rationale for deviations
   - Update this master document

---

## References

### Project-Specific Documentation

- **Agentic Commerce:** `/docs/design/VISUAL_DESIGN_SYSTEM.md`, `/docs/design/QUICK_REFERENCE.md`
- **AIQ:** `/project-docs/features/DESIGN_TRANSFORMATION_GUIDE.md`
- **Nino Chavez Gallery:** `.agent-os/product/design-brief.md`
- **Nino Chavez Website:** `docs/MODERN_ANIMATION_SYSTEM.md`
- **Signal Dispatch:** `tailwind.config.ts` (athletic timing system)
- **SemantIQ:** `docs/design/design_guide.md`

### External Resources

- [Inter Variable Font](https://rsms.me/inter/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [WCAG AAA Guidelines](https://www.w3.org/WAI/WCAG2AAA-Conformance)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## Maintenance

### Version History

- **v1.0.0** (2025-10-24) - Initial cross-project synthesis

### Contributing

When updating this document:

1. Update version number (semantic versioning)
2. Add changelog entry
3. Update "Last Updated" date
4. Notify all project teams of changes
5. Update project-specific docs to reference new patterns

### Questions or Clarifications

Contact: Nino Chavez
Repository: ~/Workspace/DESIGN_SYSTEM.md

---

**This document is the source of truth for design decisions across all workspace projects. When in doubt, refer here first.**
