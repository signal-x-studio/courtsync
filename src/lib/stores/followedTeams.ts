import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const STORAGE_KEY_FOLLOWED_TEAMS = 'followedTeams';
const STORAGE_KEY_TEAM_COLORS = 'teamColors';

export interface FollowedTeam {
	teamId: string;
	teamName: string;
	followedAt: number;
	color?: string;
}

function createFollowedTeams() {
	const { subscribe: subscribeTeams, set: setTeams, update: updateTeams } = writable<
		FollowedTeam[]
	>([]);
	const { subscribe: subscribeColors, set: setColors, update: updateColors } = writable<
		Map<string, string>
	>(new Map());

	// Load from localStorage
	if (browser) {
		try {
			const followedData = localStorage.getItem(STORAGE_KEY_FOLLOWED_TEAMS);
			if (followedData) {
				setTeams(JSON.parse(followedData));
			}
		} catch (error) {
			console.error('Failed to load followed teams:', error);
		}

		try {
			const colorsData = localStorage.getItem(STORAGE_KEY_TEAM_COLORS);
			if (colorsData) {
				const parsed = JSON.parse(colorsData) as Record<string, string>;
				setColors(new Map(Object.entries(parsed)));
			}
		} catch (error) {
			console.error('Failed to load team colors:', error);
		}
	}

	const saveTeams = (teams: FollowedTeam[]) => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY_FOLLOWED_TEAMS, JSON.stringify(teams));
		} catch (error) {
			console.error('Failed to save followed teams:', error);
		}
	};

	const saveColors = (colors: Map<string, string>) => {
		if (!browser) return;
		try {
			const colorsObj: Record<string, string> = {};
			colors.forEach((color, teamId) => {
				colorsObj[teamId] = color;
			});
			localStorage.setItem(STORAGE_KEY_TEAM_COLORS, JSON.stringify(colorsObj));
		} catch (error) {
			console.error('Failed to save team colors:', error);
		}
	};

	return {
		subscribe: subscribeTeams,
		followTeam: (teamId: string, teamName: string) => {
			updateTeams((teams) => {
				if (teams.some((t) => t.teamId === teamId)) {
					return teams; // Already following
				}
				const next = [...teams, { teamId, teamName, followedAt: Date.now() }];
				saveTeams(next);
				return next;
			});
		},
		unfollowTeam: (teamId: string) => {
			updateTeams((teams) => {
				const next = teams.filter((t) => t.teamId !== teamId);
				saveTeams(next);
				return next;
			});
			updateColors((colors) => {
				const next = new Map(colors);
				next.delete(teamId);
				saveColors(next);
				return next;
			});
		},
		isFollowing: (teamId: string): boolean => {
			let following = false;
			subscribeTeams((teams) => {
				following = teams.some((t) => t.teamId === teamId);
			})();
			return following;
		},
		setTeamColor: (teamId: string, color: string) => {
			updateColors((colors) => {
				const next = new Map(colors);
				next.set(teamId, color);
				saveColors(next);
				return next;
			});
		},
		getTeamColor: (teamId: string): string | null => {
			let color: string | null = null;
			subscribeColors((colors) => {
				color = colors.get(teamId) || null;
			})();
			return color;
		},
		reorderTeams: (teamId: string, direction: 'up' | 'down' | 'top') => {
			updateTeams((teams) => {
				const index = teams.findIndex((t) => t.teamId === teamId);
				if (index === -1) return teams;

				const newTeams = [...teams];
				const team = newTeams[index];

				if (direction === 'top') {
					newTeams.splice(index, 1);
					newTeams.unshift(team);
				} else if (direction === 'up' && index > 0) {
					[newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];
				} else if (direction === 'down' && index < newTeams.length - 1) {
					[newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
				}

				saveTeams(newTeams);
				return newTeams;
			});
		}
	};
}

export const followedTeams = createFollowedTeams();

