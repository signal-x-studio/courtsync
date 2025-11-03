// Reference: https://supabase.com/docs/reference/javascript/introduction
// Purpose: Initialize Supabase client for database and real-time features
// Note: Uses public environment variables (safe for client-side)

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
