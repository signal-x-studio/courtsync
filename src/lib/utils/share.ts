// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
// Purpose: Utility functions for sharing content via Web Share API with clipboard fallback
// Note: Requires HTTPS and user gesture; feature detection required

import type { Match } from '$lib/types/aes';
import { format } from 'date-fns';

/**
 * Check if Web Share API is supported in the current browser
 */
export function canShare(): boolean {
	return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Check if Clipboard API is supported
 */
export function canCopyToClipboard(): boolean {
	return typeof navigator !== 'undefined' && 'clipboard' in navigator;
}

/**
 * Share data using Web Share API or fallback to clipboard
 * @returns 'shared' if Web Share API used, 'copied' if clipboard used, 'error' if failed
 */
export async function share(data: {
	title?: string;
	text: string;
	url?: string;
}): Promise<'shared' | 'copied' | 'error'> {
	try {
		// Try Web Share API first
		if (canShare()) {
			await navigator.share(data);
			return 'shared';
		}

		// Fallback to clipboard
		if (canCopyToClipboard()) {
			const textToShare = [data.title, data.text, data.url].filter(Boolean).join('\n\n');
			await navigator.clipboard.writeText(textToShare);
			return 'copied';
		}

		// No sharing method available
		return 'error';
	} catch (err) {
		// User cancelled share dialog or permission denied
		console.error('Share failed:', err);
		return 'error';
	}
}

/**
 * Format match data for sharing
 */
export function formatMatchShare(match: Match, eventName?: string): { title: string; text: string; url: string } {
	const time = format(match.ScheduledStartDateTime, 'EEEE, MMM d @ h:mm a');
	const courtInfo = match.CourtName ? ` on ${match.CourtName}` : '';

	const title = `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	const text = `🏐 ${title}
${time}${courtInfo}
${match.Division.Name}${eventName ? `\n\n📍 ${eventName}` : ''}`;

	const url = typeof window !== 'undefined'
		? `${window.location.origin}/match/${match.MatchId}`
		: '';

	return { title, text, url };
}

/**
 * Format team schedule for sharing
 */
export function formatTeamShare(
	teamName: string,
	divisionName: string,
	matchCount: number,
	eventName?: string
): { title: string; text: string; url: string } {
	const title = `${teamName} Schedule`;
	const text = `🏐 ${teamName}
${divisionName}
${matchCount} match${matchCount !== 1 ? 'es' : ''} scheduled${eventName ? `\n\n📍 ${eventName}` : ''}`;

	const url = typeof window !== 'undefined' ? window.location.href : '';

	return { title, text, url };
}

/**
 * Format coverage plan for sharing
 */
export function formatCoverageShare(
	matchCount: number,
	conflictCount: number,
	divisionCount: number,
	eventName?: string
): { title: string; text: string; url: string } {
	const title = 'Coverage Plan';
	const text = `📸 Media Coverage Plan
${matchCount} match${matchCount !== 1 ? 'es' : ''} selected
${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}
${divisionCount} division${divisionCount !== 1 ? 's' : ''}${eventName ? `\n\n📍 ${eventName}` : ''}`;

	const url = typeof window !== 'undefined' ? window.location.href : '';

	return { title, text, url };
}
