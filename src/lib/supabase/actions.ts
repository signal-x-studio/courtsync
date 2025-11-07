// Reference: https://supabase.com/docs/reference/javascript/insert
// Reference: https://supabase.com/docs/reference/javascript/update
// Purpose: Database actions for match scoring and locking
// Note: Matches our actual migration schema (locked_at, not locked_until)

import { supabase } from './client';
import type { MatchScore } from '$lib/types/supabase';
import { validateScoreUpdate } from '$lib/utils/volleyballRules';

/**
 * Lock a match for exclusive scoring by a client
 * Uses locked_at timestamp to track when lock was acquired
 * Prevents race conditions by checking if match is already locked
 */
export async function lockMatch(
	matchId: number,
	clientId: string,
	eventId: string
): Promise<void> {
	const now = new Date().toISOString();

	// First, check if match score exists and if it's locked
	const { data: existing } = await supabase
		.from('match_scores')
		.select('locked_by')
		.eq('match_id', matchId)
		.maybeSingle();

	if (existing) {
		// Match score exists
		if (existing.locked_by !== null && existing.locked_by !== clientId) {
			throw new Error('Match is already locked by another user');
		}

		// Update to lock (only if not locked or locked by this client)
		const { error } = await supabase
			.from('match_scores')
			.update({
				locked_by: clientId,
				locked_at: now
			})
			.eq('match_id', matchId)
			.or(`locked_by.is.null,locked_by.eq.${clientId}`);

		if (error) throw error;
	} else {
		// Match score doesn't exist, create it
		const { error } = await supabase.from('match_scores').insert({
			match_id: matchId,
			event_id: eventId,
			locked_by: clientId,
			locked_at: now,
			sets: []
		});

		if (error) throw error;
	}
}

/**
 * Release a match lock
 * Clears locked_by and locked_at fields
 * @param clientId - Optional client ID to validate lock ownership
 */
export async function unlockMatch(matchId: number, clientId?: string): Promise<void> {
	const query = supabase
		.from('match_scores')
		.update({ locked_by: null, locked_at: null })
		.eq('match_id', matchId);

	// If clientId provided, only unlock if this client owns the lock
	if (clientId) {
		query.eq('locked_by', clientId);
	}

	const { error } = await query;

	if (error) throw error;
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
		.select('sets, locked_by')
		.eq('match_id', matchId)
		.maybeSingle();

	if (!current) return;

	// Validate client has the lock
	if (current.locked_by !== clientId) {
		throw new Error('You do not have the lock for this match');
	}

	const sets = (current.sets || []) as Array<{
		team1Score: number;
		team2Score: number;
	}>;

	// Ensure array has enough elements (avoid sparse arrays)
	while (sets.length <= setNumber) {
		sets.push({ team1Score: 0, team2Score: 0 });
	}

	// Update the appropriate team's score
	const setToUpdate = sets[setNumber];
	if (!setToUpdate) return; // Extra safety check

	// Validate score update according to volleyball rules
	const validation = validateScoreUpdate(setNumber, team, points, setToUpdate);
	if (!validation.isValid) {
		throw new Error(validation.message || 'Invalid score update');
	}

	if (team === 1) {
		setToUpdate.team1Score = Math.max(0, setToUpdate.team1Score + points);
	} else {
		setToUpdate.team2Score = Math.max(0, setToUpdate.team2Score + points);
	}

	// Log warning if present (but don't block the update)
	if (validation.message) {
		console.warn('Score validation warning:', validation.message);
	}

	// Update with lock validation to prevent race conditions
	const { error } = await supabase
		.from('match_scores')
		.update({ sets })
		.eq('match_id', matchId)
		.eq('locked_by', clientId); // Only update if client still has lock

	if (error) throw error;
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
