# UI/UX Design Principles

**Version:** 1.0.0
**Date:** {CREATION_DATE}
**Enforcement:** MANDATORY for all user-facing features
**Applies to:** Product managers, designers, engineers

## Purpose

This document defines the user experience principles that guide {PROJECT_NAME}'s interface design. These principles ensure usability, reduce cognitive load, and create a {USER_EXPERIENCE_LEVEL} {TARGET_AUDIENCE}-grade platform.

**Foundation:** These principles are derived from decades of HCI research, Nielsen's heuristics, and best practices for {APPLICATION_DOMAIN} software.

---

## Core UX Principles

### 1. Recognition Over Recall

**Principle:** Minimize the user's memory load by making objects, actions, and options visible.

**Why:** Working memory is limited (7±2 items). Forcing users to remember information increases cognitive load and errors.

#### {PROJECT_NAME} Implementation:

**✅ GOOD: Visible Actions**
```tsx
{/* All actions visible in card */}
<Card>
  <CardHeader>
    <CardTitle>{ENTITY_NAME_EXAMPLE}</CardTitle>
    <CardDescription>{STATUS_DESCRIPTION}: {STATUS_VALUE}</CardDescription>
  </CardHeader>
  <CardFooter className="flex gap-2">
    <Button>{PRIMARY_ACTION_LABEL}</Button>
    <Button variant="outline">{SECONDARY_ACTION_LABEL}</Button>
    <Button variant="outline">{TERTIARY_ACTION_LABEL}</Button>
  </CardFooter>
</Card>
```

**❌ BAD: Hidden Actions (Recall Required)**
```tsx
{/* User must remember keyboard shortcuts */}
<Card>
  <CardTitle>{ENTITY_NAME_EXAMPLE}</CardTitle>
  {/* How do I {ACTION_EXAMPLE}? Press Cmd+R? Right-click? */}
</Card>
```

---

**✅ GOOD: Visible Selection State**
```tsx
{/* Active filter clearly visible */}
<FilterGroup>
  <FilterButton active>{FILTER_OPTION_1}</FilterButton>
  <FilterButton>{FILTER_OPTION_2}</FilterButton>
  <FilterButton>{FILTER_OPTION_3}</FilterButton>
</FilterGroup>
```

**❌ BAD: Hidden State**
```tsx
{/* User must remember which filter is active */}
<Select value={filter}>
  {/* Current selection hidden in dropdown */}
</Select>
```

---

**✅ GOOD: Contextual Help**
```tsx
{/* Help text visible when needed */}
<FormField>
  <FormLabel>{FORM_FIELD_LABEL}</FormLabel>
  <FormDescription>
    {FORM_FIELD_HELP_TEXT}
  </FormDescription>
  <Input type="{INPUT_TYPE}" />
</FormField>
```

**❌ BAD: No Context**
```tsx
<Input placeholder="{FIELD_LABEL}" />
{/* What format? Where do I get it? */}
```

---

### 2. Progressive Disclosure

**Principle:** Show only what users need to see right now. Reveal complexity on demand.

**Why:** Too much information causes analysis paralysis. Gradual revelation supports task flow.

#### Three-Tier Disclosure Strategy:

**Tier 1: Summary (Default)**
- Show: Essential information for quick scanning
- Hide: Details, secondary data, actions
- Goal: Fast decision-making

**Tier 2: Expanded (Click to Reveal)**
- Show: Full details, breakdown, context
- Hide: Raw data, technical details
- Goal: Diagnostic investigation

**Tier 3: Deep Dive (Modal/Page)**
- Show: Everything (raw data, logs, technical details)
- Goal: Expert analysis

#### {PROJECT_NAME} Examples:

**{ENTITY_TYPE} Card (Progressive Disclosure)**
```tsx
{/* TIER 1: Summary (collapsed) */}
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{ENTITY_LABEL_EXAMPLE}</CardTitle>
      <Badge variant="{STATUS_VARIANT}">{STATUS_VALUE}</Badge>
    </div>
    <CardDescription>{ENTITY_DESCRIPTION}</CardDescription>
  </CardHeader>
  <CardFooter>
    <Button onClick={expand}>View Breakdown</Button>
  </CardFooter>
</Card>

{/* TIER 2: Expanded (dimensions visible) */}
<Card expanded>
  <CardHeader>
    <CardTitle>{ENTITY_LABEL_EXAMPLE}</CardTitle>
    <Badge>{STATUS_VALUE}</Badge>
  </CardHeader>
  <CardContent>
    <{BREAKDOWN_COMPONENT}>
      <{DIMENSION_COMPONENT} name="{DIMENSION_1_NAME}" value={DIMENSION_1_VALUE} weight={DIMENSION_1_WEIGHT} />
      <{DIMENSION_COMPONENT} name="{DIMENSION_2_NAME}" value={DIMENSION_2_VALUE} weight={DIMENSION_2_WEIGHT} />
      <{DIMENSION_COMPONENT} name="{DIMENSION_3_NAME}" value={DIMENSION_3_VALUE} weight={DIMENSION_3_WEIGHT} />
      <{DIMENSION_COMPONENT} name="{DIMENSION_4_NAME}" value={DIMENSION_4_VALUE} weight={DIMENSION_4_WEIGHT} />
    </{BREAKDOWN_COMPONENT}>
  </CardContent>
  <CardFooter>
    <Button onClick={openModal}>Full Analysis</Button>
  </CardFooter>
</Card>

{/* TIER 3: Deep Dive (modal with all data) */}
<Dialog>
  <DialogHeader>
    <DialogTitle>{ENTITY_LABEL_EXAMPLE} - Full {DETAIL_TYPE}</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <Tabs>
      <TabsList>
        <TabsTrigger>{TAB_1_LABEL}</TabsTrigger>
        <TabsTrigger>{TAB_2_LABEL}</TabsTrigger>
        <TabsTrigger>{TAB_3_LABEL}</TabsTrigger>
        <TabsTrigger>{TAB_4_LABEL}</TabsTrigger>
      </TabsList>
      {/* Full technical details */}
    </Tabs>
  </DialogContent>
</Dialog>
```

---

### 3. Feedback & System Status

**Principle:** Always inform users about what's happening, immediately and clearly.

**Why:** Without feedback, users wonder if their action worked, if the system crashed, or if they should wait.

#### Feedback Timing:

| Action | Expected Feedback | Max Delay | Example |
|--------|------------------|-----------|---------|
| **Instant** | Click button | 100ms | Button depresses, color change |
| **Fast** | Page navigation | 200ms | Loading state appears |
| **Normal** | API call | 1s | Progress indicator |
| **Slow** | Background job | 2s+ | Detailed progress, ETA |

#### {PROJECT_NAME} Feedback Patterns:

**1. Loading States (All Async Operations)**
```tsx
{/* Button loading state */}
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {LOADING_LABEL}...
    </>
  ) : (
    '{ACTION_LABEL}'
  )}
</Button>

{/* Page loading state */}
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  <{LIST_COMPONENT} data={data} />
)}
```

---

**2. Progress Indicators (Long Operations)**
```tsx
{/* Progress bar for {LONG_OPERATION_TYPE} */}
<Card>
  <CardHeader>
    <CardTitle>{OPERATION_IN_PROGRESS_TITLE}</CardTitle>
    <CardDescription>{OPERATION_DESCRIPTION}...</CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={progress} className="w-full" />
    <p className="text-body-sm text-muted-foreground mt-2">
      {completedItems}/{totalItems} {ITEM_TYPE} complete
      {estimatedTimeRemaining && ` · ${estimatedTimeRemaining} remaining`}
    </p>
  </CardContent>
</Card>
```

---

**3. Success Confirmations**
```tsx
{/* Toast notification */}
toast.success('{SUCCESS_MESSAGE}', {
  description: '{SUCCESS_DESCRIPTION}',
  action: {
    label: '{ACTION_CTA}',
    onClick: () => router.push(`{DETAIL_ROUTE}/${id}`)
  }
})
```

---

**4. Error Feedback (Graceful Degradation)**
```tsx
{/* Error state with recovery options */}
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>{ERROR_TITLE}</AlertTitle>
  <AlertDescription>
    {ERROR_MESSAGE}
    <div className="mt-4 flex gap-2">
      <Button variant="outline" onClick={retry}>
        Retry {ACTION_TYPE}
      </Button>
      <Button variant="ghost" onClick={viewLogs}>
        View Error Details
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

---

### 4. Error Prevention

**Principle:** Design to prevent errors before they occur. When errors happen, help users recover.

**Why:** Fixing errors is frustrating. Prevention is better than cure.

#### {PROJECT_NAME} Error Prevention Strategies:

**1. Input Constraints**
```tsx
{/* Prevent invalid input */}
<FormField>
  <FormLabel>{INPUT_LABEL}</FormLabel>
  <FormControl>
    <Input
      type="{INPUT_TYPE}"
      placeholder="{INPUT_PLACEHOLDER}"
      pattern="{INPUT_PATTERN}"
      required
    />
  </FormControl>
  <FormDescription>
    {INPUT_VALIDATION_HINT}
  </FormDescription>
  <FormMessage />  {/* Shows validation error */}
</FormField>
```

---

**2. Confirmations for Destructive Actions**
```tsx
{/* Delete confirmation dialog */}
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">{DESTRUCTIVE_ACTION_LABEL}</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently {DESTRUCTIVE_ACTION_DESCRIPTION}
        <strong> {ENTITY_NAME_EXAMPLE}</strong> and all associated {RELATED_DATA_TYPE}.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={destructiveAction}>
        {DESTRUCTIVE_ACTION_CONFIRM_LABEL}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

**3. Inline Validation (Immediate Feedback)**
```tsx
{/* Real-time validation */}
<FormField>
  <FormLabel>{VALIDATED_FIELD_LABEL}</FormLabel>
  <FormControl>
    <Input
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value)
        validateInput(e.target.value)
      }}
      className={cn(
        isValidating && "border-semantic-warning",
        isValid === false && "border-semantic-error",
        isValid === true && "border-semantic-success"
      )}
    />
  </FormControl>
  {isValid === false && (
    <FormMessage>
      {VALIDATION_ERROR_MESSAGE}
    </FormMessage>
  )}
  {isValid === true && (
    <FormDescription className="text-semantic-success flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      {VALIDATION_SUCCESS_MESSAGE}
    </FormDescription>
  )}
</FormField>
```

---

**4. Undo/Recovery Options**
```tsx
{/* Soft delete with undo */}
toast.success('{ENTITY_TYPE} deleted', {
  description: '{ENTITY_LABEL} has been removed from your {CONTAINER_TYPE}',
  action: {
    label: 'Undo',
    onClick: () => {
      restoreEntity(entityId)
      toast.success('{ENTITY_TYPE} restored')
    }
  }
})
```

---

### 5. Consistency & Standards

**Principle:** Users should not have to wonder whether different words, situations, or actions mean the same thing.

**Why:** Consistency reduces cognitive load. Users learn patterns once and apply them everywhere.

#### {PROJECT_NAME} Consistency Patterns:

**1. Consistent Terminology**
```tsx
// ✅ GOOD: Use "{ENTITY_TYPE}" everywhere
<h1>{ENTITY_TYPE_PLURAL}</h1>
<Button>New {ENTITY_TYPE}</Button>
<CardTitle>Recent {ENTITY_TYPE_PLURAL}</CardTitle>

// ❌ BAD: Mixing terms
<h1>{ENTITY_TYPE_PLURAL}</h1>
<Button>New {ENTITY_SYNONYM_1}</Button>   // Inconsistent!
<CardTitle>Recent {ENTITY_SYNONYM_2}</CardTitle>  // Inconsistent!
```

---

**2. Consistent Button Placement**
```tsx
// ✅ GOOD: Primary action always on right
<DialogFooter>
  <Button variant="outline">Cancel</Button>
  <Button>{PRIMARY_ACTION}</Button>  {/* Primary on right */}
</DialogFooter>

// ❌ BAD: Inconsistent placement
<DialogFooter>
  <Button>{PRIMARY_ACTION}</Button>  {/* Primary on left? */}
  <Button variant="outline">Cancel</Button>
</DialogFooter>
```

---

**3. Consistent Icons**
```tsx
// ✅ GOOD: Same icon for same action everywhere
<Button><{ACTION_ICON} /> {ACTION_LABEL}</Button>
<DropdownMenuItem><{ACTION_ICON} /> {ACTION_SHORT_LABEL}</DropdownMenuItem>

// ❌ BAD: Different icons for same action
<Button><{ACTION_ICON} /> {ACTION_LABEL}</Button>
<DropdownMenuItem><{DIFFERENT_ICON} /> {ACTION_SHORT_LABEL}</DropdownMenuItem>  // Inconsistent!
```

---

### 6. Flexibility & Efficiency

**Principle:** Accelerate workflows for expert users without hindering novices.

**Why:** {PRIMARY_USER_PLURAL} use {PROJECT_NAME} {USAGE_FREQUENCY}. Shortcuts and batch operations save time.

#### {PROJECT_NAME} Efficiency Features:

**1. Keyboard Shortcuts**
```tsx
{/* Global shortcuts */}
useHotkeys('cmd+k', () => openCommandPalette())
useHotkeys('cmd+n', () => {NEW_ENTITY_ACTION}())
useHotkeys('cmd+/', () => openHelp())

{/* Show shortcuts in UI */}
<Button>
  {PRIMARY_ACTION_LABEL}
  <kbd className="ml-2 text-xs text-muted-foreground">⌘N</kbd>
</Button>
```

---

**2. Bulk Actions**
```tsx
{/* Multi-select with bulk operations */}
<DataTable
  data={entities}
  columns={columns}
  enableRowSelection
  onSelectionChange={(selectedRows) => setSelected(selectedRows)}
/>

{selected.length > 0 && (
  <BulkActions>
    <Button onClick={bulkDelete}>
      Delete {selected.length} {ENTITY_TYPE_PLURAL}
    </Button>
    <Button onClick={bulkExport}>
      Export {selected.length} {EXPORT_TYPE}
    </Button>
  </BulkActions>
)}
```

---

**3. Command Palette (Power Users)**
```tsx
{/* Quick access to all actions */}
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="{COMMAND_GROUP_1}">
      <CommandItem onSelect={action1}>
        <{ICON_1} className="mr-2" />
        {ACTION_1_LABEL}
      </CommandItem>
      <CommandItem onSelect={action2}>
        <{ICON_2} className="mr-2" />
        {ACTION_2_LABEL}
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="{COMMAND_GROUP_2}">
      <CommandItem onSelect={action3}>
        <{ICON_3} className="mr-2" />
        {ACTION_3_LABEL}
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

---

**4. Saved Filters/Views**
```tsx
{/* Save common filter combinations */}
<div className="flex items-center gap-2">
  <Select value={savedView} onValueChange={loadView}>
    <SelectTrigger>
      <SelectValue placeholder="Saved views" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">{VIEW_ALL_LABEL}</SelectItem>
      <SelectItem value="{SAVED_VIEW_1_ID}">{SAVED_VIEW_1_LABEL}</SelectItem>
      <SelectItem value="{SAVED_VIEW_2_ID}">{SAVED_VIEW_2_LABEL}</SelectItem>
      <SelectItem value="{SAVED_VIEW_3_ID}">{SAVED_VIEW_3_LABEL}</SelectItem>
    </SelectContent>
  </Select>
  <Button variant="outline" onClick={saveCurrentView}>
    <Save className="h-4 w-4" />
  </Button>
</div>
```

---

### 7. Aesthetic & Minimalist Design

**Principle:** Interfaces should contain only relevant information. Every extra unit of information competes for attention.

**Why:** Cognitive load increases with visual clutter. Simplicity improves focus.

#### {PROJECT_NAME} Minimalism Principles:

**1. Remove Decorative Elements**
```tsx
// ✅ GOOD: Clean, functional
<Card>
  <CardHeader>
    <CardTitle>{METRIC_LABEL}</CardTitle>
  </CardHeader>
  <CardContent>
    <span className="text-metric-xl">{METRIC_VALUE}</span>
  </CardContent>
</Card>

// ❌ BAD: Unnecessary decoration
<Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
  <CardHeader className="relative">
    <div className="absolute inset-0 animate-pulse bg-stars" />
    <CardTitle className="relative z-10 drop-shadow-2xl">
      ✨ {METRIC_LABEL} ✨
    </CardTitle>
  </CardHeader>
  <CardContent className="relative">
    <div className="absolute inset-0 bg-sparkles" />
    <span className="text-metric-xl text-gradient animate-rainbow">
      {METRIC_VALUE}
    </span>
  </CardContent>
</Card>
```

---

**2. Prioritize Content Over Chrome**
```tsx
// ✅ GOOD: Minimal UI, maximum content
<div className="p-6">
  <h1 className="text-heading-xl mb-6">{PAGE_TITLE}</h1>
  <{CONTENT_COMPONENT} />  {/* Content is the focus */}
</div>

// ❌ BAD: Heavy chrome, less content space
<div className="border-8 border-brand-500 rounded-3xl shadow-2xl p-12 m-12">
  <div className="border-4 border-semantic-success rounded-2xl p-8">
    <div className="bg-gradient-to-r from-brand-500 to-semantic-info p-6 rounded-xl">
      <h1 className="text-heading-xl mb-6 drop-shadow-xl">{PAGE_TITLE}</h1>
      <div className="h-[200px]">
        <{CONTENT_COMPONENT} />  {/* Tiny content area! */}
      </div>
    </div>
  </div>
</div>
```

---

**3. Progressive Disclosure (Hide Complexity)**
```tsx
// ✅ GOOD: Advanced options collapsed
<Card>
  <CardHeader>
    <CardTitle>{MAIN_ACTION_TITLE}</CardTitle>
  </CardHeader>
  <CardContent>
    <FormField>
      <FormLabel>{PRIMARY_FIELD_LABEL}</FormLabel>
      <Input placeholder="{PRIMARY_FIELD_PLACEHOLDER}" />
    </FormField>

    <Collapsible>
      <CollapsibleTrigger className="text-body-sm text-muted-foreground">
        Advanced Options
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormField>
          <FormLabel>{ADVANCED_FIELD_1_LABEL}</FormLabel>
          <Textarea />
        </FormField>
        <FormField>
          <FormLabel>{ADVANCED_FIELD_2_LABEL}</FormLabel>
          <MultiSelect options={advancedOptions} />
        </FormField>
      </CollapsibleContent>
    </Collapsible>
  </CardContent>
</Card>
```

---

### 8. Help Users Recognize, Diagnose, and Recover from Errors

**Principle:** Error messages should be plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

**Why:** Cryptic errors frustrate users. Clear guidance enables self-service recovery.

#### {PROJECT_NAME} Error Patterns:

**❌ BAD: Cryptic Error**
```tsx
<Alert variant="destructive">
  Error 500: Internal Server Error
</Alert>
```

**✅ GOOD: Human-Readable Error**
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>{ERROR_ACTION_FAILED}</AlertTitle>
  <AlertDescription>
    {ERROR_EXPLANATION}. This is usually caused by:
    <ul className="mt-2 list-disc list-inside">
      <li>{COMMON_CAUSE_1}</li>
      <li>{COMMON_CAUSE_2}</li>
      <li>{COMMON_CAUSE_3}</li>
    </ul>
    <div className="mt-4 flex gap-2">
      <Button variant="outline" onClick={recoveryAction1}>
        {RECOVERY_ACTION_1_LABEL}
      </Button>
      <Button variant="ghost" asChild>
        <a href="{HELP_URL}" target="_blank">
          {RECOVERY_ACTION_2_LABEL}
        </a>
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

---

**Error Message Formula:**
1. **What happened:** "{ERROR_ACTION_FAILED}"
2. **Why it happened:** "{ERROR_CAUSE}"
3. **How to fix:** "{RECOVERY_INSTRUCTIONS}"
4. **Recovery actions:** Buttons to fix the issue

---

### 9. Accessibility

**Principle:** Design for all users, including those with disabilities.

**Why:** 15% of the world has some form of disability. Accessible design benefits everyone.

#### {PROJECT_NAME} Accessibility Requirements:

**1. Keyboard Navigation (Non-Negotiable)**
```tsx
{/* All interactive elements keyboard accessible */}
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  className="focus:ring-2 focus:ring-brand-500"
>
  {ACTION_LABEL}
</Button>

{/* Skip link for screen readers */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
>
  Skip to main content
</a>
```

---

**2. ARIA Labels (Screen Readers)**
```tsx
{/* Icon-only button needs label */}
<Button aria-label="{ACTION_ARIA_LABEL}" variant="ghost" size="icon">
  <{ICON_COMPONENT} className="h-4 w-4" />
</Button>

{/* Live region for dynamic updates */}
<div aria-live="polite" aria-atomic="true">
  {isRunning && <span>{OPERATION_STATUS}: {progress}% complete</span>}
</div>

{/* Landmark regions */}
<header role="banner">
  <nav role="navigation" aria-label="Primary navigation">
    {/* Nav items */}
  </nav>
</header>

<main role="main" id="main-content">
  {/* Main content */}
</main>

<aside role="complementary" aria-label="Sidebar">
  {/* Sidebar */}
</aside>
```

---

**3. Color Contrast (WCAG {WCAG_LEVEL} Minimum)**
```tsx
// ✅ GOOD: {CONTRAST_RATIO_REQUIRED} contrast
<p className="text-foreground">Primary text</p>  // {CONTRAST_EXAMPLE_1}

// ✅ ACCEPTABLE: Large text, {CONTRAST_RATIO_LARGE_TEXT} contrast
<h1 className="text-heading-xl text-muted-foreground">
  Section Title
</h1>

// ❌ BAD: Insufficient contrast
<p className="text-{LOW_CONTRAST_TEXT} on-{LOW_CONTRAST_BG}-bg">Low contrast</p>  // <{CONTRAST_RATIO_MINIMUM}
```

---

**4. Focus Indicators (Always Visible)**
```tsx
{/* Visible focus ring */}
<Button className="focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background">
  Click Me
</Button>

// ❌ BAD: No focus indicator
<Button className="focus:outline-none">
  Click Me
</Button>
```

---

### 10. Performance Perception

**Principle:** Perceived performance matters as much as actual performance.

**Why:** Users tolerate delays better when they understand what's happening and see progress.

#### {PROJECT_NAME} Performance UX:

**1. Optimistic UI Updates**
```tsx
{/* Update UI immediately, sync in background */}
async function deleteEntity(id: string) {
  // Remove from UI immediately (optimistic)
  setEntities(prev => prev.filter(e => e.id !== id))

  // Show success feedback
  toast.success('{ENTITY_TYPE} deleted')

  // Sync with server
  try {
    await api.delete(`/{ENTITY_API_ROUTE}/${id}`)
  } catch (error) {
    // Rollback if fails
    setEntities(prev => [...prev, entity])
    toast.error('Failed to delete. Please try again.')
  }
}
```

---

**2. Skeleton Loaders (Better than Spinners)**
```tsx
{/* Skeleton shows structure while loading */}
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  <{GRID_COMPONENT} data={data} />
)}
```

---

**3. Pagination vs. Infinite Scroll**
```tsx
// ✅ GOOD: Pagination for data tables (predictable, bookmarkable)
<DataTable
  data={entities}
  columns={columns}
  pagination={{
    pageSize: {DEFAULT_PAGE_SIZE},
    currentPage,
    totalPages,
    onPageChange: setCurrentPage
  }}
/>

// ❌ BAD: Infinite scroll for data tables (unpredictable, can't bookmark)
<InfiniteScroll loadMore={loadMore}>
  {/* Hard to find specific item again */}
</InfiniteScroll>
```

---

## UX Validation Checklist

### Pre-Implementation:
- [ ] Can users complete their task without remembering information?
- [ ] Is complexity hidden (progressive disclosure)?
- [ ] Do all async operations show loading states?
- [ ] Are destructive actions confirmed?
- [ ] Is terminology consistent?
- [ ] Are keyboard shortcuts provided for common actions?
- [ ] Are error messages actionable (explain + suggest fix)?
- [ ] Is the interface accessible (keyboard, screen reader, contrast)?

### Post-Implementation:
- [ ] Can users complete primary task in <60 seconds?
- [ ] Are loading states tested (show, hide, error cases)?
- [ ] Do error states provide recovery options?
- [ ] Is keyboard navigation tested (tab through all elements)?
- [ ] Is screen reader tested (VoiceOver/NVDA)?
- [ ] Are focus indicators visible and styled?
- [ ] Is performance perceived as fast (<1s for interactions)?

---

## Related Documentation

- **Information Architecture:** `.agent-os/instructions/design/information-architecture.md`
- **Visual Design Laws:** `.agent-os/instructions/design/visual-design-laws.md`
- **Design System:** `.agent-os/instructions/compliance/design-system.md`
- **Accessibility:** `.agent-os/instructions/design/accessibility-strategy.md`

---

**Version:** 1.0.0
**Last Updated:** {CREATION_DATE}
**Status:** Active Enforcement Document
**Feedback:** Report UX issues to product/design team
