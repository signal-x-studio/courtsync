# CourtSync Database Documentation

**Purpose:** Production-grade database schema and Row Level Security policies for live match scoring

**Last Updated:** 2025-11-06

---

## Overview

This directory contains SQL scripts for setting up the CourtSync database with proper security policies. The database uses **PostgreSQL** (via Supabase) with Row Level Security (RLS) to ensure data integrity and prevent unauthorized access.

### Key Security Features

1. ✅ **Lock-Based Access Control** - Only lock holders can modify scores
2. ✅ **Lock Expiration Validation** - Expired locks cannot be used
3. ✅ **Automatic Cleanup** - Expired locks are automatically removed
4. ✅ **Concurrent Edit Prevention** - One scorekeeper per match at a time
5. ✅ **Audit Trail** - All updates tracked with timestamps and client IDs

---

## Files

### `schema.sql`
Defines the database tables and indexes:
- `match_scores` - Stores live match scores and lock state
- `match_locks` - Tracks active match locks
- Indexes for optimal query performance
- Cleanup function for expired locks

### `rls-policies.sql`
Implements Row Level Security policies:
- Read access for all users (public scores)
- Write access restricted to lock holders
- Lock expiration checks enforced at database level
- Two implementations: JWT-based (production) and anonymous (development)

---

## Setup Instructions

### 1. Initial Database Setup

Apply the schema first, then the RLS policies:

```bash
# Connect to your Supabase project
# Dashboard → SQL Editor → New Query

# 1. Run schema.sql to create tables
# Copy and paste the contents of schema.sql

# 2. Run rls-policies.sql to enable security
# Copy and paste the contents of rls-policies.sql
```

### 2. Choose Security Mode

**Production (JWT-based):**
- Requires Supabase Auth
- Uses JWT claims for identity verification
- Most secure option
- **Recommended for production**

**Development (Anonymous):**
- No authentication required
- Relies on client-side UUIDs
- Less secure but easier for testing
- **Only for development/testing**

To use anonymous mode, uncomment the "Anonymous Access Policies" section in `rls-policies.sql`.

### 3. Configure Automatic Cleanup (Optional)

If your Supabase plan supports `pg_cron`:

```sql
-- Run every 5 minutes to clean up expired locks
SELECT cron.schedule(
  'cleanup-expired-locks',
  '*/5 * * * *',
  'SELECT cleanup_expired_locks();'
);
```

Otherwise, call `cleanup_expired_locks()` periodically from your application:

```typescript
// Run every 5 minutes from a background job
setInterval(async () => {
  await supabase.rpc('cleanup_expired_locks');
}, 5 * 60 * 1000);
```

---

## Security Model

### Lock Lifecycle

1. **Acquire Lock**
   - Client requests lock for a match
   - System checks if lock is available
   - Lock created with 15-minute expiration
   - Client receives lock confirmation

2. **Hold Lock**
   - Client can update scores
   - Lock auto-expires after 15 minutes
   - Client can extend lock by updating expiration
   - Other clients cannot modify this match

3. **Release Lock**
   - Client explicitly releases lock, OR
   - Lock expires automatically after 15 minutes
   - Match becomes available for other clients

### RLS Policy Summary

| Action | Table | Who Can Do It | Conditions |
|--------|-------|--------------|------------|
| SELECT | match_scores | Anyone | Public read access |
| SELECT | match_locks | Anyone | See who has locks |
| INSERT | match_scores | Anyone | No active lock exists |
| INSERT | match_locks | Anyone | No active lock exists |
| UPDATE | match_scores | Lock holder | Lock valid & not expired |
| UPDATE | match_locks | Lock holder | Lock valid & not expired |
| DELETE | match_scores | Lock holder or expired | Lock ownership or timeout |
| DELETE | match_locks | Lock holder or expired | Lock ownership or timeout |

### Security Guarantees

✅ **Prevents concurrent editing** - Two scorekeepers can't edit same match
✅ **Prevents unauthorized updates** - Non-lock-holders can't modify scores
✅ **Prevents stale lock usage** - Expired locks automatically invalidated
✅ **Enforced at database level** - Cannot be bypassed by client code
✅ **Automatic recovery** - Abandoned locks expire and clean up

---

## Testing Security

### Test Cases

Run these tests to verify RLS policies work correctly:

```sql
-- Test 1: Lock a match as Client A
INSERT INTO match_locks (match_id, locked_by, expires_at)
VALUES (12345, 'client-a-uuid', NOW() + INTERVAL '15 minutes');

-- Test 2: Try to lock same match as Client B (should fail)
INSERT INTO match_locks (match_id, locked_by, expires_at)
VALUES (12345, 'client-b-uuid', NOW() + INTERVAL '15 minutes');
-- Expected: ERROR - violates unique constraint or RLS policy

-- Test 3: Client A updates score (should succeed)
UPDATE match_scores
SET sets = '[{"setNumber": 1, "team1Score": 5, "team2Score": 3}]'::jsonb,
    last_updated = NOW(),
    last_updated_by = 'client-a-uuid'
WHERE match_id = 12345
  AND locked_by = 'client-a-uuid';

-- Test 4: Client B tries to update score (should fail)
UPDATE match_scores
SET sets = '[{"setNumber": 1, "team1Score": 10, "team2Score": 10}]'::jsonb
WHERE match_id = 12345;
-- Expected: ERROR - RLS policy violation

-- Test 5: Wait 15+ minutes, then Client B tries again (should fail)
-- The lock expired but Client B still shouldn't be able to update without acquiring lock

-- Test 6: Check expired lock cleanup
SELECT cleanup_expired_locks();
SELECT * FROM match_locks WHERE expires_at < NOW();
-- Expected: No expired locks remain
```

### Manual Testing Steps

1. **Open two browser tabs** with different client IDs
2. **Tab 1:** Lock a match and start scoring
3. **Tab 2:** Try to lock the same match (should show "locked by another user")
4. **Tab 2:** Try to update score directly (should fail silently or show error)
5. **Tab 1:** Release lock
6. **Tab 2:** Try again (should now work)

### Security Audit Checklist

- [ ] Verify only lock holders can update scores
- [ ] Verify expired locks cannot be used
- [ ] Verify locks auto-cleanup after expiration
- [ ] Verify concurrent lock creation fails
- [ ] Verify unauthorized clients get rejection errors
- [ ] Verify public read access works for all users
- [ ] Monitor for unusual lock patterns (abuse detection)

---

## Performance Considerations

### Indexes

All critical columns are indexed for optimal performance:

```sql
-- match_scores indexes
idx_match_scores_match_id     -- Fast lookup by match
idx_match_scores_event_id     -- Fast filtering by event
idx_match_scores_status       -- Fast filtering by status
idx_match_scores_locked_by    -- Fast lookup of client's locks

-- match_locks indexes
idx_match_locks_match_id      -- Fast lock checks
idx_match_locks_expires_at    -- Fast cleanup queries
idx_match_locks_locked_by     -- Fast client lock lookup
```

### Query Optimization

- Use `match_id` for lookups (primary key)
- Filter by `event_id` when loading event scores
- Use `locked_by` to find all client's locks
- Regularly run cleanup to prevent table bloat

---

## Migration from Anonymous to JWT-based Auth

When ready to move from development to production:

1. **Enable Supabase Auth** in your project
2. **Update RLS policies** to use JWT claims
3. **Update client code** to authenticate users
4. **Pass JWT tokens** with all database requests
5. **Test thoroughly** before deploying

Example client code update:

```typescript
// Before (anonymous)
const { data, error } = await supabase
  .from('match_scores')
  .update({ sets: newSets })
  .eq('match_id', matchId);

// After (authenticated)
const { data: { session } } = await supabase.auth.getSession();
if (!session) throw new Error('Not authenticated');

const { data, error } = await supabase
  .from('match_scores')
  .update({ sets: newSets })
  .eq('match_id', matchId);
// JWT automatically included in request headers
```

---

## Troubleshooting

### Issue: Updates fail with "permission denied"

**Cause:** RLS policy blocking the update
**Solution:** Verify the client holds a valid, non-expired lock

```sql
-- Check current lock status
SELECT * FROM match_locks
WHERE match_id = YOUR_MATCH_ID
  AND expires_at > NOW();

-- Check match_scores lock info
SELECT match_id, locked_by, locked_until
FROM match_scores
WHERE match_id = YOUR_MATCH_ID;
```

### Issue: Multiple locks for same match

**Cause:** Race condition or RLS not enforced
**Solution:** Verify RLS is enabled and policies are active

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('match_scores', 'match_locks');

-- Should show rowsecurity = true for both
```

### Issue: Locks not cleaning up

**Cause:** Cleanup function not running
**Solution:** Manually trigger cleanup or set up pg_cron

```sql
-- Manual cleanup
SELECT cleanup_expired_locks();

-- Verify cleanup worked
SELECT COUNT(*) FROM match_locks
WHERE expires_at < NOW();
-- Should be 0
```

---

## Monitoring and Alerts

### Key Metrics to Track

1. **Active Locks Count** - Monitor for abnormal spikes
2. **Expired Locks Count** - Should stay near zero with auto-cleanup
3. **Failed Lock Attempts** - May indicate user confusion or abuse
4. **Lock Duration** - Average time locks are held
5. **Concurrent Lock Conflicts** - How often users compete for same match

### Example Monitoring Queries

```sql
-- Active locks right now
SELECT COUNT(*) as active_locks
FROM match_locks
WHERE expires_at > NOW();

-- Matches currently being scored
SELECT COUNT(*) as matches_in_progress
FROM match_scores
WHERE status = 'in-progress'
  AND locked_by IS NOT NULL;

-- Top lock holders (potential abuse detection)
SELECT locked_by, COUNT(*) as lock_count
FROM match_locks
WHERE expires_at > NOW()
GROUP BY locked_by
ORDER BY lock_count DESC
LIMIT 10;

-- Lock turnover rate (locks per hour)
SELECT DATE_TRUNC('hour', created_at) as hour,
       COUNT(*) as locks_created
FROM match_locks
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Supabase logs for error details
3. Test with manual SQL queries to isolate issue
4. Consult Supabase documentation for RLS specifics
