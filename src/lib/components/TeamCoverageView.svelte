<script lang="ts">
	import { onMount } from 'svelte';
	import type { FilteredMatch } from '$lib/types';
	import { coverageStatus } from '$lib/stores/coverageStatus';
	import { teamCoordination } from '$lib/stores/teamCoordination';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { generateShareableUrl, extractCoverageFromUrl, hasShareableCoverageInUrl } from '$lib/utils/coverageShare';
	import CoverageHandoffDialog from '$lib/components/CoverageHandoffDialog.svelte';
	
	export let matches: FilteredMatch[];
	
	let showImportDialog = false;
	let importJson = '';
	let importError: string | null = null;
	let handoffDialog: { teamId: string; fromMemberId: string } | null = null;
	
	// Build coverage status map for export
	$: coverageStatusMap = (() => {
		const map = new Map<string, string>();
		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
			if (teamId) {
				map.set(teamId, coverageStatus.getTeamStatus(teamId));
			}
		});
		return map;
	})();
	
	// Check for shareable coverage data in URL on mount
	onMount(() => {
		if (hasShareableCoverageInUrl()) {
			const urlData = extractCoverageFromUrl();
			if (urlData) {
				importJson = JSON.stringify(urlData, null, 2);
				showImportDialog = true;
				window.history.replaceState(null, '', window.location.pathname);
			}
		}
	});
	
	// Export handler
	function handleExport() {
		const json = teamCoordination.exportCoverageStatus(coverageStatusMap as any);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coverage-status-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
	
	// Generate shareable link
	function handleGenerateLink() {
		const currentMember = teamCoordination.getCurrentMember();
		if (!currentMember) {
			alert('Please select a team member first');
			return;
		}

		const exportData = {
			memberId: currentMember.id,
			memberName: currentMember.name,
			exportedAt: new Date().toISOString(),
			assignments: [] as Array<{ teamId: string }>,
			coverageStatus: {} as Record<string, string>,
		};

		const tempMap = new Map<string, { teamId: string; status: string; assignment: string | null }>();
		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
			if (teamId) {
				if (!tempMap.has(teamId)) {
					tempMap.set(teamId, {
						teamId,
						status: coverageStatus.getTeamStatus(teamId),
						assignment: teamCoordination.getTeamAssignment(teamId),
					});
				}
			}
		});

		Array.from(tempMap.entries()).forEach(([teamId, team]) => {
			if (team.assignment === currentMember.id) {
				exportData.assignments.push({ teamId });
				exportData.coverageStatus[teamId] = team.status;
			}
		});

		const shareableUrl = generateShareableUrl(exportData as any);
		
		navigator.clipboard.writeText(shareableUrl).then(() => {
			alert('Shareable link copied to clipboard!');
		}).catch(() => {
			prompt('Shareable link (copy this):', shareableUrl);
		});
	}
	
	// Handoff handler
	function handleHandoff(teamId: string, fromMemberId: string, toMemberId: string, note: string) {
		teamCoordination.assignTeam(teamId, toMemberId);
		console.log(`Handoff: Team ${teamId} from ${fromMemberId} to ${toMemberId}`, note);
		handoffDialog = null;
	}
	
	// Import handler
	function handleImport() {
		try {
			importError = null;
			const result = teamCoordination.importCoverageStatus(importJson, 'merge');
			if (result.success) {
				try {
					const data = JSON.parse(importJson);
					if (data.coverageStatus) {
						Object.entries(data.coverageStatus).forEach(([teamId, status]) => {
							coverageStatus.setTeamStatus(teamId, status as any);
						});
					}
				} catch (e) {
					console.error('Failed to import coverage status:', e);
				}
				
				showImportDialog = false;
				importJson = '';
				alert('Coverage status imported successfully!');
			} else {
				importError = result.error || 'Import failed';
			}
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Unknown error';
		}
	}
	
	// Build team coverage map
	$: teamCoverageMap = (() => {
		const map = new Map<string, {
			teamId: string;
			status: string;
			assignment: string | null;
			matches: FilteredMatch[];
		}>();

		matches.forEach(match => {
			const teamId = getTeamIdentifier(match);
			if (!teamId) return;

			if (!map.has(teamId)) {
				map.set(teamId, {
					teamId,
					status: coverageStatus.getTeamStatus(teamId),
					assignment: teamCoordination.getTeamAssignment(teamId),
					matches: [],
				});
			}

			map.get(teamId)!.matches.push(match);
		});

		return map;
	})();
	
	// Calculate statistics
	$: stats = (() => {
		const totalTeams = teamCoverageMap.size;
		const assignedTeams = Array.from(teamCoverageMap.values())
			.filter(t => t.assignment !== null).length;
		const unassignedTeams = totalTeams - assignedTeams;

		const assignmentConflicts = new Map<string, string[]>();
		
		Array.from(teamCoverageMap.values()).forEach(team => {
			if (team.assignment) {
				if (!assignmentConflicts.has(team.teamId)) {
					assignmentConflicts.set(team.teamId, []);
				}
				assignmentConflicts.get(team.teamId)!.push(team.assignment);
			}
		});

		const coverageByMember = new Map<string, {
			covered: number;
			partiallyCovered: number;
			planned: number;
			uncovered: number;
		}>();

		Array.from(teamCoverageMap.values()).forEach(team => {
			if (team.assignment) {
				const memberStats = coverageByMember.get(team.assignment) || {
					covered: 0,
					partiallyCovered: 0,
					planned: 0,
					uncovered: 0,
				};

				if (team.status === 'covered') {
					memberStats.covered++;
				} else if (team.status === 'partially-covered') {
					memberStats.partiallyCovered++;
				} else if (team.status === 'planned') {
					memberStats.planned++;
				} else {
					memberStats.uncovered++;
				}

				coverageByMember.set(team.assignment, memberStats);
			}
		});

		return {
			totalTeams,
			assignedTeams,
			unassignedTeams,
			coverageByMember,
			assignmentConflicts,
		};
	})();
	
	// Group teams by assignment
	$: teamsByAssignment = (() => {
		const grouped = new Map<string, Array<{ teamId: string; status: string; assignment: string | null; matches: FilteredMatch[] }>>();

		Array.from(teamCoverageMap.values()).forEach(team => {
			const key = team.assignment || 'unassigned';
			if (!grouped.has(key)) {
				grouped.set(key, []);
			}
			grouped.get(key)!.push(team);
		});

		return grouped;
	})();
</script>

<div class="space-y-6">
	<!-- Export/Import Section -->
	<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-semibold text-charcoal-50">Share Coverage Status</h3>
			<div class="flex gap-2 flex-wrap">
				<button
					onclick={handleExport}
					class="px-3 py-1.5 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
				>
					Export JSON
				</button>
				<button
					onclick={handleGenerateLink}
					class="px-3 py-1.5 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
				>
					Generate Link
				</button>
				<button
					onclick={() => showImportDialog = true}
					class="px-3 py-1.5 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
				>
					Import JSON
				</button>
			</div>
		</div>
		<p class="text-xs text-charcoal-300">
			Export your coverage status to share with team members, generate a shareable link, or import coverage status from others.
		</p>
	</div>

	<!-- Import Dialog -->
	{#if showImportDialog}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div class="bg-charcoal-800 border border-charcoal-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-sm font-semibold text-charcoal-50">Import Coverage Status</h3>
					<button
						onclick={() => {
							showImportDialog = false;
							importJson = '';
							importError = null;
						}}
						class="text-charcoal-300 hover:text-charcoal-50 transition-colors"
					>
						✕
					</button>
				</div>
			<textarea
				bind:value={importJson}
				placeholder="Paste JSON data here..."
				class="w-full h-64 px-3 py-2 text-sm rounded bg-charcoal-700 text-charcoal-50 border border-charcoal-600 focus:border-gold-500 focus:outline-none font-mono"
			></textarea>
				{#if importError}
					<div class="mt-2 text-xs text-red-400">{importError}</div>
				{/if}
				<div class="flex gap-2 mt-4">
					<button
						onclick={handleImport}
						class="px-3 py-1.5 text-xs font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors"
					>
						Import
					</button>
					<button
						onclick={() => {
							showImportDialog = false;
							importJson = '';
							importError = null;
						}}
						class="px-3 py-1.5 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Summary Statistics -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Total Teams</div>
			<div class="text-2xl font-bold text-charcoal-50">{stats.totalTeams}</div>
		</div>
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Assigned</div>
			<div class="text-2xl font-bold text-green-400">{stats.assignedTeams}</div>
		</div>
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<div class="text-xs text-charcoal-300 uppercase tracking-wider mb-1">Unassigned</div>
			<div class="text-2xl font-bold text-charcoal-400">{stats.unassignedTeams}</div>
		</div>
	</div>

	<!-- Coverage by Member -->
	{#if teamCoordination.members.length > 0}
		<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
			<h3 class="text-sm font-semibold text-charcoal-50 mb-4">Coverage by Team Member</h3>
			<div class="space-y-3">
				{#each teamCoordination.members as member}
					{@const memberStats = stats.coverageByMember.get(member.id) || { covered: 0, partiallyCovered: 0, planned: 0, uncovered: 0 }}
					{@const total = memberStats.covered + memberStats.partiallyCovered + memberStats.planned + memberStats.uncovered}
					
					<div class="flex items-center gap-3">
						<div
							class="w-4 h-4 rounded-full flex-shrink-0"
							style="background-color: {member.color}"
						/>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-charcoal-50">{member.name}</div>
							<div class="text-xs text-charcoal-300">
								{total} team{total !== 1 ? 's' : ''} • {memberStats.covered} covered • {memberStats.planned} planned
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Team Assignments -->
	<div class="rounded-lg border border-charcoal-700 bg-charcoal-800 p-4">
		<h3 class="text-sm font-semibold text-charcoal-50 mb-4">Team Assignments</h3>
		
		<!-- Unassigned Teams -->
		{#if teamsByAssignment.has('unassigned')}
			<div class="mb-6">
				<h4 class="text-xs font-medium text-charcoal-400 uppercase tracking-wider mb-2">
					Unassigned ({teamsByAssignment.get('unassigned')!.length})
				</h4>
				<div class="space-y-1">
					{#each teamsByAssignment.get('unassigned')! as team}
						<div class="flex items-center justify-between p-2 rounded bg-charcoal-700 border border-charcoal-600">
							<div class="flex items-center gap-2">
								<div class="w-2 h-2 rounded {team.status === 'covered' ? 'bg-green-500' : team.status === 'partially-covered' ? 'bg-[#f59e0b]' : team.status === 'planned' ? 'bg-gold-500' : 'bg-[#808593]'}"></div>
								<span class="text-sm text-charcoal-50">Team {team.teamId}</span>
								<span class="text-xs text-charcoal-300">({team.matches.length} matches)</span>
							</div>
							<select
								value=""
								onchange={(e) => {
									if (e.target.value) {
										teamCoordination.assignTeam(team.teamId, e.target.value);
									}
								}}
								class="px-2 py-1 text-xs rounded bg-charcoal-800 text-charcoal-200 border border-charcoal-600 focus:border-gold-500 focus:outline-none"
							>
								<option value="">Assign...</option>
								{#each teamCoordination.members as member}
									<option value={member.id}>{member.name}</option>
								{/each}
							</select>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Assigned Teams by Member -->
		{#each teamCoordination.members as member}
			{@const memberTeams = teamsByAssignment.get(member.id) || []}
			{#if memberTeams.length > 0}
				<div class="mb-6">
					<div class="flex items-center gap-2 mb-2">
						<div
							class="w-3 h-3 rounded-full"
							style="background-color: {member.color}"
						></div>
						<h4 class="text-xs font-medium text-charcoal-50 uppercase tracking-wider">
							{member.name} ({memberTeams.length})
						</h4>
					</div>
					<div class="space-y-1">
						{#each memberTeams as team}
							<div class="flex items-center justify-between p-2 rounded bg-charcoal-700 border border-charcoal-600">
								<div class="flex items-center gap-2">
									<div class="w-2 h-2 rounded {team.status === 'covered' ? 'bg-green-500' : team.status === 'partially-covered' ? 'bg-[#f59e0b]' : team.status === 'planned' ? 'bg-gold-500' : 'bg-[#808593]'}"></div>
									<span class="text-sm text-charcoal-50">Team {team.teamId}</span>
									<span class="text-xs text-charcoal-300">({team.matches.length} matches)</span>
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={() => handoffDialog = { teamId: team.teamId, fromMemberId: member.id }}
										class="px-2 py-1 text-xs text-charcoal-300 hover:text-gold-500 transition-colors"
										title="Transfer to another member"
									>
										↪
									</button>
									<button
										onclick={() => teamCoordination.unassignTeam(team.teamId)}
										class="px-2 py-1 text-xs text-charcoal-300 hover:text-red-400 transition-colors"
										title="Unassign"
									>
										✕
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Handoff Dialog -->
	{#if handoffDialog}
		<CoverageHandoffDialog
			teamId={handoffDialog.teamId}
			fromMemberId={handoffDialog.fromMemberId}
			onClose={() => handoffDialog = null}
			onHandoff={(toMemberId: string, note: string) => handleHandoff(handoffDialog.teamId, handoffDialog.fromMemberId, toMemberId, note)}
		/>
	{/if}
</div>

