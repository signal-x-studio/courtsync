<script lang="ts">
	import { teamCoordination } from '$lib/stores/teamCoordination';
	
	export let teamId: string;
	export let fromMemberId: string;
	export let onClose: () => void;
	export let onHandoff: (toMemberId: string, note: string) => void;
	
	let selectedMemberId = '';
	let handoffNote = '';
	
	const fromMember = teamCoordination.getMember(fromMemberId);
	$: availableMembers = teamCoordination.members.filter(m => m.id !== fromMemberId);
	
	function handleSubmit() {
		if (selectedMemberId) {
			onHandoff(selectedMemberId, handoffNote);
			onClose();
		}
	}
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-[#3b3c48] border border-[#454654] rounded-lg p-6 max-w-md w-full">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-semibold text-[#f8f8f9]">Transfer Coverage</h3>
			<button
				onclick={onClose}
				class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
			>
				✕
			</button>
		</div>

		<div class="space-y-4">
			<div>
				<label class="text-xs text-[#9fa2ab] mb-1 block">Team</label>
				<div class="text-sm text-[#f8f8f9]">Team {teamId}</div>
			</div>

			<div>
				<label class="text-xs text-[#9fa2ab] mb-1 block">From</label>
				<div class="flex items-center gap-2">
					<div
						class="w-3 h-3 rounded-full"
						style="background-color: {fromMember?.color}"
					/>
					<span class="text-sm text-[#f8f8f9]">{fromMember?.name || 'Unknown'}</span>
				</div>
			</div>

			<div>
				<label class="text-xs text-[#9fa2ab] mb-1 block">Transfer To</label>
				<select
					bind:value={selectedMemberId}
					class="w-full px-3 py-2 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none"
				>
					<option value="">Select team member...</option>
					{#each availableMembers as member}
						<option value={member.id}>{member.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="text-xs text-[#9fa2ab] mb-1 block">Notes (optional)</label>
				<textarea
					bind:value={handoffNote}
					placeholder="Add any notes about this handoff..."
					rows={3}
					class="w-full px-3 py-2 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none resize-none"
				/>
			</div>
		</div>

		<div class="flex gap-2 mt-6">
			<button
				onclick={handleSubmit}
				disabled={!selectedMemberId}
				class="flex-1 px-3 py-2 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Transfer
			</button>
			<button
				onclick={onClose}
				class="px-3 py-2 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
			>
				Cancel
			</button>
		</div>
	</div>
</div>

