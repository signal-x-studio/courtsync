// Reference: https://svelte.dev/docs/svelte/svelte-store
// Reference: https://supabase.com/docs/guides/realtime/postgres-changes
// Purpose: Real-time score updates via Supabase subscriptions
// Note: Factory function creates store per match, auto-subscribes/unsubscribes

import { readable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';
import type { MatchScore } from '$lib/types/supabase';

export function liveScore(matchId: number) {
	return readable<MatchScore | null>(null, (set) => {
		// Fetch initial score
		const fetchInitial = async () => {
			try {
				const { data } = await supabase
					.from('match_scores')
					.select('*')
					.eq('match_id', matchId)
					.single();
				set(data);
			} catch {
				set(null);
			}
		};

		fetchInitial();

		// Subscribe to real-time updates
		const channel = supabase
			.channel(`match:${matchId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'match_scores',
					filter: `match_id=eq.${matchId}`
				},
				(payload) => set(payload.new as MatchScore)
			)
			.subscribe();

		// Cleanup on unsubscribe
		return () => {
			supabase.removeChannel(channel);
		};
	});
}
