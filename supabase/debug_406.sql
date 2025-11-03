-- Diagnostic queries for 406 error debugging
-- Run these in Supabase SQL Editor to diagnose the issue

-- 1. Check if table exists
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name = 'match_scores';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'match_scores'
ORDER BY ordinal_position;

-- 3. Check if table is in public schema (required for PostgREST)
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename = 'match_scores';

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'match_scores';

-- 5. Check if anon role has access
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'match_scores'
AND grantee = 'anon';

-- 6. Try a simple SELECT (should work if everything is correct)
SELECT * FROM match_scores LIMIT 1;

-- 7. Check PostgREST schema cache
-- If table was created after app started, PostgREST cache might be stale
-- Solution: Send a NOTIFY command to refresh
NOTIFY pgrst, 'reload schema';
