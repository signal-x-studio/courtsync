// Reference: https://supabase.com/docs/reference/javascript/insert
// Reference: https://supabase.com/docs/reference/javascript/update
// Purpose: Database actions for match scoring and locking
// Note: Matches our actual migration schema (locked_at, not locked_until)

import { supabase } from './client';
import type { MatchScore } from '$lib/types/supabase';

/**
 * Lock a match for exclusive scoring by a client
 * Uses locked_at timestamp to track when lock was acquired
 */
export async function lockMatch(
	matchId: number,
	clientId: string,
	eventId: string
): Promise<void> {
	const now = new Date().toISOString();

	const { error } = await supabase.from('match_scores').upsert({
		match_id: matchId,
		event_id: eventId,
		locked_by: clientId,
		locked_at: now,
		sets: []
	});

	if (error) throw error;
}

/**
 * Release a match lock
 * Clears locked_by and locked_at fields
 */
export async function unlockMatch(matchId: number): Promise<void> {
	await supabase
		.from('match_scores')
		.update({ locked_by: null, locked_at: null })
		.eq('match_id', matchId);
}

/**
 * Update score for a specific set and team
 * @param points - Points to add (can be negative to subtract)
 * Note: updated_at is automatically updated by database trigger
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
		.maybeSingle();

	if (!current) return;

	const sets = (current.sets || []) as Array<{
		team1Score: number;
		team2Score: number;
	}>;

	// TypeScript strict mode: safely access array element
	const currentSet = sets[setNumber];
	if (!currentSet) {
		sets[setNumber] = { team1Score: 0, team2Score: 0 };
	}

	// Update the appropriate team's score
	const setToUpdate = sets[setNumber];
	if (!setToUpdate) return; // Extra safety check

	if (team === 1) {
		setToUpdate.team1Score = Math.max(0, setToUpdate.team1Score + points);
	} else {
		setToUpdate.team2Score = Math.max(0, setToUpdate.team2Score + points);
	}

	// Only update sets field - updated_at is handled by trigger
	await supabase
		.from('match_scores')
		.update({ sets })
		.eq('match_id', matchId);
}

/**
 * Get current match score from database
 * Uses maybeSingle() to return null if no score exists yet (avoids 406 error)
 */
export async function getMatchScore(matchId: number): Promise<MatchScore | null> {
	const { data } = await supabase
		.from('match_scores')
		.select('*')
		.eq('match_id', matchId)
		.maybeSingle();

	return data;
}
