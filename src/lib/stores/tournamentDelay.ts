import { writable } from 'svelte/store';

// Tournament delay offset in minutes (0-120, in 15min increments)
// Used to handle schedules running behind schedule
export const tournamentDelay = writable<number>(0);

// Get delay offset from localStorage on init
if (typeof window !== 'undefined') {
	const saved = localStorage.getItem('tournamentDelay');
	if (saved !== null) {
		const delay = parseInt(saved, 10);
		if (!isNaN(delay) && delay >= 0 && delay <= 120) {
			tournamentDelay.set(delay);
		}
	}
	
	// Persist to localStorage when changed
	tournamentDelay.subscribe(value => {
		localStorage.setItem('tournamentDelay', value.toString());
	});
}

