<script lang="ts">
	import { teamCoordination } from '$lib/stores/teamCoordination';
	
	let showAddForm = false;
	let newMemberName = '';
	let editingMemberId: string | null = null;
	
	function handleAddMember() {
		if (newMemberName.trim()) {
			teamCoordination.addMember(newMemberName.trim());
			newMemberName = '';
			showAddForm = false;
		}
	}
	
	function handleRemoveMember(memberId: string) {
		if (teamCoordination.members.length > 1) {
			const member = teamCoordination.getMember(memberId);
			if (confirm(`Remove ${member?.name}?`)) {
				teamCoordination.removeMember(memberId);
			}
		} else {
			alert('Cannot remove the last team member');
		}
	}
	
	$: assignmentsCountByMember = (() => {
		const counts = new Map<string, number>();
		Array.from(teamCoordination.assignments.values()).forEach(memberId => {
			counts.set(memberId, (counts.get(memberId) || 0) + 1);
		});
		return counts;
	})();
</script>

<div class="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-sm font-semibold text-[#f8f8f9]">Team Members</h3>
		<button
			onclick={() => showAddForm = !showAddForm}
			class="px-3 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
		>
			{showAddForm ? 'Cancel' : '+ Add Member'}
		</button>
	</div>

	<!-- Add Member Form -->
	{#if showAddForm}
		<div class="mb-4 p-3 rounded bg-[#454654] border border-[#525463]">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newMemberName}
					onkeypress={(e) => e.key === 'Enter' && handleAddMember()}
					placeholder="Member name"
					class="flex-1 px-3 py-2 text-sm rounded bg-[#3b3c48] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none"
					autofocus
				/>
				<button
					onclick={handleAddMember}
					class="px-3 py-2 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
				>
					Add
				</button>
			</div>
		</div>
	{/if}

	<!-- Members List -->
	<div class="space-y-2">
		{#each teamCoordination.members as member}
			{@const isCurrent = teamCoordination.currentMemberId === member.id}
			{@const isEditing = editingMemberId === member.id}
			{@const assignmentsCount = assignmentsCountByMember.get(member.id) || 0}
			
			<div
				class="flex items-center justify-between p-3 rounded border transition-colors {isCurrent ? 'border-[#eab308] bg-[#eab308]/10' : 'border-[#454654] bg-[#3b3c48]'}"
			>
				<div class="flex items-center gap-3 flex-1 min-w-0">
					<!-- Color Indicator -->
					<div
						class="w-4 h-4 rounded-full flex-shrink-0"
						style="background-color: {member.color}"
					/>
					
					<!-- Member Name -->
					{#if isEditing}
						<input
							type="text"
							value={member.name}
							onblur={(e) => {
								if (e.target.value.trim() && e.target.value !== member.name) {
									teamCoordination.updateMember(member.id, { name: e.target.value.trim() });
								}
								editingMemberId = null;
							}}
							onkeypress={(e) => {
								if (e.key === 'Enter') {
									e.currentTarget.blur();
								}
							}}
							class="flex-1 px-2 py-1 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none"
							autofocus
						/>
					{:else}
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<button
								onclick={() => teamCoordination.setCurrentMemberId(member.id)}
								class="text-sm font-medium truncate {isCurrent ? 'text-[#facc15]' : 'text-[#f8f8f9] hover:text-[#facc15]'} transition-colors"
							>
								{member.name}
							</button>
							{#if isCurrent}
								<span class="text-[10px] text-[#9fa2ab]">(Active)</span>
							{/if}
							{#if assignmentsCount > 0}
								<span class="text-[10px] text-[#9fa2ab]">
									({assignmentsCount} team{assignmentsCount !== 1 ? 's' : ''})
								</span>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-2 flex-shrink-0">
					{#if !isEditing}
						<button
							onclick={() => editingMemberId = member.id}
							class="px-2 py-1 text-xs text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
							title="Edit name"
						>
							✏️
						</button>
					{/if}
					{#if teamCoordination.members.length > 1}
						<button
							onclick={() => handleRemoveMember(member.id)}
							class="px-2 py-1 text-xs text-[#9fa2ab] hover:text-red-400 transition-colors"
							title="Remove member"
						>
							✕
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

