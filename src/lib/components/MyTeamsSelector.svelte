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
		class="px-3 py-2 text-sm font-medium rounded-lg bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463] hover:border-[#eab308] transition-colors"
	>
		My Teams ({$followedTeams.followedTeams.length})
	</button>

	{#if isOpen}
		<!-- Overlay -->
		<div
			class="fixed inset-0 z-40"
			onclick={() => isOpen = false}
		/>
		
		<!-- Dropdown -->
		<div class="absolute top-full left-0 mt-2 w-80 bg-[#3b3c48] border border-[#454654] rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto">
			<div class="p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-semibold text-[#f8f8f9]">Followed Teams</h3>
					<button
						onclick={() => isOpen = false}
						class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
					>
						✕
					</button>
				</div>

				<!-- Followed Teams List -->
				{#if $followedTeams.followedTeams.length > 0}
					<div class="mb-4 space-y-2">
						{#each $followedTeams.followedTeams as team, index}
							<div class="flex items-center gap-2 px-3 py-2 rounded bg-[#454654] border border-[#525463]">
								<!-- Color Picker -->
								<div class="flex-shrink-0 flex items-center gap-1">
									{#each AVAILABLE_COLORS as color}
										<button
											onclick={() => handleColorChange(team.teamId, color)}
											class="w-4 h-4 rounded border-2 transition-all {$followedTeams.getTeamColor(team.teamId) === color ? 'border-white scale-110' : 'border-[#525463] hover:border-[#9fa2ab]'}"
											style="background-color: {color}"
											title={color}
										/>
									{/each}
								</div>

								<!-- Team Name -->
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-[#f8f8f9] truncate">
										{team.teamName}
									</div>
								</div>

								<!-- Reorder Buttons -->
								<div class="flex-shrink-0 flex flex-col gap-0.5">
									{#if index > 0}
										<button
											onclick={() => followedTeams.reorderTeams(team.teamId, 'up')}
											class="text-[#9fa2ab] hover:text-[#f8f8f9] text-xs"
											title="Move up"
										>
											↑
										</button>
									{/if}
									{#if index === 0}
										<button
											onclick={() => followedTeams.reorderTeams(team.teamId, 'top')}
											class="text-[#eab308] hover:text-[#facc15] text-xs"
											title="Pinned"
										>
											📌
										</button>
									{/if}
									{#if index < $followedTeams.followedTeams.length - 1}
										<button
											onclick={() => followedTeams.reorderTeams(team.teamId, 'down')}
											class="text-[#9fa2ab] hover:text-[#f8f8f9] text-xs"
											title="Move down"
										>
											↓
										</button>
									{/if}
								</div>

								<!-- Unfollow Button -->
								<button
									onclick={() => handleTeamToggle(team.teamId, team.teamName)}
									class="flex-shrink-0 text-[#9fa2ab] hover:text-red-400 transition-colors"
									title="Unfollow"
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Available Teams -->
				<div class="border-t border-[#454654] pt-3">
					<h4 class="text-xs font-medium text-[#9fa2ab] mb-2 uppercase tracking-wider">
						Available Teams
					</h4>
					<div class="space-y-1 max-h-48 overflow-y-auto">
						{#each availableTeams.filter(team => !followedTeams.isFollowing(team.id)) as team}
							<button
								onclick={() => handleTeamToggle(team.id, team.name)}
								class="w-full px-3 py-2 text-left text-sm text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#454654] rounded transition-colors"
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

