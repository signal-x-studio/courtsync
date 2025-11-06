-- CourtSync Row Level Security (RLS) Policies
-- Purpose: Implement production-grade security for match scoring
-- Note: Apply these policies after creating the schema

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_locks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- match_scores Policies
-- ============================================================================

-- Policy: Allow anyone to read match scores (public data)
CREATE POLICY "match_scores_select_all"
ON match_scores
FOR SELECT
USING (true);

-- Policy: Allow INSERT only if no lock exists or lock is expired
-- This prevents creating duplicate match_scores for the same match
CREATE POLICY "match_scores_insert_if_unlocked"
ON match_scores
FOR INSERT
WITH CHECK (
    -- Check that either:
    -- 1. No lock exists for this match, OR
    -- 2. Lock exists but is expired
    NOT EXISTS (
        SELECT 1
        FROM match_locks ml
        WHERE ml.match_id = match_scores.match_id
          AND ml.expires_at > NOW()
          AND ml.locked_by != match_scores.locked_by
    )
);

-- Policy: Allow UPDATE only if client holds valid lock
-- This is the CRITICAL security policy
CREATE POLICY "match_scores_update_lock_holder"
ON match_scores
FOR UPDATE
USING (
    -- Current lock holder check
    locked_by IS NOT NULL
    AND locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
    -- Ensure lock hasn't expired
    AND locked_until IS NOT NULL
    AND locked_until > NOW()
)
WITH CHECK (
    -- Ensure updated row still maintains lock ownership
    locked_by IS NOT NULL
    AND locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
    AND locked_until IS NOT NULL
    AND locked_until > NOW()
);

-- Policy: Allow DELETE only by lock holder or for expired locks
CREATE POLICY "match_scores_delete_lock_holder"
ON match_scores
FOR DELETE
USING (
    -- Either current lock holder OR lock is expired
    (
        locked_by IS NOT NULL
        AND locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR
    (
        locked_until IS NOT NULL
        AND locked_until < NOW()
    )
);

-- ============================================================================
-- match_locks Policies
-- ============================================================================

-- Policy: Allow anyone to read locks (so they can see who has the lock)
CREATE POLICY "match_locks_select_all"
ON match_locks
FOR SELECT
USING (true);

-- Policy: Allow INSERT only if no active lock exists for this match
CREATE POLICY "match_locks_insert_if_available"
ON match_locks
FOR INSERT
WITH CHECK (
    -- Ensure no other active lock exists for this match
    NOT EXISTS (
        SELECT 1
        FROM match_locks ml
        WHERE ml.match_id = match_locks.match_id
          AND ml.expires_at > NOW()
    )
);

-- Policy: Allow UPDATE only by current lock holder
CREATE POLICY "match_locks_update_holder"
ON match_locks
FOR UPDATE
USING (
    locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
    AND expires_at > NOW()
)
WITH CHECK (
    locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
    AND expires_at > NOW()
);

-- Policy: Allow DELETE only by lock holder or if expired
CREATE POLICY "match_locks_delete_holder_or_expired"
ON match_locks
FOR DELETE
USING (
    -- Either current lock holder OR lock is expired
    locked_by = current_setting('request.jwt.claims', true)::json->>'sub'
    OR expires_at < NOW()
);

-- ============================================================================
-- Anonymous Access Policies (for non-authenticated users)
-- Note: The above policies use JWT claims which require authentication.
-- For anonymous access (current implementation), we need alternative policies.
-- ============================================================================

-- Drop the JWT-based policies if using anonymous access
-- Uncomment the section below for anonymous access implementation:

/*
-- Drop JWT-based policies
DROP POLICY IF EXISTS "match_scores_update_lock_holder" ON match_scores;
DROP POLICY IF EXISTS "match_scores_delete_lock_holder" ON match_scores;
DROP POLICY IF EXISTS "match_locks_update_holder" ON match_locks;
DROP POLICY IF EXISTS "match_locks_delete_holder_or_expired" ON match_locks;

-- Anonymous-friendly policies (less secure, use only for development/testing)
-- These rely on client-side generated UUIDs for lock ownership

-- Policy: Allow UPDATE if locked_by matches the client ID header
CREATE POLICY "match_scores_update_by_client_id"
ON match_scores
FOR UPDATE
USING (
    locked_by IS NOT NULL
    AND locked_until IS NOT NULL
    AND locked_until > NOW()
    -- In production, validate locked_by matches a session variable or header
);

-- Policy: Allow DELETE if locked_by matches or lock expired
CREATE POLICY "match_scores_delete_by_client_id"
ON match_scores
FOR DELETE
USING (
    (locked_by IS NOT NULL)
    OR
    (locked_until IS NOT NULL AND locked_until < NOW())
);

-- Policy: Allow UPDATE of locks by lock holder
CREATE POLICY "match_locks_update_by_client_id"
ON match_locks
FOR UPDATE
USING (
    expires_at > NOW()
);

-- Policy: Allow DELETE of locks by anyone (risky - only for development)
CREATE POLICY "match_locks_delete_by_client_id"
ON match_locks
FOR DELETE
USING (true);
*/

-- ============================================================================
-- Security Notes
-- ============================================================================
-- 1. JWT-based policies (default above) require Supabase Auth
-- 2. Anonymous policies (commented out) are less secure but work without auth
-- 3. For production, always use JWT-based policies with proper authentication
-- 4. The cleanup_expired_locks() function should run periodically
-- 5. Consider adding rate limiting for lock creation to prevent abuse
-- 6. Monitor for unusual patterns (same client holding many locks)

-- ============================================================================
-- Testing Security
-- ============================================================================
-- To test these policies:
-- 1. Try to update a score without holding the lock (should fail)
-- 2. Try to delete another client's lock (should fail)
-- 3. Try to update a score with an expired lock (should fail)
-- 4. Try to create a lock when one already exists (should fail)

-- Example test queries (run as different clients):
/*
-- Client A locks a match
INSERT INTO match_locks (match_id, locked_by, expires_at)
VALUES (12345, 'client-a-uuid', NOW() + INTERVAL '15 minutes');

-- Client B tries to update the score (should fail with RLS violation)
UPDATE match_scores
SET sets = '[]'::jsonb
WHERE match_id = 12345;

-- Client A successfully updates (assuming Client A's JWT/session is set)
UPDATE match_scores
SET sets = '[{"setNumber": 1, "team1Score": 5, "team2Score": 3}]'::jsonb
WHERE match_id = 12345
AND locked_by = 'client-a-uuid';
*/
