// Reference: docs/product-requirements.md (ID-based filtering strategy)
// Purpose: Core utility functions for filtering, grouping, and analyzing matches
// Note: Prefers ID-based matching with text fallback for AES API compatibility

import type { Match, MatchFilter, TimeBlock } from '$lib/types';

/**
 * Determines if a match belongs to a club based on team IDs or names
 * Prioritizes ID matching for accuracy, falls back to text matching
 */
export function matchBelongsToClub(match: Match, filter: MatchFilter): boolean {
	// Prefer ID-based matching
	const matchTeamIds = [
		match.FirstTeamId,
		match.SecondTeamId,
		match.WorkTeamId
	].filter((id): id is number => id !== undefined && id !== null);

	if (matchTeamIds.length > 0) {
		return matchTeamIds.some((id) => filter.clubTeamIds.includes(id));
	}

	// Fallback to text matching when IDs unavailable
	const matchTeamTexts = [
		match.FirstTeamText,
		match.SecondTeamText,
		match.WorkTeamText
	].filter((text): text is string => Boolean(text));

	return matchTeamTexts.some((text) =>
		filter.clubTeamNames.some((name) => text.includes(name))
	);
}

/**
 * Groups matches by their scheduled start time
 * Returns sorted time blocks with formatted time strings
 */
export function groupMatchesByTime(matches: Match[]): TimeBlock[] {
	const grouped = new Map<number, Match[]>();

	matches.forEach((match) => {
		const time = match.ScheduledStartDateTime;
		if (!grouped.has(time)) {
			grouped.set(time, []);
		}
		grouped.get(time)!.push(match);
	});

	return Array.from(grouped.entries())
		.sort(([a], [b]) => a - b)
		.map(([timestamp, matches]) => ({
			time: new Date(timestamp).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit'
			}),
			timestamp,
			matches
		}));
}

/**
 * Detects time conflicts in coverage plan (overlapping matches)
 * Returns set of MatchIds that have time conflicts
 */
export function detectConflicts(matches: Match[]): Set<number> {
	const conflicts = new Set<number>();

	for (let i = 0; i < matches.length; i++) {
		for (let j = i + 1; j < matches.length; j++) {
			const m1 = matches[i];
			const m2 = matches[j];

			// TypeScript strict mode requires undefined checks for array access
			if (!m1 || !m2) continue;

			// Check if time ranges overlap
			if (
				m1.ScheduledStartDateTime < m2.ScheduledEndDateTime &&
				m2.ScheduledStartDateTime < m1.ScheduledEndDateTime
			) {
				conflicts.add(m1.MatchId);
				conflicts.add(m2.MatchId);
			}
		}
	}

	return conflicts;
}

/**
 * Determines match status based on time and outcome
 * Reference: https://date-fns.org/ for future date comparisons
 */
export function getMatchStatus(match: Match): 'upcoming' | 'live' | 'completed' {
	const now = Date.now();

	if (match.HasOutcome) return 'completed';

	if (match.ScheduledStartDateTime <= now && match.ScheduledEndDateTime >= now) {
		return 'live';
	}

	return 'upcoming';
}
