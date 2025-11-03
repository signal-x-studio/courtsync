// Reference: https://supabase.com/docs/reference/javascript/introduction
// Purpose: Type definitions for Supabase database tables
// Note: Matches actual migration schema (supabase/migrations/001_create_match_scores.sql)

export interface MatchScore {
	id: string; // UUID
	match_id: number;
	event_id: string;
	locked_by: string | null;
	locked_at: string | null; // ISO timestamp when lock was acquired
	sets: SetScore[]; // JSONB array
	created_at: string;
	updated_at: string; // Auto-updated by trigger
}

export interface SetScore {
	team1Score: number;
	team2Score: number;
}
