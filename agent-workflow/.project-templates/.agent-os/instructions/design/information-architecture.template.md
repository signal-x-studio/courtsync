# Information Architecture Principles

**Version:** 1.0.0
**Date:** {CREATION_DATE}
**Enforcement:** MANDATORY for all feature development
**Applies to:** Product managers, designers, engineers working on {PROJECT_NAME}

## Purpose

This document defines how information is organized, structured, and presented in the {PROJECT_NAME} platform to support {PRIMARY_USER} workflows and decision-making. Information Architecture (IA) is the foundation of usability—without clear IA, even the best visual design will fail.

---

## Core IA Principles

### 1. Task-Oriented Structure

**Principle:** Organize content around what {PRIMARY_USER_PLURAL} need to accomplish, not around data structures.

**Implementation:**
```
❌ WRONG (database-driven):
- {DATABASE_TABLE_1}
- {DATABASE_TABLE_2}
- {DATABASE_TABLE_3}
- {DATABASE_TABLE_4}

✅ RIGHT (task-driven):
- {PRIMARY_TASK_1} ({TASK_1_ACTION})
- {PRIMARY_TASK_2} ({TASK_2_ACTION})
- {PRIMARY_TASK_3} ({TASK_3_ACTION})
- {PRIMARY_TASK_4} ({TASK_4_ACTION})
```

**Why:** {PRIMARY_USER_PLURAL} think in workflows ("{USER_MENTAL_MODEL_EXAMPLE}"), not entities ("{DATABASE_MENTAL_MODEL_EXAMPLE}").

---

### 2. Content Hierarchy (Pyramid Model)

**Principle:** Present information in order of importance and frequency of use.

#### Level 1: Primary KPIs (Above the Fold)
**What:** The single most important metric users need to answer "How are we doing?"

**For {PROJECT_NAME}:**
- **{PRIMARY_KPI}** with {STATUS_INDICATOR}
- **{SECONDARY_KPI}** ({KPI_DESCRIPTION})
- **Primary Action** ("{PRIMARY_ACTION_LABEL}")

**Visual Treatment:**
- Typography: `text-metric-2xl` ({METRIC_SIZE_2XL}) with `font-mono`
- Position: Top center of dashboard
- Color: Semantic color based on {STATUS_RANGE_CRITERIA}
- Space: Minimum {PADDING_PRIMARY} padding around score

#### Level 2: Secondary Metrics (First Scroll)
**What:** Supporting metrics that provide context for the primary KPI

**For {PROJECT_NAME}:**
- **{DIMENSION_1}** ({DIMENSION_1_WEIGHT})
- **{DIMENSION_2}** ({DIMENSION_2_WEIGHT})
- **{DIMENSION_3}** ({DIMENSION_3_WEIGHT})
- **Trend indicators** (+/- % change from {COMPARISON_BASELINE})

**Visual Treatment:**
- Typography: `text-metric-xl` ({METRIC_SIZE_XL}) for dimension scores
- Layout: 2x2 grid on desktop, stacked on mobile
- Color: Dimension-specific semantic colors
- Space: `gap-6` between cards

#### Level 3: Tertiary Details (Progressive Disclosure)
**What:** Granular data revealed on demand (click to expand, modal, detail page)

**For {PROJECT_NAME}:**
- {DETAIL_LEVEL_1}
- {DETAIL_LEVEL_2}
- {DETAIL_LEVEL_3}
- {DETAIL_LEVEL_4}

**Visual Treatment:**
- Typography: `text-body-md` (16px) for detail tables
- Interaction: Click card → modal or detail page
- Color: Neutral foreground colors
- Space: Compact spacing (`gap-4`)

---

### 3. Mental Model Alignment

**Principle:** Navigation labels and page structure must match how {PRIMARY_USER_PLURAL} think about their work.

#### {PRIMARY_USER} Mental Model for {PRIMARY_WORKFLOW}:

```
1. {WORKFLOW_STAGE_1}
   → "{USER_THOUGHT_1}"

2. {WORKFLOW_STAGE_2}
   → "{USER_THOUGHT_2}"
   → "{USER_THOUGHT_3}"

3. {WORKFLOW_STAGE_3}
   → "{USER_THOUGHT_4}"
   → "{USER_THOUGHT_5}"

4. {WORKFLOW_STAGE_4}
   → "{USER_THOUGHT_6}"

5. {WORKFLOW_STAGE_5}
   → "{USER_THOUGHT_7}"
   → "{USER_THOUGHT_8}"
```

#### {PROJECT_NAME} Navigation Structure (Aligned):

```
Dashboard
├── {NAV_SECTION_1} ({WORKFLOW_STAGE_1} + {WORKFLOW_STAGE_2})
│   ├── {NAV_ITEM_1_1}
│   ├── {NAV_ITEM_1_2}
│   └── {NAV_ITEM_1_3}
│
├── {NAV_SECTION_2} ({WORKFLOW_STAGE_3})
│   ├── {NAV_ITEM_2_1}
│   ├── {NAV_ITEM_2_2}
│   └── {NAV_ITEM_2_3}
│
├── {NAV_SECTION_3} ({WORKFLOW_STAGE_4})
│   ├── {NAV_ITEM_3_1}
│   ├── {NAV_ITEM_3_2}
│   └── {NAV_ITEM_3_3}
│
└── {NAV_SECTION_4} ({WORKFLOW_STAGE_5})
    ├── {NAV_ITEM_4_1}
    ├── {NAV_ITEM_4_2}
    └── {NAV_ITEM_4_3}
```

**Anti-Pattern Example:**
```
❌ WRONG:
- {TECHNICAL_TERM_1} (too technical, user doesn't think this way)
- {IMPLEMENTATION_DETAIL_1} (internal implementation detail)
- {CONFIG_OPTION_1} (should be in Settings, not primary nav)
```

---

### 4. Progressive Disclosure

**Principle:** Show only what users need to see right now. Reveal complexity on demand.

#### Three-Tier Disclosure Strategy:

**Tier 1: Summary View (Default)**
- Show: {SUMMARY_ELEMENT_1}, {SUMMARY_ELEMENT_2}, {SUMMARY_ELEMENT_3}
- Hide: {HIDDEN_DETAIL_1}, {HIDDEN_DETAIL_2}
- Why: Fast decision-making ("{DECISION_QUESTION}")

**Tier 2: Expanded View (Click to Reveal)**
- Show: {EXPANDED_ELEMENT_1}, {EXPANDED_ELEMENT_2}, {EXPANDED_ELEMENT_3}
- Hide: {STILL_HIDDEN_1}, {STILL_HIDDEN_2}
- Why: Diagnostic context ("{DIAGNOSTIC_QUESTION}")

**Tier 3: Detail View (Modal/Page)**
- Show: {DETAIL_VIEW_1}, {DETAIL_VIEW_2}, {DETAIL_VIEW_3}
- Why: Deep investigation ("{INVESTIGATION_QUESTION}")

#### Implementation Pattern:

```tsx
// Summary Card (Tier 1)
<Card>
  <CardHeader>
    <CardTitle>{ENTITY_NAME}: {ENTITY_LABEL}</CardTitle>
    <Badge variant="{STATUS_VARIANT}">{STATUS_LABEL}: {STATUS_VALUE}</Badge>
  </CardHeader>
  <CardContent>
    <Button onClick={expandCard}>View Details</Button>
  </CardContent>
</Card>

// Expanded Card (Tier 2)
<Card expanded={isExpanded}>
  <{BREAKDOWN_COMPONENT} />
  <{TREND_COMPONENT} />
  <Button onClick={openModal}>Full Analysis</Button>
</Card>

// Detail Modal (Tier 3)
<Dialog>
  <{RESULTS_COMPONENT} />
  <{DETAILED_BREAKDOWN_COMPONENT} />
  <{ANALYTICS_COMPONENT} />
</Dialog>
```

---

### 5. Consistent Navigation Patterns

**Principle:** Users should always know where they are and how to get back.

#### Navigation Components Required:

**1. Global Navigation (Always Visible)**
- Logo (clickable, returns to dashboard)
- Primary sections ({NAV_SECTION_1}, {NAV_SECTION_2}, {NAV_SECTION_3}, {NAV_SECTION_4})
- User menu (Settings, Team, Logout)

**2. Breadcrumbs (Context Pages)**
```tsx
// {ENTITY_TYPE} Detail Page
<Breadcrumb>
  <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/{ENTITY_COLLECTION}">{NAV_SECTION_1}</BreadcrumbItem>
  <BreadcrumbItem>{ENTITY_NAME} - {ENTITY_DATE}</BreadcrumbItem>
</Breadcrumb>
```

**3. Back Button (Detail Pages)**
- Always provide "Back to [Parent]" button
- Use browser back (history API) for SPA navigation

**4. Exit Paths (Modals)**
- X button (top-right)
- Cancel button (bottom-left)
- Click outside modal (optional, use sparingly)

---

### 6. Search & Findability

**Principle:** Users should be able to find any content within 3 clicks or 10 seconds of searching.

#### Search Strategy:

**Global Search (⌘K or Ctrl+K)**
```tsx
<CommandPalette>
  {/* Search across: */}
  - {ENTITY_TYPE_1} (by {SEARCH_FIELD_1}, {SEARCH_FIELD_2}, {SEARCH_FIELD_3})
  - {ENTITY_TYPE_2} (by {SEARCH_FIELD_4}, {SEARCH_FIELD_5}, {SEARCH_FIELD_6})
  - {ENTITY_TYPE_3} (by {SEARCH_FIELD_7}, {SEARCH_FIELD_8})
  - Settings (by keyword)
</CommandPalette>
```

**Scoped Search (Per-Page)**
- {NAV_SECTION_1} page: Filter by {FILTER_1}, {FILTER_2}, {FILTER_3}
- {NAV_SECTION_2} page: Filter by {FILTER_4}, {FILTER_5}, {FILTER_6}
- {NAV_SECTION_3} page: Filter by {FILTER_7}, {FILTER_8}

**Findability Heuristics:**
- **3-click rule:** Any content reachable in ≤3 clicks from dashboard
- **10-second rule:** Search results appear in <10s
- **Zero results:** Always provide "Create new [item]" option

---

### 7. Content Density Guidelines

**Principle:** Balance information density with cognitive load based on user expertise and task urgency.

#### Data-Dense Dashboards ({PRIMARY_USER} Primary View)

**High Density Appropriate:**
- Multiple metrics visible simultaneously (6-8 cards)
- Small typography for secondary info (`text-body-sm`)
- Compact spacing (`gap-4`)
- Why: {PRIMARY_USER_PLURAL} are {USER_EXPERTISE_LEVEL} users who scan quickly

**Example:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{DASHBOARD_COLS} gap-4">
  {/* {CARD_COUNT} metric cards visible on large screens */}
  <MetricCard label="{METRIC_1_LABEL}" value="{METRIC_1_VALUE}" />
  <MetricCard label="{METRIC_2_LABEL}" value="{METRIC_2_VALUE}" />
  <MetricCard label="{METRIC_3_LABEL}" value="{METRIC_3_VALUE}" />
  <MetricCard label="{METRIC_4_LABEL}" value="{METRIC_4_VALUE}" />
  {/* ... {ADDITIONAL_CARDS} more cards */}
</div>
```

#### Low Density ({SECONDARY_USER_TYPE})

**Low Density Appropriate:**
- Single focus per page/section
- Large typography (`text-display-lg`)
- Generous spacing (`gap-12`)
- Why: {SECONDARY_USER_TYPE} are {SECONDARY_USER_EXPERTISE} users who need guidance

**Example:**
```tsx
<section className="py-12 px-6 max-w-4xl mx-auto">
  <h1 className="text-display-lg mb-12">{SECONDARY_VIEW_TITLE}</h1>
  <div className="text-center mb-12">
    <span className="text-metric-2xl font-mono text-semantic-{STATUS_COLOR}">
      {PRIMARY_METRIC_VALUE}
    </span>
    <Badge variant="{STATUS_VARIANT}">{STATUS_LABEL}</Badge>
  </div>
  <p className="text-body-lg text-center">
    {GUIDANCE_TEXT}
  </p>
</section>
```

---

### 8. Grouping & Chunking

**Principle:** Use visual grouping to reduce cognitive load and support working memory limits (7±2 items).

#### Grouping Strategies:

**1. Proximity (Gestalt Law)**
- Related items: `gap-2` to `gap-4` (8-16px)
- Unrelated sections: `gap-8` to `gap-12` (32-48px)

**Example:**
```tsx
{/* Related: {RELATED_CONCEPT_1} + {RELATED_CONCEPT_2} */}
<div className="flex items-center gap-2">
  <h2>{RELATED_ELEMENT_1}</h2>
  <Badge>{RELATED_ELEMENT_2}</Badge>
</div>

{/* Space between unrelated sections */}
<div className="mt-12">
  <h3>{UNRELATED_SECTION_TITLE}</h3>
  {/* ... */}
</div>
```

**2. Visual Containers**
- Cards: Group related metrics/content
- Borders: Separate sections without heavy visual weight
- Background colors: Subtle hierarchy (card bg vs. page bg)

**3. Semantic Grouping**
- Group by workflow stage ({WORKFLOW_STAGE_1} → {WORKFLOW_STAGE_2} → {WORKFLOW_STAGE_3})
- Group by data type ({DATA_TYPE_1} → {DATA_TYPE_2} → {DATA_TYPE_3})
- Group by urgency ({PRIORITY_1} → {PRIORITY_2} → {PRIORITY_3})

**4. Chunking Large Lists**
- Pagination: 10-25 items per page (default: {DEFAULT_PAGE_SIZE})
- Infinite scroll: For exploratory browsing (not recommended for data tables)
- Load more: For partial lists (show first 5, "Load 20 more")

---

### 9. Empty States

**Principle:** Empty states are not failures—they're opportunities to guide users.

#### Empty State Patterns:

**1. First-Time Use (Zero State)**
```tsx
<EmptyState
  icon={<{ICON_COMPONENT_1} />}
  title="Welcome to {PROJECT_NAME}"
  description="{FIRST_USE_GUIDANCE}"
  primaryAction={{
    label: "{PRIMARY_CTA_LABEL}",
    href: "{PRIMARY_CTA_HREF}"
  }}
  secondaryAction={{
    label: "{SECONDARY_CTA_LABEL}",
    href: "{SECONDARY_CTA_HREF}"
  }}
/>
```

**2. User-Cleared State**
```tsx
<EmptyState
  icon={<{ICON_COMPONENT_2} />}
  title="{CLEARED_STATE_TITLE}"
  description="{CLEARED_STATE_DESCRIPTION}"
  primaryAction={{
    label: "{NEW_ITEM_CTA}",
    href: "{NEW_ITEM_HREF}"
  }}
/>
```

**3. Error State**
```tsx
<EmptyState
  icon={<{ICON_COMPONENT_3} />}
  title="{ERROR_TITLE}"
  description="{ERROR_DESCRIPTION}"
  primaryAction={{
    label: "Retry",
    onClick: refetch
  }}
  secondaryAction={{
    label: "Contact Support",
    href: "/support"
  }}
/>
```

**4. No Results (Search/Filter)**
```tsx
<EmptyState
  icon={<Search />}
  title="No results for '{SEARCH_QUERY}'"
  description="Try adjusting your filters or search terms."
  primaryAction={{
    label: "Clear Filters",
    onClick: clearFilters
  }}
/>
```

---

## Page-Specific IA Guidelines

### Dashboard (Home)

**Purpose:** At-a-glance overview of {PRIMARY_USER}'s current workload and {STATUS_OVERVIEW}

**Content Hierarchy:**
1. **Hero KPI** (center top): {HERO_METRIC_1} + {HERO_METRIC_2}
2. **Action Row** (prominent): "{PRIMARY_ACTION_LABEL}" + "{SECONDARY_ACTION_LABEL}"
3. **Recent Activity** (left column): Last {RECENT_COUNT} {RECENT_ENTITY_TYPE} with quick actions
4. **Alerts** (right column): {ALERT_TYPE_1}, {ALERT_TYPE_2}
5. **Aggregate Metrics** (bottom): Charts showing trends across all {AGGREGATE_ENTITY_TYPE}

**Layout:**
```
┌─────────────────────────────────────┐
│  HERO: {HERO_METRIC_1}              │
│        {HERO_METRIC_2}              │
│  [{PRIMARY_CTA}] [{SECONDARY_CTA}]  │
├──────────────────┬──────────────────┤
│ RECENT           │ ALERTS           │
│ - {ITEM_1}       │ ⚠ {ALERT_1}      │
│ - {ITEM_2}       │ ⚠ {ALERT_2}      │
│ - {ITEM_3}       │                  │
├──────────────────┴──────────────────┤
│ TRENDS (Charts)                     │
│ [{TREND_CHART_TYPE}]                │
└─────────────────────────────────────┘
```

---

### {NAV_SECTION_1} (Core Workflow)

**Purpose:** Create, view, and manage {ENTITY_TYPE}

**Content Hierarchy:**
1. **Action Bar** (top): "{NEW_ENTITY_CTA}" button + search/filter controls
2. **{ENTITY_TYPE} List** (main): Cards or table rows with key info
3. **Quick Filters** (left sidebar): By {FILTER_CRITERIA_1}, {FILTER_CRITERIA_2}, {FILTER_CRITERIA_3}
4. **{ENTITY_TYPE} Detail** (modal or page): Full breakdown with {DETAIL_SECTIONS}

**List View Columns:**
- {COLUMN_1} (primary, bold)
- {COLUMN_2} (secondary)
- {COLUMN_3} (large, color-coded)
- {COLUMN_4} (badge: {STATUS_1}, {STATUS_2}, {STATUS_3})
- Actions ({ACTION_1}, {ACTION_2}, {ACTION_3})

---

### {NAV_SECTION_2} ({COMPARATIVE_FEATURE})

**Purpose:** Compare {ENTITY_TYPE} performance to {COMPARISON_ENTITIES} and {STANDARDS_TYPE}

**Content Hierarchy:**
1. **{ENTITY_TYPE} Selector** (top): Dropdown to choose {ENTITY_TYPE}
2. **{COMPARISON_LANDSCAPE}** (main): Chart showing all {COMPARISON_ENTITIES} + {ENTITY_TYPE} position
3. **{DIMENSION_COMPARISON}** (tabs): View by {DIMENSION_1}, {DIMENSION_2}, {DIMENSION_3}
4. **Leader Analysis** (right panel): Deep dive on #{LEADER_POSITION} {COMPARISON_ENTITY} ({ANALYSIS_QUESTION})

**Visual Pattern:**
- Horizontal bar chart with {ENTITY_TYPE} highlighted
- Color-coded by {COLOR_CRITERIA} (red/yellow/green)
- Sortable by {SORT_OPTION_1}, {SORT_OPTION_2}, {SORT_OPTION_3}

---

### {NAV_SECTION_3} ({DELIVERABLE_TYPE})

**Purpose:** Generate {DELIVERABLE_OUTPUT} for {DELIVERABLE_RECIPIENT} presentations

**Content Hierarchy:**
1. **Template Selector** (top): Choose {TEMPLATE_TYPE} ({TEMPLATE_1}, {TEMPLATE_2}, {TEMPLATE_3})
2. **Customization** (left panel): Logo, branding, sections to include
3. **Preview** (center): Live preview of {OUTPUT_FORMAT}
4. **Action Bar** (bottom): Generate {OUTPUT_FORMAT}, Email to {RECIPIENT}, Download

**{DELIVERABLE_TYPE} Sections (Default Order):**
1. {SECTION_1} (1 page)
2. {SECTION_2} (1 page, large visual)
3. {SECTION_3} ({SUBSECTION_COUNT} pages, 1 per {SUBSECTION_TYPE})
4. {SECTION_4} (2 pages)
5. {SECTION_5} (2-3 pages)
6. Appendix ({APPENDIX_CONTENT}, methodology)

---

### {NAV_SECTION_4} ({TRACKING_FEATURE})

**Purpose:** Track {ENTITY_TYPE} progress over time, measure {SUCCESS_METRIC}, prove value

**Content Hierarchy:**
1. **{ENTITY_TYPE} Selector** (top): Choose {ENTITY_TYPE} or "All {ENTITY_TYPE_PLURAL}"
2. **Time Range** (filter): Last {TIME_RANGE_1}, {TIME_RANGE_2}, {TIME_RANGE_3}, custom
3. **Before/After Comparison** (main): Initial {METRIC} → current {METRIC}
4. **Trend Charts** (center): {METRIC} over time, {IMPROVEMENT_METRICS}
5. **ROI Metrics** (bottom): {ROI_METRIC_1}, {ROI_METRIC_2}, {ROI_METRIC_3}

**Key Visualizations:**
- Line chart: {METRIC} trend over time
- Bar chart: {DIMENSION} improvements (stacked before/after)
- Table: {ENTITY_TYPE} history with deltas

---

## Information Scent & Navigation Cues

**Principle:** Users should always have a clear "scent" of where information lives.

### Visual Cues for Navigation:

**1. Active State**
```tsx
<NavLink
  href="/{NAV_ROUTE}"
  className={cn(
    "text-body-md transition-colors",
    isActive
      ? "text-brand-500 font-semibold border-b-2 border-brand-500"
      : "text-muted-foreground hover:text-foreground"
  )}
>
  {NAV_LABEL}
</NavLink>
```

**2. Disabled State**
```tsx
<NavLink
  disabled
  className="text-muted-foreground cursor-not-allowed opacity-50"
  title="Coming soon"
>
  {FUTURE_FEATURE_LABEL}
</NavLink>
```

**3. External Links**
```tsx
<a
  href="{EXTERNAL_URL}"
  target="_blank"
  className="flex items-center gap-1"
>
  {LINK_LABEL}
  <ExternalLink className="h-3 w-3" />
</a>
```

**4. Action Indicators**
```tsx
{/* Primary action (button styling) */}
<Button>{PRIMARY_ACTION}</Button>

{/* Secondary action (link styling) */}
<Link className="text-brand-500 hover:underline">View Details</Link>

{/* Tertiary action (icon only) */}
<button aria-label="{ACTION_LABEL}">
  <{ICON_COMPONENT} className="h-4 w-4" />
</button>
```

---

## Mobile IA Considerations

**Principle:** Mobile IA requires ruthless prioritization and simplified navigation.

### Mobile-Specific Patterns:

**1. Hamburger Menu (Navigation)**
- Primary nav moves to slide-out menu
- Only 5-7 top-level items visible
- Sub-navigation revealed on tap

**2. Bottom Tab Bar (High-Frequency Actions)**
```tsx
<TabBar>
  <Tab icon={<{ICON_1} />} label="{TAB_1_LABEL}" />
  <Tab icon={<{ICON_2} />} label="{TAB_2_LABEL}" />
  <Tab icon={<{ICON_3} />} label="{TAB_3_LABEL}" />
  <Tab icon={<{ICON_4} />} label="{TAB_4_LABEL}" />
</TabBar>
```

**3. Progressive Disclosure (Accordions)**
- {COLLAPSIBLE_CONTENT_1} hidden by default
- Tap card to expand
- Only 1 card expanded at a time

**4. Swipe Actions (Lists)**
- Swipe left: Delete, Archive
- Swipe right: Mark as reviewed, Star

---

## IA Validation Checklist

### Pre-Implementation:

- [ ] Does this feature align with {PRIMARY_USER} mental model?
- [ ] Is content hierarchy clear (primary → secondary → tertiary)?
- [ ] Are navigation labels task-oriented (not technical)?
- [ ] Is progressive disclosure used appropriately?
- [ ] Are empty states designed and helpful?
- [ ] Is search/findability strategy defined?
- [ ] Is mobile IA simplified and prioritized?

### Post-Implementation:

- [ ] Can users find any content in ≤3 clicks?
- [ ] Are active navigation states clearly indicated?
- [ ] Do breadcrumbs show accurate hierarchy?
- [ ] Are empty states tested (zero state, error state, no results)?
- [ ] Is search tested with edge cases (no results, typos)?
- [ ] Is mobile navigation tested on small screens (375px)?

---

## Anti-Patterns to Avoid

### ❌ Database-Driven Navigation
```
{DATABASE_TABLE_1} → {DATABASE_TABLE_2} → {DATABASE_TABLE_3} → {DATABASE_TABLE_4}
```
**Why wrong:** Exposes internal data model, not user workflow.

### ❌ Feature Bloat in Primary Nav
```
Dashboard | {NAV_1} | {NAV_2} | {NAV_3} | {NAV_4} | {NAV_5} | {NAV_6} | {NAV_7} | {NAV_8} | {NAV_9} | {NAV_10} | {NAV_11} | {NAV_12}
```
**Why wrong:** >7 items, violates working memory limits. Use dropdowns or secondary nav.

### ❌ No Clear Entry Points
```
Landing on dashboard with no obvious "What do I do first?" action.
```
**Why wrong:** Forces users to guess. Always have a primary CTA.

### ❌ Orphaned Pages
```
Detail page with no breadcrumbs or back button.
```
**Why wrong:** Users get stuck and use browser back (breaks SPA state).

### ❌ Inconsistent Terminology
```
"{TERM_1_VARIANT_1}" in nav, "{TERM_1_VARIANT_2}" in page title, "{TERM_1_VARIANT_3}" in content
```
**Why wrong:** Confuses users. Use consistent terms everywhere.

---

## Related Documentation

- **Visual Hierarchy:** `.agent-os/instructions/design/visual-hierarchy.md`
- **Component Guidelines:** `.agent-os/instructions/design/component-usage.md`
- **Design System:** `.agent-os/instructions/compliance/design-system.md`
- **UX Principles:** `.agent-os/instructions/design/ux-principles.md`

---

**Version:** 1.0.0
**Last Updated:** {CREATION_DATE}
**Status:** Active Enforcement Document
**Feedback:** Report IA issues to design team
