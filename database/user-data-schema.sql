-- CourtSync User Data Schema
-- Purpose: Tables for syncing user data across devices
-- Note: These tables sync favorites and coverage plans for authenticated users

-- ============================================================================
-- Table: user_favorites
-- Purpose: Store favorite teams for authenticated users
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL,
    team_name TEXT,
    event_id TEXT,
    division_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one favorite per team per user
    CONSTRAINT user_favorites_unique UNIQUE (user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_team_id ON user_favorites(team_id);

-- ============================================================================
-- Table: user_coverage
-- Purpose: Store coverage plan matches for authenticated users
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_coverage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL,
    event_id TEXT,
    court_name TEXT,
    match_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one coverage entry per match per user
    CONSTRAINT user_coverage_unique UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coverage_user_id ON user_coverage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coverage_match_id ON user_coverage(match_id);

-- ============================================================================
-- RLS Policies for user_favorites
-- ============================================================================
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can read their own favorites
CREATE POLICY "user_favorites_select_own"
ON user_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "user_favorites_insert_own"
ON user_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "user_favorites_update_own"
ON user_favorites
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "user_favorites_delete_own"
ON user_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for user_coverage
-- ============================================================================
ALTER TABLE user_coverage ENABLE ROW LEVEL SECURITY;

-- Users can read their own coverage
CREATE POLICY "user_coverage_select_own"
ON user_coverage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own coverage
CREATE POLICY "user_coverage_insert_own"
ON user_coverage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own coverage
CREATE POLICY "user_coverage_update_own"
ON user_coverage
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own coverage
CREATE POLICY "user_coverage_delete_own"
ON user_coverage
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Function: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER user_favorites_updated_at
    BEFORE UPDATE ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_coverage_updated_at
    BEFORE UPDATE ON user_coverage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE user_favorites IS 'User favorite teams for cross-device sync';
COMMENT ON TABLE user_coverage IS 'User coverage plan matches for cross-device sync';
COMMENT ON COLUMN user_favorites.user_id IS 'References auth.users(id) - the authenticated user';
COMMENT ON COLUMN user_coverage.user_id IS 'References auth.users(id) - the authenticated user';
