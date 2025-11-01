import { get } from 'svelte/store';
import { matchesStore } from '$lib/stores/matches';
import type { Page } from '@sveltejs/kit';

export const ssr = false;

export const load = (async ({ params, url, depends }) => {
	depends('app:matches');
	
	const matchId = parseInt(params.matchId || '0');
	const eventId = url.searchParams.get('eventId') || '';
	const clubId = parseInt(url.searchParams.get('clubId') || '0');

	// Get matches from store (set by main page)
	const matches = get(matchesStore);
	const match = matches.find((m) => m.MatchId === matchId);

	if (!match) {
		// If match not found, return null to show error state
		return {
			matchId,
			eventId,
			clubId,
			match: null,
			matches: []
		};
	}

	return {
		matchId,
		eventId,
		clubId,
		match,
		matches
	};
}) satisfies Page.Load;

