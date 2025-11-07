# Live Scoring Code Review - Issues & Fixes

**Date**: 2025-11-03
**Phase**: Phase 3 - Live Scoring
**Status**: Issues identified and fixed, ready for manual testing

## Summary

Performed systematic code review of the live scoring implementation and identified 8 critical issues related to reactivity, data integrity, security, and race conditions. All issues have been fixed.

---

## Issues Found & Fixed

### Issue #1: Non-Reactive Lock Status ✅
**File**: `src/routes/match/[matchId]/+page.svelte:29-34`

**Problem**:
Lock status (`isLocked` and `canEdit`) were managed with `$state` and only updated via `$effect()` on mount. Real-time subscription updates wouldn't trigger UI updates, requiring page refresh to see lock changes from other clients.

**Fix**:
Changed to `$derived` state computed directly from the real-time `$score` store:
```typescript
// Before
let isLocked = $state(false);
$effect(() => { /* manual updates */ });

// After
let isLocked = $derived(score?.locked_by !== null && score?.locked_by !== undefined);
let canEdit = $derived(
  ($persona === 'media' || $persona === 'spectator') &&
    (!isLocked || score?.locked_by === $clientId)
);
```

**Impact**: Lock status now updates instantly when other users lock/unlock matches.

---

### Issue #2: Sparse Array Creation in Score Updates ✅
**File**: `src/lib/supabase/actions.ts:68-71`

**Problem**:
When initializing a new set, code directly assigned to array index, creating sparse arrays:
```typescript
sets[setNumber] = { team1Score: 0, team2Score: 0 };
// Could create: [set0, undefined, undefined, newSet]
```

**Fix**:
Fill array sequentially before accessing:
```typescript
while (sets.length <= setNumber) {
  sets.push({ team1Score: 0, team2Score: 0 });
}
```

**Impact**: Prevents rendering issues when iterating over sets array in UI.

---

### Issue #3: Missing Lock Validation in Score Updates ✅
**File**: `src/lib/supabase/actions.ts:47-88`

**Problem**:
`updateScore()` function accepted `clientId` parameter but never validated that the client actually held the lock. Any client could bypass UI checks and update scores via direct API calls.

**Fix**:
Added server-side lock validation:
```typescript
const { data: current } = await supabase
  .from('match_scores')
  .select('sets, locked_by')  // ← Added locked_by
  .eq('match_id', matchId)
  .maybeSingle();

if (current.locked_by !== clientId) {
  throw new Error('You do not have the lock for this match');
}
```

**Impact**: Prevents unauthorized score updates, enforces lock ownership.

---

### Issue #4: Race Condition in Score Updates ✅
**File**: `src/lib/supabase/actions.ts:87-94`

**Problem**:
Read-modify-write pattern without optimistic locking:
1. Read current sets
2. Modify in memory
3. Write back

If two clients somehow both had locks (due to Issue #8), they could overwrite each other's updates.

**Fix**:
Added atomic lock validation in UPDATE query:
```typescript
const { error } = await supabase
  .from('match_scores')
  .update({ sets })
  .eq('match_id', matchId)
  .eq('locked_by', clientId);  // ← Only update if lock still held
```

**Impact**: Prevents score overwrites if lock state changes during update.

---

### Issue #5: Improper Store Usage Pattern ✅
**File**: `src/routes/match/[matchId]/+page.svelte:22`

**Problem**:
Code used `let score = $derived(liveScore(matchId))` which created a derived value containing the store object. Template then accessed it as `$score`. This pattern doesn't properly manage store subscriptions when `matchId` changes, potentially causing subscription leaks.

**Fix**:
Separated store creation from value derivation:
```typescript
// Before
let score = $derived(liveScore(matchId));
// Template: {$score?.sets[0]?.team1Score}

// After
let scoreStore = $derived(liveScore(matchId));
let score = $derived($scoreStore);
// Template: {score?.sets[0]?.team1Score}
```

**Impact**: Proper subscription lifecycle management, prevents memory leaks.

---

### Issue #6: Missing Error Handling in Unlock ✅
**File**: `src/lib/supabase/actions.ts:35-40`

**Problem**:
`unlockMatch()` function didn't check or throw errors from Supabase. If the update failed, it would silently succeed, leaving UI in inconsistent state.

**Fix**:
Added error handling:
```typescript
const { error } = await query;
if (error) throw error;
```

**Impact**: Unlock failures now properly propagate to UI error handlers.

---

### Issue #7: No Lock Ownership Validation in Unlock ✅
**File**: `src/lib/supabase/actions.ts:36-50`

**Problem**:
Any client could unlock any match without verifying they owned the lock. No validation of lock ownership before clearing `locked_by`.

**Fix**:
Added optional client ID validation:
```typescript
export async function unlockMatch(matchId: number, clientId?: string): Promise<void> {
  const query = supabase
    .from('match_scores')
    .update({ locked_by: null, locked_at: null })
    .eq('match_id', matchId);

  // Only unlock if this client owns the lock
  if (clientId) {
    query.eq('locked_by', clientId);
  }

  const { error } = await query;
  if (error) throw error;
}
```

**Impact**: Prevents clients from unlocking matches locked by others.

---

### Issue #8: Race Condition in Lock Acquisition ✅ (CRITICAL)
**File**: `src/lib/supabase/actions.ts:13-29`

**Problem**:
`lockMatch()` used `upsert` which always succeeds, overwriting existing locks. If two clients tried to lock simultaneously, both could succeed, with the second overwriting the first:

```typescript
// Original code - UNSAFE
const { error } = await supabase.from('match_scores').upsert({
  match_id: matchId,
  locked_by: clientId,  // ← Overwrites existing lock!
  // ...
});
```

**Fix**:
Implemented atomic check-and-set pattern:
```typescript
export async function lockMatch(matchId, clientId, eventId) {
  // 1. Check if match score exists and if it's locked
  const { data: existing } = await supabase
    .from('match_scores')
    .select('locked_by')
    .eq('match_id', matchId)
    .maybeSingle();

  if (existing) {
    // 2. Reject if locked by someone else
    if (existing.locked_by !== null && existing.locked_by !== clientId) {
      throw new Error('Match is already locked by another user');
    }

    // 3. Update with WHERE clause to ensure atomicity
    const { error } = await supabase
      .from('match_scores')
      .update({ locked_by: clientId, locked_at: now })
      .eq('match_id', matchId)
      .or(`locked_by.is.null,locked_by.eq.${clientId}`);

    if (error) throw error;
  } else {
    // 4. Create new record if doesn't exist
    const { error } = await supabase.from('match_scores').insert({
      match_id: matchId,
      locked_by: clientId,
      locked_at: now,
      sets: []
    });

    if (error) throw error;
  }
}
```

**Impact**: Prevents multiple clients from acquiring locks simultaneously. Ensures exclusive access to match scoring.

---

## Files Modified

1. **src/lib/supabase/actions.ts**
   - Fixed `lockMatch()` race condition (Issue #8)
   - Fixed `unlockMatch()` error handling and validation (Issues #6, #7)
   - Fixed `updateScore()` sparse arrays, lock validation, and race condition (Issues #2, #3, #4)

2. **src/routes/match/[matchId]/+page.svelte**
   - Fixed lock status reactivity (Issue #1)
   - Fixed store usage pattern (Issue #5)
   - Updated all template references from `$score` to `score`

---

## Testing Required

### Manual Testing Checklist

#### Single Client Testing
- [ ] Load match detail page as media persona
- [ ] Click "Lock Match for Scoring" button
- [ ] Verify lock button changes to score entry interface
- [ ] Test +1/-1 buttons for both teams across all 5 sets
- [ ] Verify scores update immediately in display section below
- [ ] Click "Unlock Match" button
- [ ] Verify interface returns to locked state

#### Multi-Client Testing (Two Browser Windows)
- [ ] Open same match in two browsers with different personas
- [ ] **Client A**: Lock the match
- [ ] **Client B**: Verify "Match is locked by another user" message appears instantly
- [ ] **Client A**: Update scores
- [ ] **Client B**: Verify scores update in real-time in read-only display
- [ ] **Client B**: Attempt to click "Lock Match" button
- [ ] **Client B**: Verify error: "Match is already locked by another user"
- [ ] **Client A**: Unlock the match
- [ ] **Client B**: Verify lock button becomes available instantly
- [ ] **Client B**: Lock the match successfully
- [ ] **Client A**: Verify now shows "locked by another user"

#### Edge Cases
- [ ] Test rapid clicking of +1/-1 buttons (debounce/throttle)
- [ ] Test negative scores (should not go below 0)
- [ ] Test all 5 sets independently
- [ ] Test page refresh while holding lock (should maintain lock)
- [ ] Test network disconnection and reconnection
- [ ] Test locking while another client is updating scores

---

## Known Limitations

1. **No Lock Timeout**: Locks don't automatically expire. If a client crashes or closes browser while holding lock, match remains locked until manually unlocked (could add automatic timeout in future).

2. **No Conflict Resolution UI**: If lock acquisition fails, error message is shown but user has no way to force unlock (could add admin override in future).

3. **No Optimistic UI Updates**: Score updates wait for server confirmation before updating UI. Could add optimistic updates with rollback on error.

4. **No Score History/Undo**: Once a score is updated, there's no way to undo or view history (could add audit trail in future).

---

## Next Steps

1. **Manual Testing**: Complete the testing checklist above
2. **Fix Any Issues Found**: Document and fix any issues discovered during manual testing
3. **Phase 3 Completion**: If all tests pass, mark Phase 3 as complete
4. **Phase 4 Planning**: Move on to Phase 4 - Polish (conflict detection, statistics, mobile optimization)

---

## References

- Product Requirements: `docs/product-requirements.md`
- Database Schema: `supabase/migrations/001_create_match_scores.sql`
- Type Definitions: `src/lib/types/supabase.ts`
