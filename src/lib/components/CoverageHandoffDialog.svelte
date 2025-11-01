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
	<div class="bg-charcoal-800 border border-charcoal-700 rounded-lg p-6 max-w-md w-full">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-semibold text-charcoal-50">Transfer Coverage</h3>
			<button
				onclick={onClose}
				class="text-charcoal-300 hover:text-charcoal-50 transition-colors"
			>
				✕
			</button>
		</div>

		<div class="space-y-4">
			<div>
				<div class="text-xs text-charcoal-300 mb-1 block">Team</div>
				<div class="text-sm text-charcoal-50">Team {teamId}</div>
			</div>

			<div>
				<div class="text-xs text-charcoal-300 mb-1 block">From</div>
				<div class="flex items-center gap-2">
					<div
						class="w-3 h-3 rounded-full"
						style="background-color: {fromMember?.color}"
					></div>
					<span class="text-sm text-charcoal-50">{fromMember?.name || 'Unknown'}</span>
				</div>
			</div>

			<div>
				<div class="text-xs text-charcoal-300 mb-1 block">Transfer To</div>
				<select
					bind:value={selectedMemberId}
					class="w-full px-3 py-2 text-sm rounded bg-charcoal-700 text-charcoal-50 border border-charcoal-600 focus:border-gold-500 focus:outline-none"
				>
					<option value="">Select team member...</option>
					{#each availableMembers as member}
						<option value={member.id}>{member.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<div class="text-xs text-charcoal-300 mb-1 block">Notes (optional)</div>
				<textarea
					bind:value={handoffNote}
					placeholder="Add any notes about this handoff..."
					rows={3}
					class="w-full px-3 py-2 text-sm rounded bg-charcoal-700 text-charcoal-50 border border-charcoal-600 focus:border-gold-500 focus:outline-none resize-none"
				></textarea>
			</div>
		</div>

		<div class="flex gap-2 mt-6">
			<button
				onclick={handleSubmit}
				disabled={!selectedMemberId}
				class="flex-1 px-3 py-2 text-xs font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Transfer
			</button>
			<button
				onclick={onClose}
				class="px-3 py-2 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600 transition-colors"
			>
				Cancel
			</button>
		</div>
	</div>
</div>

