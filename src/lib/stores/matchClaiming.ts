import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { onMount, onDestroy } from 'svelte';
import type { MatchClaim, MatchScore, SetScore } from '$lib/types';
import { broadcastScoreUpdate } from '$lib/utils/scoreSync';
import { addScoreHistory } from '$lib/utils/scoreStats';
import { addClaimHistory } from '$lib/utils/claimHistory';

const STORAGE_KEY_CLAIMS = 'matchClaims';
const STORAGE_KEY_SCORES = 'matchScores';
const CLAIM_EXPIRATION_BUFFER_MS = 30 * 60 * 1000; // 30 minutes after match ends

interface MatchClaimingOptions {
	eventId: string;
	userId?: string;
}

export function createMatchClaiming({ eventId, userId = 'anonymous' }: MatchClaimingOptions) {
	const { subscribe: subscribeClaims, set: setClaims, update: updateClaims } = writable<
		Map<number, MatchClaim>
	>(new Map());
	const { subscribe: subscribeScores, set: setScores, update: updateScores } = writable<
		Map<number, MatchScore>
	>(new Map());

	// Load from localStorage
	if (browser) {
		try {
			const claimsData = localStorage.getItem(STORAGE_KEY_CLAIMS);
			if (claimsData) {
				const parsed = JSON.parse(claimsData) as Record<string, MatchClaim>;
				const claimsMap = new Map<number, MatchClaim>();
				Object.values(parsed).forEach((claim) => {
					if (claim.eventId === eventId && claim.expiresAt > Date.now()) {
						claimsMap.set(claim.matchId, claim);
					}
				});
				setClaims(claimsMap);
			}
		} catch (error) {
			console.error('Failed to load claims:', error);
		}

		try {
			const scoresData = localStorage.getItem(STORAGE_KEY_SCORES);
			if (scoresData) {
				const parsed = JSON.parse(scoresData) as Record<string, MatchScore>;
				const scoresMap = new Map<number, MatchScore>();
				Object.values(parsed).forEach((score) => {
					if (score.eventId === eventId) {
						scoresMap.set(score.matchId, score);
					}
				});
				setScores(scoresMap);
			}
		} catch (error) {
			console.error('Failed to load scores:', error);
		}
	}

	const saveClaims = (claims: Map<number, MatchClaim>) => {
		if (!browser) return;
		try {
			const claimsObj: Record<string, MatchClaim> = {};
			claims.forEach((claim) => {
				claimsObj[claim.matchId.toString()] = claim;
			});
			localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claimsObj));
		} catch (error) {
			console.error('Failed to save claims:', error);
		}
	};

	const saveScores = (scores: Map<number, MatchScore>) => {
		if (!browser) return;
		try {
			const scoresObj: Record<string, MatchScore> = {};
			scores.forEach((score) => {
				scoresObj[score.matchId.toString()] = score;
			});
			localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scoresObj));
		} catch (error) {
			console.error('Failed to save scores:', error);
		}
	};

	// Polling for cross-tab sync (set up in component using onMount)
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	const startPolling = () => {
		if (!browser || pollInterval) return;
		pollInterval = setInterval(() => {
			try {
				const scoresData = localStorage.getItem(STORAGE_KEY_SCORES);
				if (!scoresData) return;

				const parsed = JSON.parse(scoresData) as Record<string, MatchScore>;
				const currentScores = new Map<number, MatchScore>();
				let hasChanges = false;

				subscribeScores((scores) => {
					Object.values(parsed).forEach((score) => {
						if (score.eventId === eventId) {
							currentScores.set(score.matchId, score);
							const existingScore = scores.get(score.matchId);
							if (
								!existingScore ||
								(score.lastUpdated && score.lastUpdated > existingScore.lastUpdated)
							) {
								hasChanges = true;
							}
						}
					});

					if (hasChanges) {
						updateScores((prev) => {
							const next = new Map(prev);
							currentScores.forEach((score, matchId) => {
								const existing = prev.get(matchId);
								if (
									!existing ||
									(score.lastUpdated && score.lastUpdated > existing.lastUpdated)
								) {
									next.set(matchId, score);
								}
							});
							return next;
						});
					}
				})();
			} catch (error) {
				console.error('Failed to poll scores:', error);
			}
		}, 3000);
	};

	const stopPolling = () => {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	};

	return {
		claims: { subscribe: subscribeClaims },
		scores: { subscribe: subscribeScores },
		claimMatch: (matchId: number, matchEndTime: number) => {
			const now = Date.now();
			const expiresAt = matchEndTime + CLAIM_EXPIRATION_BUFFER_MS;

			const claim: MatchClaim = {
				matchId,
				claimedBy: userId,
				claimedAt: now,
				expiresAt,
				eventId
			};

			updateClaims((claims) => {
				const next = new Map(claims);
				next.set(matchId, claim);
				saveClaims(next);
				return next;
			});

			addClaimHistory({
				matchId,
				eventId,
				action: 'claimed',
				userId,
				timestamp: now
			});
		},
		releaseClaim: (matchId: number) => {
			updateClaims((claims) => {
				const claim = claims.get(matchId);
				const next = new Map(claims);
				next.delete(matchId);
				saveClaims(next);

				if (claim && browser) {
					addClaimHistory({
						matchId,
						eventId,
						action: 'released',
						userId: claim.claimedBy,
						timestamp: Date.now()
					});
				}

				return next;
			});
		},
		transferClaim: (matchId: number, newUserId: string) => {
			let canTransfer = false;
			subscribeClaims((claims) => {
				const claim = claims.get(matchId);
				canTransfer = claim?.claimedBy === userId && claim.expiresAt > Date.now();
			})();

			if (!canTransfer) return false;

			const now = Date.now();
			updateClaims((claims) => {
				const claim = claims.get(matchId);
				if (!claim) return claims;

				const transferredClaim: MatchClaim = {
					...claim,
					claimedBy: newUserId,
					claimedAt: now
				};

				const next = new Map(claims);
				next.set(matchId, transferredClaim);
				saveClaims(next);

				if (browser) {
					addClaimHistory({
						matchId,
						eventId,
						action: 'transferred',
						userId,
						timestamp: now,
						transferredTo: newUserId
					});
				}

				return next;
			});

			return true;
		},
		isClaimed: (matchId: number): boolean => {
			let claimed = false;
			subscribeClaims((claims) => {
				const claim = claims.get(matchId);
				claimed = claim ? claim.expiresAt > Date.now() : false;
			})();
			return claimed;
		},
		getClaimStatus: (matchId: number): 'available' | 'claimed' | 'locked' => {
			let status: 'available' | 'claimed' | 'locked' = 'available';
			subscribeClaims((claims) => {
				const claim = claims.get(matchId);
				if (!claim || claim.expiresAt < Date.now()) {
					status = 'available';
				} else if (claim.claimedBy === userId) {
					status = 'claimed';
				} else {
					status = 'locked';
				}
			})();
			return status;
		},
		getClaimer: (matchId: number): string | null => {
			let claimer: string | null = null;
			subscribeClaims((claims) => {
				const claim = claims.get(matchId);
				claimer = claim && claim.expiresAt > Date.now() ? claim.claimedBy : null;
			})();
			return claimer;
		},
		isClaimOwner: (matchId: number): boolean => {
			let isOwner = false;
			subscribeClaims((claims) => {
				const claim = claims.get(matchId);
				isOwner = claim?.claimedBy === userId && claim.expiresAt > Date.now();
			})();
			return isOwner;
		},
		updateScore: (matchId: number, sets: SetScore[], status: 'not-started' | 'in-progress' | 'completed', source: 'ballertv' | 'manual' = 'manual') => {
			const score: MatchScore = {
				matchId,
				eventId,
				sets,
				status,
				lastUpdated: Date.now(),
				lastUpdatedBy: userId,
				source
			};

			updateScores((scores) => {
				const next = new Map(scores);
				const existingScore = scores.get(matchId);
				
				// If updating from BallerTV and manual score exists, preserve manual score if it's more recent
				// Otherwise, update with new score
				if (source === 'ballertv' && existingScore && existingScore.source === 'manual') {
					// Only update if BallerTV score is newer or if manual score is older than 5 minutes
					const manualScoreAge = Date.now() - existingScore.lastUpdated;
					if (manualScoreAge < 5 * 60 * 1000) {
						// Keep manual score if it's recent
						return scores;
					}
				}
				
				next.set(matchId, score);
				saveScores(next);
				return next;
			});

			if (browser) {
				broadcastScoreUpdate(eventId, matchId, score);
				// Only add to history if manual update (BallerTV updates are automatic)
				if (source === 'manual') {
					addScoreHistory(matchId, score, userId);
				}
			}
		},
		getScore: (matchId: number): MatchScore | null => {
			let score: MatchScore | null = null;
			subscribeScores((scores) => {
				score = scores.get(matchId) || null;
			})();
			return score;
		},
		clearEventData: () => {
			updateClaims((claims) => {
				const next = new Map(claims);
				next.forEach((claim, matchId) => {
					if (claim.eventId === eventId) {
						next.delete(matchId);
					}
				});
				saveClaims(next);
				return next;
			});

			updateScores((scores) => {
				const next = new Map(scores);
				next.forEach((score, matchId) => {
					if (score.eventId === eventId) {
						next.delete(matchId);
					}
				});
				saveScores(next);
				return next;
			});
		},
		startPolling,
		stopPolling
	};
}

