# Color Migration Map - CourSync Design System v2.0

## Quick Reference: Old → New

### Primary Actions (Blue)
```
OLD: bg-[#eab308] text-[#18181b]  (Gold button)
NEW: bg-brand-500 text-white
HOVER: hover:bg-brand-600
```

### Conflicts & Warnings (Amber, NOT Red)
```
OLD: text-[#ef4444] (Red conflicts)
NEW: text-warning-500
ICON: text-warning-500 (⚠️)
```

### Selection States (Gold - Keep)
```
OLD: bg-[#eab308] text-[#18181b]
NEW: bg-gold-500 text-charcoal-950
USE: Only for active tabs, selected matches
```

### Backgrounds
```
OLD: style="background-color: #18181b;"
NEW: bg-surface-950

OLD: style="background-color: #252529;"
NEW: bg-surface-200

OLD: style="background-color: #3b3c48;"
NEW: bg-charcoal-800

OLD: style="background-color: #454654;"
NEW: bg-charcoal-700
```

### Text Colors
```
OLD: style="color: #f5f5f7;"
NEW: text-charcoal-50

OLD: style="color: #a1a1a6;"
NEW: text-charcoal-300

OLD: style="color: #9fa2ab;"
NEW: text-charcoal-300

OLD: style="color: #6e6e73;"
NEW: text-charcoal-500

OLD: style="color: #c0c2c8;"
NEW: text-charcoal-200
```

### Borders
```
OLD: style="border-color: #454654;"
NEW: border-charcoal-700

OLD: border border-[#525463]
NEW: border border-charcoal-600
```

### Status Colors
```
Success: bg-success-500 / text-success-500
Warning: bg-warning-500 / text-warning-500
Error: bg-error-500 / text-error-500
Info: bg-info-500 / text-info-500
```

## Component-Specific Migrations

### MatchClaimButton
- PRIMARY ACTION: `bg-[#eab308]` → `bg-brand-500`
- HOVER: → `hover:bg-brand-600`
- DISABLED: → `disabled:opacity-50`

### Conflict Indicators
- COLOR: `#ef4444` → `text-warning-500` (amber, not red!)
- ICON: ⚠️ stays but uses `text-warning-500`

### View Mode Toggles (List/Timeline)
- SELECTED: `bg-[#eab308]` → `bg-gold-500` (keep gold for selection)
- UNSELECTED: → `bg-transparent text-charcoal-300`

### Secondary Buttons
- BG: `bg-[#454654]` → `bg-charcoal-700`
- TEXT: `text-[#c0c2c8]` → `text-charcoal-200`
- HOVER: → `hover:bg-charcoal-600`

## Migration Checklist

### Core Components (Completed)
- [x] MatchClaimButton.svelte - ✅ Migrated to brand-500 (blue) for primary actions
- [x] +page.svelte (main UI) - ✅ Conflicts now use warning-500 (amber), view toggles use gold-500
- [x] Sidebar.svelte - ✅ Wave buttons use gold-500 for selection, focus states use brand-500

### Secondary Components (Remaining)
- [ ] MatchList.svelte
- [ ] FilterBottomSheet.svelte
- [ ] TeamDetailPanel.svelte
- [ ] MyTeamsSelector.svelte
- [ ] EventInput.svelte
- [ ] TimelineView.svelte
- [ ] ConflictDetailsPanel.svelte
- [ ] TeamStatsView.svelte
- [ ] Scorekeeper.svelte
- [ ] ScoreHistory.svelte
- [ ] LiveMatchDashboard.svelte
- [ ] ClaimHistoryPanel.svelte
- [ ] CoveragePlanPanel.svelte
- [ ] TeamCoverageView.svelte
- [ ] CoverageHandoffDialog.svelte
- [ ] TeamMemberSelector.svelte
- [ ] CoverageStats.svelte
- [ ] CoverageAnalytics.svelte
- [ ] CoachView.svelte
- [ ] WorkAssignmentView.svelte
- [ ] TeamMatchView.svelte
- [ ] PrioritySelector.svelte
- [ ] CoverageStatusSelector.svelte
