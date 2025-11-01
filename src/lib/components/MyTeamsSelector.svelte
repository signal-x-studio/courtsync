<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { followedTeams } from '$lib/stores/followedTeams';
	
	export let matches: FilteredMatch[];
	
	let isOpen = false;
	
	// Get unique teams from matches
	$: availableTeams = (() => {
		const teamMap = new Map<string, string>();
		matches.forEach(match => {
			const teamId = match.FirstTeamText || match.SecondTeamText;
			if (teamId && !teamMap.has(teamId)) {
				teamMap.set(teamId, teamId);
			}
		});
		return Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }));
	})();
	
	// Available colors for team customization
	const AVAILABLE_COLORS = [
		'#eab308', // Gold
		'#3b82f6', // Blue
		'#10b981', // Green
		'#f59e0b', // Orange
		'#ef4444', // Red
		'#8b5cf6', // Purple
		'#ec4899', // Pink
		'#06b6d4', // Cyan
	];
	
	function handleTeamToggle(teamId: string, teamName: string) {
		if (followedTeams.isFollowing(teamId)) {
			followedTeams.unfollowTeam(teamId);
		} else {
			followedTeams.followTeam(teamId, teamName);
		}
	}
	
	function handleColorChange(teamId: string, color: string) {
		followedTeams.setTeamColor(teamId, color);
	}
</script>

<div class="relative">
	<button
		onclick={() => isOpen = !isOpen}
		class="px-3 py-2 text-sm font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600 hover:border-[#eab308] transition-colors"
	>
		My Teams ({$followedTeams?.length || 0})
	</button>

	{#if isOpen}
		<!-- Overlay -->
		<div
			class="fixed inset-0 z-40"
			onclick={() => isOpen = false}
		/>
		
		<!-- Dropdown -->
		<div class="absolute top-full left-0 mt-2 w-80 bg-charcoal-800 border border-charcoal-700 rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto">
			<div class="p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-semibold text-charcoal-50">Followed Teams</h3>
					<button
						onclick={() => isOpen = false}
						class="text-charcoal-300 hover:text-charcoal-50 transition-colors"
					>
						✕
					</button>
				</div>

				<!-- Followed Teams List -->
				{#if $followedTeams && $followedTeams.length > 0}
					<div class="mb-4 space-y-2">
						{#each $followedTeams as team, index}
							<div class="flex items-center gap-2 px-3 py-2 rounded bg-charcoal-700 border border-charcoal-600">
								<!-- Color Picker -->
								<div class="flex-shrink-0 flex items-center gap-1">
									{#each AVAILABLE_COLORS as color}
										<button
											onclick={() => handleColorChange(team.teamId, color)}
											class="w-4 h-4 rounded border-2 transition-all {$followedTeams.getTeamColor(team.teamId) === color ? 'border-white scale-110' : 'border-charcoal-600 hover:border-[#9fa2ab]'}"
											style="background-color: {color}"
											title={color}
										/>
									{/each}
								</div>

								<!-- Team Name -->
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-charcoal-50 truncate">
										{team.teamName}
									</div>
								</div>

								<!-- Reorder Buttons -->
								<div class="flex-shrink-0 flex flex-col gap-0.5">
									{#if index > 0}
										<button
											onclick={() => followedTeams.reorderTeams(team.teamId, 'up')}
											class="text-charcoal-300 hover:text-charcoal-50 text-xs"
											title="Move up"
										>
											↑
										</button>
									{/if}
									{#if index === 0}
										<button
											onclick={() => followedTeams.reorderTeams(team.teamId, 'top')}
											class="text-gold-500 hover:text-[#facc15] text-xs"
											title="Pinned"
										>
											📌
										</button>
									{/if}
									{#if index < ($followedTeams?.length || 0) - 1}
										<button
											onclick={() => followedTeams.reorderTeams(team.teamId, 'down')}
											class="text-charcoal-300 hover:text-charcoal-50 text-xs"
											title="Move down"
										>
											↓
										</button>
									{/if}
								</div>

								<!-- Unfollow Button -->
								<button
									onclick={() => handleTeamToggle(team.teamId, team.teamName)}
									class="flex-shrink-0 text-charcoal-300 hover:text-red-400 transition-colors"
									title="Unfollow"
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Available Teams -->
				<div class="border-t border-charcoal-700 pt-3">
					<h4 class="text-xs font-medium text-charcoal-300 mb-2 uppercase tracking-wider">
						Available Teams
					</h4>
					<div class="space-y-1 max-h-48 overflow-y-auto">
						{#each availableTeams.filter(team => !followedTeams.isFollowing(team.id)) as team}
							<button
								onclick={() => handleTeamToggle(team.id, team.name)}
								class="w-full px-3 py-2 text-left text-sm text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-700 rounded transition-colors"
							>
								+ {team.name}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

