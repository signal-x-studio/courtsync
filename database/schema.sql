-- CourtSync Database Schema
-- Purpose: Define tables for live scoring and match locking
-- Note: This schema should be applied to a Supabase PostgreSQL database

-- Enable UUID extension for unique client IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: match_scores
-- Purpose: Store live match scores and set data
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_scores (
    id BIGSERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL UNIQUE,
    event_id TEXT NOT NULL,

    -- Lock information
    locked_by TEXT,
    locked_until TIMESTAMPTZ,

    -- Match status
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in-progress, completed

    -- Score data (JSON array of set objects)
    sets JSONB DEFAULT '[]'::JSONB,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_by TEXT,

    -- Indexes for performance
    CONSTRAINT match_id_unique UNIQUE (match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_match_id ON match_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_event_id ON match_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_status ON match_scores(status);
CREATE INDEX IF NOT EXISTS idx_match_scores_locked_by ON match_scores(locked_by);

-- ============================================================================
-- Table: match_locks
-- Purpose: Track active match locks to prevent concurrent editing
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_locks (
    id BIGSERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL UNIQUE,
    locked_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT match_lock_unique UNIQUE (match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_locks_match_id ON match_locks(match_id);
CREATE INDEX IF NOT EXISTS idx_match_locks_expires_at ON match_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_match_locks_locked_by ON match_locks(locked_by);

-- ============================================================================
-- Function: Clean up expired locks automatically
-- Purpose: Remove stale locks that have expired
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
    -- Delete expired locks from match_locks
    DELETE FROM match_locks
    WHERE expires_at < NOW();

    -- Clean up locked_by and locked_until in match_scores for expired locks
    UPDATE match_scores
    SET
        locked_by = NULL,
        locked_until = NULL
    WHERE locked_until IS NOT NULL AND locked_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Scheduled cleanup (requires pg_cron extension)
-- Run every 5 minutes to clean up expired locks
-- ============================================================================
-- Note: Uncomment if pg_cron is available
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks();');

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE match_scores IS 'Stores live match scores and locking state';
COMMENT ON TABLE match_locks IS 'Tracks active locks to prevent concurrent score editing';
COMMENT ON COLUMN match_scores.sets IS 'JSON array of set objects with team1Score, team2Score, setNumber, completedAt';
COMMENT ON COLUMN match_scores.locked_by IS 'Client ID that currently holds the lock';
COMMENT ON COLUMN match_scores.locked_until IS 'Timestamp when the lock expires';
COMMENT ON COLUMN match_locks.expires_at IS 'Lock expiration timestamp (15 minutes from creation)';
