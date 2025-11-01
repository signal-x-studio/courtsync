import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { CoverageStatus } from './coverageStatus';

export interface TeamMember {
	id: string;
	name: string;
	color: string;
	createdAt: number;
}

export interface TeamAssignment {
	teamId: string;
	memberId: string;
	assignedAt: number;
}

const STORAGE_KEY_MEMBERS = 'teamMembers';
const STORAGE_KEY_ASSIGNMENTS = 'teamAssignments';

const AVAILABLE_COLORS = [
	'#eab308', // Gold
	'#3b82f6', // Blue
	'#10b981', // Green
	'#f59e0b', // Orange
	'#8b5cf6', // Purple
	'#ec4899', // Pink
	'#06b6d4', // Cyan
	'#f97316' // Red-Orange
];

function createTeamCoordination() {
	const { subscribe: subscribeMembers, set: setMembers, update: updateMembers } = writable<
		TeamMember[]
	>([]);
	const { subscribe: subscribeAssignments, set: setAssignments, update: updateAssignments } =
		writable<Map<string, string>>(new Map());
	const { subscribe: subscribeCurrentMember, set: setCurrentMember } = writable<string | null>(
		null
	);

	// Load from localStorage
	if (browser) {
		try {
			const storedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
			if (storedMembers) {
				const parsed = JSON.parse(storedMembers);
				setMembers(parsed);
				if (parsed.length > 0) {
					setCurrentMember(parsed[0].id);
				}
			} else {
				const defaultMember: TeamMember = {
					id: 'you',
					name: 'You',
					color: AVAILABLE_COLORS[0],
					createdAt: Date.now()
				};
				setMembers([defaultMember]);
				setCurrentMember('you');
			}
		} catch (error) {
			console.error('Failed to load team coordination data:', error);
		}

		try {
			const storedAssignments = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
			if (storedAssignments) {
				const parsed = JSON.parse(storedAssignments);
				setAssignments(new Map(Object.entries(parsed)));
			}
		} catch (error) {
			console.error('Failed to load team assignments:', error);
		}
	}

	const saveMembers = (members: TeamMember[]) => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
		} catch (error) {
			console.error('Failed to save team members:', error);
		}
	};

	const saveAssignments = (assignments: Map<string, string>) => {
		if (!browser) return;
		try {
			const assignmentsObj = Object.fromEntries(assignments);
			localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignmentsObj));
		} catch (error) {
			console.error('Failed to save team assignments:', error);
		}
	};

	return {
		members: { subscribe: subscribeMembers },
		assignments: { subscribe: subscribeAssignments },
		currentMemberId: { subscribe: subscribeCurrentMember },
		setCurrentMemberId: (memberId: string) => {
			setCurrentMember(memberId);
		},
		addMember: (name: string) => {
			let usedColors: Set<string> = new Set();
			subscribeMembers((members) => {
				usedColors = new Set(members.map((m) => m.color));
			})();

			const availableColor = AVAILABLE_COLORS.find((c) => !usedColors.has(c)) || AVAILABLE_COLORS[0];

			const newMember: TeamMember = {
				id: `member-${Date.now()}`,
				name,
				color: availableColor,
				createdAt: Date.now()
			};

			updateMembers((members) => {
				const next = [...members, newMember];
				saveMembers(next);
				return next;
			});

			setCurrentMember(newMember.id);
			return newMember.id;
		},
		removeMember: (memberId: string) => {
			updateMembers((members) => {
				const next = members.filter((m) => m.id !== memberId);
				saveMembers(next);
				return next;
			});

			updateAssignments((assignments) => {
				const next = new Map(assignments);
				Array.from(next.entries()).forEach(([teamId, assignedMemberId]) => {
					if (assignedMemberId === memberId) {
						next.delete(teamId);
					}
				});
				saveAssignments(next);
				return next;
			});

			subscribeMembers((members) => {
				if (members.length > 0) {
					setCurrentMember(members[0].id);
				}
			})();
		},
		updateMember: (memberId: string, updates: Partial<TeamMember>) => {
			updateMembers((members) => {
				const next = members.map((m) => (m.id === memberId ? { ...m, ...updates } : m));
				saveMembers(next);
				return next;
			});
		},
		assignTeam: (teamId: string, memberId: string) => {
			updateAssignments((assignments) => {
				const next = new Map(assignments);
				next.set(teamId, memberId);
				saveAssignments(next);
				return next;
			});
		},
		unassignTeam: (teamId: string) => {
			updateAssignments((assignments) => {
				const next = new Map(assignments);
				next.delete(teamId);
				saveAssignments(next);
				return next;
			});
		},
		getTeamAssignment: (teamId: string): string | null => {
			let assignment: string | null = null;
			subscribeAssignments((assignments) => {
				assignment = assignments.get(teamId) || null;
			})();
			return assignment;
		},
		getMember: (memberId: string): TeamMember | null => {
			let member: TeamMember | null = null;
			subscribeMembers((members) => {
				member = members.find((m) => m.id === memberId) || null;
			})();
			return member;
		},
		getCurrentMember: (): TeamMember | null => {
			let currentId: string | null = null;
			subscribeCurrentMember((id) => {
				currentId = id;
			})();
			if (!currentId) return null;

			let member: TeamMember | null = null;
			subscribeMembers((members) => {
				member = members.find((m) => m.id === currentId) || null;
			})();
			return member;
		},
		exportCoverageStatus: (
			coverageStatus: Map<string, CoverageStatus>,
			memberId?: string
		): string => {
			let currentId: string | null = null;
			subscribeCurrentMember((id) => {
				currentId = id;
			})();

			const memberToExport = memberId || currentId;
			if (!memberToExport) return JSON.stringify({});

			let member: TeamMember | null = null;
			subscribeMembers((members) => {
				member = members.find((m) => m.id === memberToExport) || null;
			})();

			let assignments: Map<string, string> = new Map();
			subscribeAssignments((assigns) => {
				assignments = assigns;
			})();

			const memberAssignments = Array.from(assignments.entries())
				.filter(([_, assignedMemberId]) => assignedMemberId === memberToExport)
				.map(([teamId]) => teamId);

			const memberCoverageStatus: Record<string, CoverageStatus> = {};
			Array.from(coverageStatus.entries()).forEach(([teamId, status]) => {
				if (memberAssignments.includes(teamId)) {
					memberCoverageStatus[teamId] = status;
				}
			});

			const data = {
				memberId: memberToExport,
				memberName: member?.name || 'Unknown',
				exportedAt: new Date().toISOString(),
				assignments: memberAssignments.map((teamId) => ({ teamId })),
				coverageStatus: memberCoverageStatus
			};

			return JSON.stringify(data, null, 2);
		},
		importCoverageStatus: (
			jsonData: string,
			mergeStrategy: 'replace' | 'merge' = 'merge'
		): { success: boolean; error?: string } => {
			try {
				const data = JSON.parse(jsonData);

				if (!data.coverageStatus || !data.memberId) {
					return {
						success: false,
						error: 'Invalid data format: missing coverageStatus or memberId'
					};
				}

				if (mergeStrategy === 'merge' && data.assignments) {
					updateAssignments((assignments) => {
						const next = new Map(assignments);
						data.assignments.forEach((assignment: { teamId: string }) => {
							next.set(assignment.teamId, data.memberId);
						});
						saveAssignments(next);
						return next;
					});
				}

				return { success: true };
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				};
			}
		},
		mergeCoverageStatuses: (
			statuses: Array<{ memberId: string; coverageStatus: Record<string, CoverageStatus> }>
		): Map<string, CoverageStatus> => {
			const merged = new Map<string, CoverageStatus>();

			statuses.forEach(({ coverageStatus }) => {
				Object.entries(coverageStatus).forEach(([teamId, status]) => {
					const currentStatus = merged.get(teamId);
					if (!currentStatus) {
						merged.set(teamId, status);
					} else {
						const priority: Record<CoverageStatus, number> = {
							covered: 3,
							'partially-covered': 2,
							planned: 1,
							'not-covered': 0
						};
						if (priority[status] > priority[currentStatus]) {
							merged.set(teamId, status);
						}
					}
				});
			});

			return merged;
		}
	};
}

export const teamCoordination = createTeamCoordination();

