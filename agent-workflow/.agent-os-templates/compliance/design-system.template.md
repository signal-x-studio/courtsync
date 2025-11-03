# Design System Compliance Instructions

**Version:** 1.0.0
**Date:** {CREATION_DATE}
**Enforcement:** MANDATORY for all UI work
**Source:** `{DESIGN_SYSTEM_SOURCE}`, {COMPONENT_LIBRARY}

## Purpose

This document provides enforceable validation rules to ensure all UI development follows the established design system. Visual inconsistency will trigger auto-rollback.

---

## Required Reading

**Before ANY UI work:**
- `{DESIGN_SYSTEM_SOURCE}` - Complete design configuration
- `{COMPONENT_PATH}/` - {COMPONENT_LIBRARY} component library
- {PROJECT_NAME} follows {DESIGN_PHILOSOPHY} and {THEME_MODE} design

---

## Design Philosophy

### Core Principles

1. **{TARGET_AUDIENCE}-Focused {AESTHETIC_STYLE} Interface**
   - {AESTHETIC_PRINCIPLE_1}
   - {AESTHETIC_PRINCIPLE_2}
   - {THEME_MODE} design ({THEME_RATIONALE})
   - Emphasis on {VISUAL_PRIORITY}

2. **{COMPONENT_LIBRARY} Component Library**
   - Use existing {COMPONENT_LIBRARY} components (`{COMPONENT_PATH}/`)
   - Extend with custom components only when necessary
   - Follow {ACCESSIBILITY_FRAMEWORK} patterns for accessibility
   - Maintain consistent component API

3. **Performance & Accessibility**
   - WCAG {WCAG_LEVEL} minimum ({CONTRAST_RATIO} contrast)
   - Semantic HTML with proper ARIA labels
   - Keyboard navigation fully supported
   - Loading states for all async operations

4. **{PRIMARY_VISUALIZATION_FEATURE} Priority** (if applicable)
   - {VISUALIZATION_REQUIREMENT_1}
   - {VISUALIZATION_REQUIREMENT_2}
   - {VISUALIZATION_REQUIREMENT_3}
   - {VISUALIZATION_REQUIREMENT_4}

---

## Color System (Strictly Enforced)

### {COMPONENT_LIBRARY} Semantic Colors

**MUST USE these CSS custom properties:**

```css
/* Base colors */
--background: /* {THEME_MODE}: {BACKGROUND_PRIMARY} */
--foreground: /* {THEME_MODE}: {FOREGROUND_PRIMARY} */
--border: /* {THEME_MODE} borders */
--input: /* Input backgrounds */
--ring: /* Focus rings */

/* Component colors */
--primary: /* Brand color for primary actions */
--primary-foreground: /* Text on primary */
--secondary: /* Secondary actions */
--destructive: /* Delete/error actions */
--muted: /* Disabled states */
--accent: /* Hover states */
--card: /* Card backgrounds */
--popover: /* Dropdown backgrounds */
```

### Brand Colors

**Primary Brand:** {BRAND_NAME} ({PRIMARY_BRAND_COLOR})

```css
brand-500: {PRIMARY_BRAND_COLOR}   /* Primary actions, links, focus */
brand-600: {BRAND_COLOR_HOVER}     /* Hover states */
brand-700: {BRAND_COLOR_ACTIVE}    /* Active/pressed states */
```

**Usage:**
```tsx
<button className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700">
  {PRIMARY_ACTION_LABEL}
</button>
```

### Semantic Colors (Data Visualization)

**For {VISUALIZATION_CONTEXT}:**

```css
/* Success ({SUCCESS_USE_CASE}) */
semantic-success: {SUCCESS_COLOR}

/* Warning ({WARNING_USE_CASE}) */
semantic-warning: {WARNING_COLOR}

/* Error ({ERROR_USE_CASE}) */
semantic-error: {ERROR_COLOR}

/* Info ({INFO_USE_CASE}) */
semantic-info: {INFO_COLOR}
```

**{VISUALIZATION_FEATURE} Color Mapping:**
```tsx
// {RANGE_1_LABEL}
<span className="text-semantic-error">{RANGE_1_EXAMPLE}</span>

// {RANGE_2_LABEL}
<span className="text-semantic-warning">{RANGE_2_EXAMPLE}</span>

// {RANGE_3_LABEL}
<span className="text-brand-500">{RANGE_3_EXAMPLE}</span>

// {RANGE_4_LABEL}
<span className="text-semantic-success">{RANGE_4_EXAMPLE}</span>
```

### Background Colors ({THEME_MODE})

```css
bg-primary: {BACKGROUND_PRIMARY}      /* Page background */
bg-secondary: {BACKGROUND_SECONDARY}    /* Card background */
bg-tertiary: {BACKGROUND_TERTIARY}     /* Hover states, elevated elements */

text-primary: {TEXT_PRIMARY}    /* Primary text */
text-secondary: {TEXT_SECONDARY}  /* Secondary text */
text-muted: {TEXT_MUTED}      /* Muted text */
```

### Chart Colors (Multi-Series Data)

```css
chart-1: {CHART_COLOR_1}  /* Brand primary */
chart-2: {CHART_COLOR_2}  /* Success */
chart-3: {CHART_COLOR_3}  /* Warning */
chart-4: {CHART_COLOR_4}  /* Error */
chart-5: {CHART_COLOR_5}  /* Additional 1 */
chart-6: {CHART_COLOR_6}  /* Additional 2 */
chart-7: {CHART_COLOR_7}  /* Additional 3 */
chart-8: {CHART_COLOR_8}  /* Additional 4 */
```

### Color Usage Rules

**✅ ALLOWED:**
```tsx
<!-- {COMPONENT_LIBRARY} semantic colors -->
<div className="bg-card text-card-foreground">
<button className="bg-primary text-primary-foreground">
<span className="text-muted-foreground">

<!-- Brand colors -->
<div className="bg-brand-500 hover:bg-brand-600">

<!-- Semantic colors for {VISUALIZATION_CONTEXT} -->
<span className="text-semantic-success">{SUCCESS_EXAMPLE}</span>
```

**❌ FORBIDDEN:**
```tsx
<!-- Random hex colors -->
<div style="background: #abc123">

<!-- Non-semantic {CSS_FRAMEWORK} colors -->
<div className="bg-blue-500">  <!-- Use brand-500 -->
<span className="text-green-600"> <!-- Use semantic-success -->

<!-- Inline styles -->
<button style="color: red">  <!-- Use semantic-error class -->
```

---

## Typography System (Enforced)

### Font Families

```css
font-sans: {FONT_FAMILY_PRIMARY}  /* Primary UI font */
font-display: {FONT_FAMILY_DISPLAY}  /* Display/headers */
font-mono: {FONT_FAMILY_MONO}  /* Code, metrics */
```

### Type Scale

**Display Sizes (Hero, Marketing):**
```tsx
<h1 className="text-display-2xl">{DISPLAY_EXAMPLE_1}</h1>  /* {DISPLAY_SIZE_2XL} */
<h1 className="text-display-xl">{DISPLAY_EXAMPLE_2}</h1>     /* {DISPLAY_SIZE_XL} */
<h1 className="text-display-lg">{DISPLAY_EXAMPLE_3}</h1>      /* {DISPLAY_SIZE_LG} */
```

**Heading Sizes (Section Headers):**
```tsx
<h2 className="text-heading-xl">{HEADING_EXAMPLE_1}</h2>  /* {HEADING_SIZE_XL} */
<h3 className="text-heading-lg">{HEADING_EXAMPLE_2}</h3>      /* {HEADING_SIZE_LG} */
<h4 className="text-heading-md">{HEADING_EXAMPLE_3}</h4>     /* {HEADING_SIZE_MD} */
<h5 className="text-heading-sm">{HEADING_EXAMPLE_4}</h5>        /* {HEADING_SIZE_SM} */
```

**Body Sizes:**
```tsx
<p className="text-body-lg">Large body text ({BODY_SIZE_LG})</p>
<p className="text-body-md">Default body text ({BODY_SIZE_MD})</p>
<p className="text-body-sm">Small text ({BODY_SIZE_SM})</p>
<p className="text-body-xs">Extra small ({BODY_SIZE_XS})</p>
```

**Metric Sizes (Large Numbers)** (if applicable):
```tsx
<span className="text-metric-2xl font-mono">{METRIC_EXAMPLE_1}</span>  /* {METRIC_SIZE_2XL} */
<span className="text-metric-xl font-mono">{METRIC_EXAMPLE_2}</span>      /* {METRIC_SIZE_XL} */
<span className="text-metric-lg font-mono">{METRIC_EXAMPLE_3}</span>    /* {METRIC_SIZE_LG} */
```

**Font Usage Rules:**

- **Headings:** `font-display` ({FONT_FAMILY_DISPLAY}) + appropriate `text-heading-*` size
- **Body:** `font-sans` ({FONT_FAMILY_PRIMARY}) + `text-body-*` size
- **Metrics/Data:** `font-mono` ({FONT_FAMILY_MONO}) + `text-metric-*` size
- **Code:** `font-mono` for code snippets, API responses

---

## Component Patterns (Required)

### {COMPONENT_LIBRARY} Components

**MUST USE existing components from `{COMPONENT_PATH}/`:**

```tsx
import { {BUTTON_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/button'
import { {CARD_COMPONENT}, {CARD_HEADER}, {CARD_TITLE}, {CARD_DESCRIPTION}, {CARD_CONTENT} } from '{COMPONENT_IMPORT_PATH}/card'
import { {BADGE_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/badge'
import { {ALERT_COMPONENT}, {ALERT_DESCRIPTION} } from '{COMPONENT_IMPORT_PATH}/alert'
import { {DIALOG_COMPONENT}, {DIALOG_CONTENT}, {DIALOG_HEADER}, {DIALOG_TITLE} } from '{COMPONENT_IMPORT_PATH}/dialog'
```

### Cards (Primary Container)

**Standard Card:**
```tsx
<{CARD_COMPONENT}>
  <{CARD_HEADER}>
    <{CARD_TITLE}>{CARD_TITLE_EXAMPLE}</{CARD_TITLE}>
    <{CARD_DESCRIPTION}>{CARD_DESCRIPTION_EXAMPLE}</{CARD_DESCRIPTION}>
  </{CARD_HEADER}>
  <{CARD_CONTENT}>
    {/* Card content */}
  </{CARD_CONTENT}>
</{CARD_COMPONENT}>
```

**{SPECIAL_CARD_TYPE} Card:**
```tsx
<{CARD_COMPONENT} className="border-l-4 border-l-semantic-warning">
  <{CARD_HEADER}>
    <{CARD_TITLE} className="flex items-center justify-between">
      <span>{SPECIAL_CARD_TITLE}</span>
      <span className="text-metric-xl font-mono text-semantic-warning">{SPECIAL_CARD_VALUE}</span>
    </{CARD_TITLE}>
    <{CARD_DESCRIPTION}>{SPECIAL_CARD_DESCRIPTION}</{CARD_DESCRIPTION}>
  </{CARD_HEADER}>
  <{CARD_CONTENT}>
    {/* Card content */}
  </{CARD_CONTENT}>
</{CARD_COMPONENT}>
```

### Buttons

**Primary Action ({PRIMARY_ACTION_CONTEXT}):**
```tsx
<{BUTTON_COMPONENT} className="bg-brand-500 hover:bg-brand-600">
  {PRIMARY_ACTION_LABEL}
</{BUTTON_COMPONENT}>
```

**Secondary Action:**
```tsx
<{BUTTON_COMPONENT} variant="secondary">
  {SECONDARY_ACTION_LABEL}
</{BUTTON_COMPONENT}>
```

**Destructive Action:**
```tsx
<{BUTTON_COMPONENT} variant="destructive">
  {DESTRUCTIVE_ACTION_LABEL}
</{BUTTON_COMPONENT}>
```

**Ghost/Subtle:**
```tsx
<{BUTTON_COMPONENT} variant="ghost">
  Cancel
</{BUTTON_COMPONENT}>
```

### Badges (Status Indicators)

**Status Types:**
```tsx
<{BADGE_COMPONENT} variant="destructive">{STATUS_CRITICAL_LABEL}</{BADGE_COMPONENT}>
<{BADGE_COMPONENT} variant="warning">{STATUS_WARNING_LABEL}</{BADGE_COMPONENT}>
<{BADGE_COMPONENT} variant="default">{STATUS_DEFAULT_LABEL}</{BADGE_COMPONENT}>
<{BADGE_COMPONENT} variant="success">{STATUS_SUCCESS_LABEL}</{BADGE_COMPONENT}>
```

### Forms

**Using {COMPONENT_LIBRARY} Form components:**
```tsx
import { {FORM_COMPONENT}, {FORM_FIELD}, {FORM_ITEM}, {FORM_LABEL}, {FORM_CONTROL}, {FORM_MESSAGE} } from '{COMPONENT_IMPORT_PATH}/form'
import { {INPUT_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/input'
import { {SELECT_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/select'

<{FORM_COMPONENT} {...form}>
  <{FORM_FIELD}
    control={form.control}
    name="{FORM_FIELD_NAME}"
    render={({ field }) => (
      <{FORM_ITEM}>
        <{FORM_LABEL}>{FORM_LABEL_TEXT}</{FORM_LABEL}>
        <{FORM_CONTROL}>
          <{INPUT_COMPONENT} placeholder="{FORM_PLACEHOLDER}" {...field} />
        </{FORM_CONTROL}>
        <{FORM_MESSAGE} />
      </{FORM_ITEM}>
    )}
  />
</{FORM_COMPONENT}>
```

### Loading States

**Skeleton Loader:**
```tsx
import { {SKELETON_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/skeleton'

<{SKELETON_COMPONENT} className="h-12 w-full" />
<{SKELETON_COMPONENT} className="h-32 w-full mt-4" />
```

**Progress Indicator:**
```tsx
import { {PROGRESS_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/progress'

<{PROGRESS_COMPONENT} value={45} className="w-full" />
<p className="text-body-sm text-muted-foreground">{PROGRESS_LABEL}</p>
```

---

## Layout & Spacing (Enforced)

### Spacing Scale

**MUST USE {CSS_FRAMEWORK} spacing scale:**

```tsx
p-2   /* {SPACING_2} */
p-3   /* {SPACING_3} */
p-4   /* {SPACING_4} - Default card padding */
p-6   /* {SPACING_6} */
p-8   /* {SPACING_8} */
p-12  /* {SPACING_12} - Section spacing */
```

### Container Widths

**{PRIMARY_LAYOUT_TYPE} Layout:**
```tsx
<div className="container mx-auto max-w-{CONTAINER_MAX_WIDTH} px-6">
  {/* Content */}
</div>
```

**Full-Width Sections:**
```tsx
<div className="w-full max-w-screen-{FULL_WIDTH_SIZE} mx-auto">
  {/* Wide content */}
</div>
```

### Grid System ({LAYOUT_CONTEXT})

**{GRID_LAYOUT_1_NAME}:**
```tsx
<!-- {GRID_LAYOUT_1_DESCRIPTION} -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{GRID_COLS_LG} gap-6">
  <{GRID_ITEM_COMPONENT} {GRID_ITEM_PROPS_1} />
  <{GRID_ITEM_COMPONENT} {GRID_ITEM_PROPS_2} />
  <{GRID_ITEM_COMPONENT} {GRID_ITEM_PROPS_3} />
</div>
```

**{GRID_LAYOUT_2_NAME}:**
```tsx
<!-- {GRID_LAYOUT_2_DESCRIPTION} -->
<div className="grid grid-cols-1 lg:grid-cols-{GRID_COLS_2} gap-8">
  <div className="lg:col-span-{MAIN_SPAN}">
    {/* Main content */}
  </div>
  <aside className="lg:col-span-{SIDEBAR_SPAN}">
    {/* Sidebar */}
  </aside>
</div>
```

---

## Animation & Transitions

### Timing System

**Use {CSS_FRAMEWORK} duration utilities:**
```tsx
duration-{DURATION_FAST}  /* Fast UI feedback (button hover) */
duration-{DURATION_NORMAL}  /* Modal appear */
duration-{DURATION_SLOW}  /* Panel slide, page transitions */
```

### Easing Functions

```tsx
ease-in       /* Start slow */
ease-out      /* End slow (preferred for UI) */
ease-in-out   /* Start and end slow */
```

### Custom Animations

**{ANIMATION_1_NAME} ({ANIMATION_1_USE_CASE}):**
```tsx
<div className="animate-{ANIMATION_1_CLASS} {ANIMATION_1_STYLES}" />
```

**{ANIMATION_2_NAME}:**
```tsx
<div className="animate-{ANIMATION_2_CLASS}">
  {/* Content */}
</div>
```

### Reduced Motion

**MUST respect user preferences:**
```tsx
<div className="transition-transform duration-{DURATION_NORMAL} motion-reduce:transition-none">
```

---

## Accessibility (WCAG {WCAG_LEVEL} Required)

### Contrast Requirements

**MUST MEET {CONTRAST_RATIO} ratio minimum:**

✅ **Compliant ({THEME_MODE}):**
- `{TEXT_COLOR_1}` on `{BG_COLOR_1}` - {CONTRAST_RATIO_1}
- `{TEXT_COLOR_2}` on `{BG_COLOR_2}` - {CONTRAST_RATIO_2}
- `{TEXT_COLOR_3}` on `{BG_COLOR_3}` - {CONTRAST_RATIO_3}

❌ **Non-Compliant:**
- `{TEXT_COLOR_FAIL}` on `{BG_COLOR_FAIL}` - {CONTRAST_RATIO_FAIL} (too low for body text)

### Keyboard Navigation

**MUST BE FULLY KEYBOARD ACCESSIBLE:**
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-{FOCUS_RING_OFFSET_COLOR}">
  {/* Visible focus state */}
</button>
```

### ARIA Labels

**Required for:**
- Icon-only buttons
- Form inputs
- {VISUALIZATION_CONTEXT} indicators
- {LAYOUT_CONTEXT} widgets

```tsx
<button aria-label="{ARIA_LABEL_EXAMPLE_1}">
  <{ICON_COMPONENT_1} className="w-5 h-5" />
</button>

<div role="region" aria-label="{ARIA_LABEL_EXAMPLE_2}">
  <span className="text-metric-2xl">{METRIC_VALUE_EXAMPLE}</span>
</div>
```

---

## Pre-Implementation Validation Checklist

**Before writing UI code:**

### Component Selection
- [ ] Checked if {COMPONENT_LIBRARY} component exists
- [ ] Reviewed component API in `{COMPONENT_PATH}/`
- [ ] Identified required variants and props
- [ ] Planned component composition

### Design Tokens
- [ ] Color selections from design system (no random colors)
- [ ] Typography scale selections made
- [ ] Spacing scale selections made
- [ ] Animation duration selected

### Accessibility Planning
- [ ] Contrast ratios verified ({CONTRAST_RATIO} minimum)
- [ ] Keyboard navigation planned
- [ ] ARIA labels identified
- [ ] Focus states designed
- [ ] Reduced motion fallbacks planned

---

## Post-Implementation Validation Checklist

**After UI implementation:**

### Component Compliance
- [ ] Uses {COMPONENT_LIBRARY} components (not custom reimplementations)
- [ ] Follows component API patterns
- [ ] Props properly typed
- [ ] Event handlers correct

### Visual Compliance
- [ ] All colors from design system (no random hex)
- [ ] Typography scale followed
- [ ] Spacing from {CSS_FRAMEWORK} scale
- [ ] {THEME_MODE} support verified
- [ ] No inline styles

### Accessibility Compliance
- [ ] Contrast ratios pass WCAG {WCAG_LEVEL} ({CONTRAST_RATIO})
- [ ] Keyboard navigation works
- [ ] ARIA labels on necessary elements
- [ ] Focus states visible and styled
- [ ] Reduced motion respected
- [ ] Screen reader tested

### Performance Compliance
- [ ] Animations < {MAX_ANIMATION_DURATION}ms
- [ ] No layout shift
- [ ] Loading states for async operations
- [ ] Optimistic UI updates where appropriate

---

## Auto-Rejection Triggers

**The following will trigger auto-rollback:**

### ❌ Component Violations
- Reimplementing {COMPONENT_LIBRARY} components instead of using existing
- Custom button styles (not using {BUTTON_COMPONENT} component)
- Custom form inputs (not using {COMPONENT_LIBRARY} Form components)
- Custom dialogs/modals (not using {DIALOG_COMPONENT} component)

### ❌ Color Violations
- Random hex colors in code
- Inline color styles
- Non-design-system {CSS_FRAMEWORK} colors (`bg-blue-500` instead of `bg-brand-500`)
- Missing {THEME_MODE} support

### ❌ Typography Violations
- Custom font imports (use {FONT_FAMILY_PRIMARY}/{FONT_FAMILY_MONO})
- Inline font styles
- Non-scale font sizes (`text-[17px]`)
- Missing semantic heading hierarchy

### ❌ Accessibility Violations
- Contrast ratios below {CONTRAST_RATIO}
- Missing keyboard navigation
- Icon-only buttons without ARIA labels
- No focus states
- Missing loading states for async operations

### ❌ Performance Violations
- Animations > {MAX_ANIMATION_DURATION}ms (feels sluggish)
- Layout shift (CLS > 0)
- Missing loading states
- No optimistic UI updates

---

## {VISUALIZATION_FEATURE} Standards (if applicable)

### Display Requirements

**{VISUALIZATION_PRIMARY}:**
```tsx
<div className="flex items-center justify-center">
  <span className="text-metric-2xl font-mono text-semantic-{VISUALIZATION_STATUS}">
    {VISUALIZATION_VALUE_EXAMPLE}
  </span>
  <{BADGE_COMPONENT} variant="{VISUALIZATION_STATUS}" className="ml-4">
    {VISUALIZATION_LABEL}
  </{BADGE_COMPONENT}>
</div>
```

**{VISUALIZATION_BREAKDOWN} ({VISUALIZATION_CATEGORIES} categories):**
```tsx
<div className="grid grid-cols-{VISUALIZATION_GRID_COLS} gap-4">
  <{VISUALIZATION_COMPONENT}
    name="{CATEGORY_1_NAME}"
    value={{CATEGORY_1_VALUE}}
    weight={{CATEGORY_1_WEIGHT}}
    status="{CATEGORY_1_STATUS}"
  />
  <{VISUALIZATION_COMPONENT}
    name="{CATEGORY_2_NAME}"
    value={{CATEGORY_2_VALUE}}
    weight={{CATEGORY_2_WEIGHT}}
    status="{CATEGORY_2_STATUS}"
  />
  <{VISUALIZATION_COMPONENT}
    name="{CATEGORY_3_NAME}"
    value={{CATEGORY_3_VALUE}}
    weight={{CATEGORY_3_WEIGHT}}
    status="{CATEGORY_3_STATUS}"
  />
  <{VISUALIZATION_COMPONENT}
    name="{CATEGORY_4_NAME}"
    value={{CATEGORY_4_VALUE}}
    weight={{CATEGORY_4_WEIGHT}}
    status="{CATEGORY_4_STATUS}"
  />
</div>
```

### Color-Coded Ranges

```tsx
// {RANGE_1_LABEL} ({RANGE_1_VALUES})
className="text-semantic-error border-l-semantic-error"

// {RANGE_2_LABEL} ({RANGE_2_VALUES})
className="text-semantic-warning border-l-semantic-warning"

// {RANGE_3_LABEL} ({RANGE_3_VALUES})
className="text-brand-500 border-l-brand-500"

// {RANGE_4_LABEL} ({RANGE_4_VALUES})
className="text-semantic-success border-l-semantic-success"
```

---

## Example: Compliant Component

```tsx
import { {CARD_COMPONENT}, {CARD_HEADER}, {CARD_TITLE}, {CARD_DESCRIPTION}, {CARD_CONTENT} } from '{COMPONENT_IMPORT_PATH}/card'
import { {BADGE_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/badge'
import { {PROGRESS_COMPONENT} } from '{COMPONENT_IMPORT_PATH}/progress'

interface {EXAMPLE_COMPONENT_NAME}Props {
  {PROP_1_NAME}: {PROP_1_TYPE}
  {PROP_2_NAME}: {PROP_2_TYPE}
  {PROP_3_NAME}: {PROP_3_TYPE}
  {PROP_4_NAME}: {PROP_4_TYPE}
}

export function {EXAMPLE_COMPONENT_NAME}({ {PROP_1_NAME}, {PROP_2_NAME}, {PROP_3_NAME}, {PROP_4_NAME} }: {EXAMPLE_COMPONENT_NAME}Props) {
  const status = {STATUS_CALCULATION_LOGIC}
  const statusColor = {
    {STATUS_1}: '{STATUS_1_COLOR}',
    {STATUS_2}: '{STATUS_2_COLOR}',
    {STATUS_3}: '{STATUS_3_COLOR}',
    {STATUS_4}: '{STATUS_4_COLOR}'
  }[status]

  return (
    <{CARD_COMPONENT} className={`border-l-4 border-l-${statusColor}`}>
      <{CARD_HEADER}>
        <{CARD_TITLE} className="flex items-center justify-between">
          <span className="text-heading-md">{{PROP_1_NAME}}</span>
          <span className={`text-metric-xl font-mono text-${statusColor}`}>
            {{PROP_2_NAME}}
          </span>
        </{CARD_TITLE}>
        <{CARD_DESCRIPTION} className="flex items-center gap-2">
          <{BADGE_COMPONENT} variant={status}>{status.replace('-', ' ')}</{BADGE_COMPONENT}>
          <span className="text-body-sm text-muted-foreground">
            {BADGE_SECONDARY_TEXT} {{PROP_3_NAME}}
          </span>
        </{CARD_DESCRIPTION}>
      </{CARD_HEADER}>
      <{CARD_CONTENT}>
        <{PROGRESS_COMPONENT} value={{PROP_2_NAME}} className="mb-4" />
        <p className="text-body-sm text-secondary">{{PROP_4_NAME}}</p>
      </{CARD_CONTENT}>
    </{CARD_COMPONENT}>
  )
}
```

**Compliance Notes:**
- ✅ Uses {COMPONENT_LIBRARY} components ({CARD_COMPONENT}, {BADGE_COMPONENT}, {PROGRESS_COMPONENT})
- ✅ Typography from design system (text-heading-md, text-metric-xl, text-body-sm)
- ✅ Colors from semantic palette (semantic-error, semantic-warning, brand-500, semantic-success)
- ✅ Spacing from {CSS_FRAMEWORK} scale (p-4 default, mb-4, gap-2)
- ✅ Accessible (semantic HTML, proper hierarchy)
- ✅ {LANGUAGE} strict types

---

## Quick Reference: Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `brand-500` | `{PRIMARY_BRAND_COLOR}` | Primary actions, links |
| `semantic-success` | `{SUCCESS_COLOR}` | {SUCCESS_USE_CASE} |
| `semantic-warning` | `{WARNING_COLOR}` | {WARNING_USE_CASE} |
| `semantic-error` | `{ERROR_COLOR}` | {ERROR_USE_CASE} |
| `text-heading-xl` | `{HEADING_SIZE_XL}` | Section headings |
| `text-metric-2xl` | `{METRIC_SIZE_2XL}` | Large numeric displays |
| `text-body-md` | `{BODY_SIZE_MD}` | Default body text |
| `font-mono` | `{FONT_FAMILY_MONO}` | Data, metrics, code |
| `p-6` | `{SPACING_6}` | Default card padding |
| `gap-4` | `{SPACING_4}` | Element spacing |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | {CREATION_DATE} | Initial design system compliance for {PROJECT_NAME} |

---

**Status:** Active Enforcement Document
**Source of Truth:** `{DESIGN_SYSTEM_SOURCE}`, `{COMPONENT_PATH}/`
**Feedback:** Report design inconsistencies to `.agent-os/audit-logs/`
