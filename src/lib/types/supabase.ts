// Reference: https://supabase.com/docs/reference/javascript/introduction
// Purpose: Type definitions for Supabase database tables (match scores, locks)
// Note: These types correspond to the database schema in Phase 8

export interface MatchScore {
	match_id: number;
	event_id: string;
	sets: SetScore[];
	status: 'not-started' | 'in-progress' | 'completed';
	locked_by: string | null;
	locked_until: string | null;
	last_updated: string;
	last_updated_by: string | null;
}

export interface SetScore {
	setNumber: number;
	team1Score: number;
	team2Score: number;
	completedAt?: string;
}

export interface MatchLock {
	match_id: number;
	locked_by: string;
	locked_at: string;
	expires_at: string;
}
