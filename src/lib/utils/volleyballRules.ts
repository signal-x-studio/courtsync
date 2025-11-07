// Reference: https://www.fivb.com/en/volleyball/theRules
// Purpose: Volleyball scoring rules and validation
// Note: Standard rally scoring - first 4 sets to 25, 5th set to 15, must win by 2

export interface Set {
	team1Score: number;
	team2Score: number;
}

export interface ScoreValidation {
	isValid: boolean;
	message?: string;
}

/**
 * Validate a score update according to volleyball rules
 * - Sets 1-4: First to 25, must win by 2
 * - Set 5: First to 15, must win by 2
 * - No negative scores
 */
export function validateScoreUpdate(
	setNumber: number,
	team: 1 | 2,
	delta: number,
	currentSet: Set
): ScoreValidation {
	const newScore = team === 1 ? currentSet.team1Score + delta : currentSet.team2Score + delta;
	const otherScore = team === 1 ? currentSet.team2Score : currentSet.team1Score;

	// Prevent negative scores
	if (newScore < 0) {
		return {
			isValid: false,
			message: 'Score cannot be negative'
		};
	}

	// Determine set point limit based on set number
	const setPointLimit = setNumber === 4 ? 15 : 25; // 5th set (index 4) is 15, others are 25

	// Allow scores up to the point limit + reasonable overtime (e.g., 50-48 is valid)
	// Don't hard-cap, just warn when going over typical limits
	if (newScore > setPointLimit + 10 || otherScore > setPointLimit + 10) {
		return {
			isValid: true,
			message: `Unusually high score for set ${setNumber + 1}`
		};
	}

	return { isValid: true };
}

/**
 * Check if a set is complete according to volleyball rules
 * - Sets 1-4: First to 25, must win by 2
 * - Set 5: First to 15, must win by 2
 */
export function isSetComplete(setNumber: number, set: Set): boolean {
	const setPointLimit = setNumber === 4 ? 15 : 25;
	const scoreDiff = Math.abs(set.team1Score - set.team2Score);
	const maxScore = Math.max(set.team1Score, set.team2Score);

	// Must reach point limit AND win by 2
	return maxScore >= setPointLimit && scoreDiff >= 2;
}

/**
 * Get the winning team of a set, or null if not complete
 */
export function getSetWinner(setNumber: number, set: Set): 1 | 2 | null {
	if (!isSetComplete(setNumber, set)) return null;
	return set.team1Score > set.team2Score ? 1 : 2;
}

/**
 * Get the match winner (best of 5 sets)
 * Returns the team number (1 or 2) if a team has won 3 sets, otherwise null
 */
export function getMatchWinner(sets: Set[]): 1 | 2 | null {
	let team1Wins = 0;
	let team2Wins = 0;

	sets.forEach((set, index) => {
		const winner = getSetWinner(index, set);
		if (winner === 1) team1Wins++;
		if (winner === 2) team2Wins++;
	});

	if (team1Wins >= 3) return 1;
	if (team2Wins >= 3) return 2;
	return null;
}
