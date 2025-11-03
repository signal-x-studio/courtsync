// Reference: https://supabase.com/docs/reference/javascript/insert
// Reference: https://supabase.com/docs/reference/javascript/update
// Purpose: Database actions for match scoring and locking
// Note: Lock expires after 15 minutes to prevent abandoned locks

import { supabase } from './client';
import type { MatchScore } from '$lib/types/supabase';

/**
 * Lock a match for exclusive scoring by a client
 * Creates a 15-minute lock to prevent concurrent scorekeepers
 */
export async function lockMatch(
	matchId: number,
	clientId: string,
	eventId: string
): Promise<void> {
	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + 15);

	const { error: lockError } = await supabase.from('match_locks').insert({
		match_id: matchId,
		locked_by: clientId,
		expires_at: expiresAt.toISOString()
	});

	if (lockError) throw lockError;

	await supabase.from('match_scores').upsert({
		match_id: matchId,
		event_id: eventId,
		locked_by: clientId,
		locked_until: expiresAt.toISOString(),
		status: 'in-progress',
		sets: []
	});
}

/**
 * Release a match lock
 * Removes lock from both match_locks and match_scores tables
 */
export async function unlockMatch(matchId: number): Promise<void> {
	await supabase.from('match_locks').delete().eq('match_id', matchId);
	await supabase
		.from('match_scores')
		.update({ locked_by: null, locked_until: null })
		.eq('match_id', matchId);
}

/**
 * Update score for a specific set and team
 * @param points - Points to add (can be negative to subtract)
 */
export async function updateScore(
	matchId: number,
	setNumber: number,
	team: 1 | 2,
	points: number,
	clientId: string
): Promise<void> {
	const { data: current } = await supabase
		.from('match_scores')
		.select('sets')
		.eq('match_id', matchId)
		.single();

	if (!current) return;

	const sets = (current.sets || []) as Array<{
		setNumber: number;
		team1Score: number;
		team2Score: number;
		completedAt?: string;
	}>;

	// TypeScript strict mode: safely access array element
	const currentSet = sets[setNumber];
	if (!currentSet) {
		sets[setNumber] = { setNumber, team1Score: 0, team2Score: 0 };
	}

	// Update the appropriate team's score
	const setToUpdate = sets[setNumber];
	if (!setToUpdate) return; // Extra safety check

	if (team === 1) {
		setToUpdate.team1Score = Math.max(0, setToUpdate.team1Score + points);
	} else {
		setToUpdate.team2Score = Math.max(0, setToUpdate.team2Score + points);
	}

	await supabase
		.from('match_scores')
		.update({
			sets,
			last_updated: new Date().toISOString(),
			last_updated_by: clientId
		})
		.eq('match_id', matchId);
}

/**
 * Get current match score from database
 */
export async function getMatchScore(matchId: number): Promise<MatchScore | null> {
	const { data } = await supabase
		.from('match_scores')
		.select('*')
		.eq('match_id', matchId)
		.single();

	return data;
}
