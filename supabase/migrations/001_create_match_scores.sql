-- Create match_scores table for live scoring
-- Reference: docs/product-requirements.md (Live Match Scoring)
-- Purpose: Store real-time match scores with optimistic locking

CREATE TABLE IF NOT EXISTS match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id INTEGER NOT NULL UNIQUE,
    event_id TEXT NOT NULL,
    locked_by TEXT,
    locked_at TIMESTAMPTZ,
    sets JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Indexes
    CONSTRAINT match_scores_match_id_unique UNIQUE (match_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS match_scores_match_id_idx ON match_scores(match_id);
CREATE INDEX IF NOT EXISTS match_scores_event_id_idx ON match_scores(event_id);
CREATE INDEX IF NOT EXISTS match_scores_locked_by_idx ON match_scores(locked_by);

-- Enable Row Level Security
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read scores
CREATE POLICY "Anyone can read match scores"
    ON match_scores
    FOR SELECT
    USING (true);

-- Policy: Anyone can insert new match scores
CREATE POLICY "Anyone can insert match scores"
    ON match_scores
    FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can update match scores
-- Note: In production, you may want to restrict this to authenticated users
CREATE POLICY "Anyone can update match scores"
    ON match_scores
    FOR UPDATE
    USING (true);

-- Policy: Anyone can delete match scores
-- Note: In production, you may want to restrict this to authenticated users
CREATE POLICY "Anyone can delete match scores"
    ON match_scores
    FOR DELETE
    USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER match_scores_updated_at
    BEFORE UPDATE ON match_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_match_scores_updated_at();

-- Enable real-time for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE match_scores;

-- Sample data structure for sets field:
-- [
--   { "team1Score": 25, "team2Score": 20 },
--   { "team1Score": 23, "team2Score": 25 },
--   { "team1Score": 15, "team2Score": 10 }
-- ]
