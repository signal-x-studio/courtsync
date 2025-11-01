import { writable, get } from 'svelte/store';

// Map: teamId_date -> { delay: number, source: 'manual' | 'auto' }
// Example: "630 Volleyball 13-1 (GL)_2025-11-01" -> { delay: 30, source: 'auto' }
export interface TeamDelayEntry {
	delay: number;
	source: 'manual' | 'auto'; // 'manual' = user-set, 'auto' = detected from BallerTV
}

export const teamDelays = writable<Map<string, TeamDelayEntry>>(new Map());

// Initialize from localStorage
if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('teamDelays');
		if (saved) {
			try {
				const data = JSON.parse(saved);
				const delayMap = new Map<string, TeamDelayEntry>();
				Object.entries(data).forEach(([key, value]) => {
					// Handle legacy format (just a number) or new format (object with delay and source)
					if (typeof value === 'number') {
						delayMap.set(key, { delay: value, source: 'manual' }); // Legacy delays are assumed manual
					} else if (typeof value === 'object' && value !== null && 'delay' in value) {
						delayMap.set(key, value as TeamDelayEntry);
					}
				});
				teamDelays.set(delayMap);
			} catch (e) {
				console.warn('Failed to load team delays:', e);
			}
		}
		
		// Persist to localStorage when changed
		teamDelays.subscribe(value => {
			const data: Record<string, TeamDelayEntry> = {};
			value.forEach((entry, key) => {
				data[key] = entry;
			});
			localStorage.setItem('teamDelays', JSON.stringify(data));
		});
	
	// Clean up old entries (older than 7 days) periodically
	setInterval(() => {
		const current = get(teamDelays);
		const today = new Date();
		const sevenDaysAgo = new Date(today);
		sevenDaysAgo.setDate(today.getDate() - 7);
		
		const updated = new Map(current);
		let changed = false;
		
		updated.forEach((entry, key) => {
			const parts = key.split('_');
			if (parts.length >= 2) {
				const dateStr = parts[parts.length - 1]; // Get date from key
				try {
					const entryDate = new Date(dateStr);
					if (entryDate < sevenDaysAgo) {
						updated.delete(key);
						changed = true;
					}
				} catch (e) {
					// Invalid date format, remove it
					updated.delete(key);
					changed = true;
				}
			}
		});
		
		if (changed) {
			teamDelays.set(updated);
		}
	}, 24 * 60 * 60 * 1000); // Check once per day
}

// Generate key: teamId_date
function getTeamDelayKey(teamId: string, matchStartTime: number): string {
	const date = new Date(matchStartTime);
	const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
	return `${teamId}_${dateStr}`;
}

// Get delay for a team/match (returns null if no team-specific delay)
export function getTeamDelay(teamId: string, matchStartTime: number): number | null {
	const current = get(teamDelays);
	const key = getTeamDelayKey(teamId, matchStartTime);
	const entry = current.get(key);
	return entry !== undefined ? entry.delay : null;
}

// Get delay entry (with source) for a team/match
export function getTeamDelayEntry(teamId: string, matchStartTime: number): TeamDelayEntry | null {
	const current = get(teamDelays);
	const key = getTeamDelayKey(teamId, matchStartTime);
	const entry = current.get(key);
	return entry !== undefined ? entry : null;
}

// Set delay for a team/date (manual by default)
export function setTeamDelay(teamId: string, matchStartTime: number, delay: number, source: 'manual' | 'auto' = 'manual'): void {
	const key = getTeamDelayKey(teamId, matchStartTime);
	teamDelays.update(map => {
		const updated = new Map(map);
		const existing = updated.get(key);
		
		// If there's a manual delay, don't override it with auto-detected delay
		if (existing && existing.source === 'manual' && source === 'auto') {
			console.log(`⚠️ Team delay: Keeping manual delay ${existing.delay}min for ${teamId}, ignoring auto-detected ${delay}min`);
			return updated; // Don't override manual delay
		}
		
		updated.set(key, { delay, source });
		return updated;
	});
}

// Set auto-detected delay (will not override manual delays)
export function setAutoTeamDelay(teamId: string, matchStartTime: number, delay: number): void {
	setTeamDelay(teamId, matchStartTime, delay, 'auto');
}

// Remove delay for a team/date (revert to global)
export function removeTeamDelay(teamId: string, matchStartTime: number): void {
	const key = getTeamDelayKey(teamId, matchStartTime);
	teamDelays.update(map => {
		const updated = new Map(map);
		updated.delete(key);
		return updated;
	});
}

// Get all delays for a specific team (across all dates)
export function getTeamDelaysForTeam(teamId: string): Array<{ date: string; delay: number; source: 'manual' | 'auto' }> {
	const current = get(teamDelays);
	const delays: Array<{ date: string; delay: number; source: 'manual' | 'auto' }> = [];
	
	current.forEach((entry, key) => {
		if (key.startsWith(`${teamId}_`)) {
			const parts = key.split('_');
			if (parts.length >= 2) {
				const date = parts.slice(1).join('_'); // Handle team IDs with underscores
				delays.push({ date, delay: entry.delay, source: entry.source });
			}
		}
	});
	
	return delays.sort((a, b) => a.date.localeCompare(b.date));
}

// Get delay for a specific date (for team)
export function getTeamDelayForDate(teamId: string, date: string): number | null {
	const current = get(teamDelays);
	const key = `${teamId}_${date}`;
	const entry = current.get(key);
	return entry !== undefined ? entry.delay : null;
}

