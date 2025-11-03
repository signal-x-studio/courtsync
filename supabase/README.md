# Supabase Setup

This directory contains database migrations and schema setup for CourtSync.

## Quick Setup

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `migrations/001_create_match_scores.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd+Enter)

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (you'll need your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Schema Overview

### `match_scores` Table

Stores real-time match scores with optimistic locking.

**Columns:**
- `id` (UUID) - Primary key
- `match_id` (INTEGER) - Match ID from AES API (unique)
- `event_id` (TEXT) - Event ID for indexing
- `locked_by` (TEXT) - Client ID that has locked the match
- `locked_at` (TIMESTAMPTZ) - When the match was locked
- `sets` (JSONB) - Array of set scores: `[{team1Score: 25, team2Score: 20}, ...]`
- `created_at` (TIMESTAMPTZ) - Record creation time
- `updated_at` (TIMESTAMPTZ) - Last update time (auto-updated)

**Features:**
- ✅ Row Level Security (RLS) enabled
- ✅ Real-time subscriptions enabled
- ✅ Automatic `updated_at` timestamp updates
- ✅ Optimistic locking support
- ✅ Indexes for fast lookups

**Policies:**
- Anyone can read scores (for spectators)
- Anyone can insert/update/delete (for development)
- **Note:** In production, restrict write access to authenticated media users

## Verifying Setup

After running the migration, verify the table was created:

```sql
-- Check if table exists
SELECT * FROM match_scores LIMIT 1;

-- Check real-time is enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'match_scores';
```

## Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting

### 404 Errors on `match_scores`

If you see:
```
GET /rest/v1/match_scores?select=*&match_id=eq.-51057 404 (Not Found)
```

**Solution:** The table doesn't exist. Run the migration SQL in the Supabase dashboard.

### Real-time Not Working

**Check:**
1. Real-time is enabled for your table:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE match_scores;
   ```
2. Your Supabase plan supports real-time (free tier has limits)

### RLS Blocking Access

If authenticated users can't access scores:

```sql
-- Temporarily disable RLS for debugging (NOT for production)
ALTER TABLE match_scores DISABLE ROW LEVEL SECURITY;

-- Then re-enable and check policies
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
SELECT * FROM pg_policies WHERE tablename = 'match_scores';
```

## Development

### Reset Database (Destructive)

```sql
DROP TABLE IF EXISTS match_scores CASCADE;
```

Then re-run the migration.

### Sample Data

Insert a test match score:

```sql
INSERT INTO match_scores (match_id, event_id, sets)
VALUES (
    -51057,
    'PTAwMDAwNDEzMTQ90',
    '[
        {"team1Score": 25, "team2Score": 20},
        {"team1Score": 23, "team2Score": 25},
        {"team1Score": 15, "team2Score": 10}
    ]'::jsonb
);
```

## Production Considerations

Before deploying to production:

1. **Restrict Write Access**
   - Update RLS policies to require authentication
   - Add role-based access control for media users

2. **Add Constraints**
   - Validate set scores (0-50 range)
   - Ensure locked_by matches the updating client

3. **Monitoring**
   - Set up alerts for table size
   - Monitor real-time connection count

4. **Backup**
   - Enable point-in-time recovery
   - Regular automated backups
