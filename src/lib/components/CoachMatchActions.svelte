<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { createMatchNotesStore } from '$lib/stores/matchNotes';
	import { FileText, AlertCircle } from 'lucide-svelte';
	
	export let match: FilteredMatch;
	export let eventId: string;
	export let clubId: number;
	export let matches: FilteredMatch[] = [];
	
	const matchNotes = createMatchNotesStore(eventId);
	let noteText = '';
	let isEditingNote = false;
	
	$: teamId = getTeamIdentifier(match);
	$: hasNote = matchNotes.hasNote(match.MatchId);
	$: currentNote = matchNotes.getNote(match.MatchId);
	
	// Sync noteText with currentNote when not editing
	$: if (!isEditingNote) {
		noteText = currentNote;
	}
	
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
	
	$: opponent = getOpponent(match);
	
	function handleSaveNote() {
		matchNotes.setNote(match.MatchId, noteText);
		isEditingNote = false;
	}
	
	function handleDeleteNote() {
		matchNotes.deleteNote(match.MatchId);
		noteText = '';
		isEditingNote = false;
	}
	
	function handleStartEditing() {
		isEditingNote = true;
		noteText = currentNote;
	}
</script>

<div class="space-y-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-charcoal-50">Coaching Tools</h2>
	</div>
	
	<!-- Opponent Information -->
	<div>
		<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
			Opponent
		</div>
		<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
			<div class="text-sm font-medium text-charcoal-50 mb-1">
				{opponent}
			</div>
			<div class="text-xs text-charcoal-400">
				Division: {match.Division.CodeAlias}
			</div>
		</div>
	</div>
	
	<!-- Match Notes -->
	<div>
		<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">
			Match Notes
		</div>
		
		{#if isEditingNote}
			<div class="space-y-2">
				<textarea
					bind:value={noteText}
					placeholder="Add coaching notes, strategy, or observations about this match..."
					class="w-full px-4 py-3 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-50 placeholder:text-charcoal-400 focus:border-gold-500 focus:outline-none resize-none min-h-[120px]"
					rows={5}
				></textarea>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={handleSaveNote}
						class="px-4 py-2 rounded-lg bg-gold-500 text-charcoal-950 font-medium hover:bg-gold-400 transition-colors min-h-[44px]"
					>
						Save Note
					</button>
					{#if hasNote}
						<button
							type="button"
							onclick={handleDeleteNote}
							class="px-4 py-2 rounded-lg bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors min-h-[44px]"
						>
							Delete
						</button>
					{/if}
					<button
						type="button"
						onclick={() => { isEditingNote = false; noteText = currentNote; }}
						class="px-4 py-2 rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors min-h-[44px]"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-2">
				{#if hasNote}
					<div class="px-4 py-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
						<div class="text-sm text-charcoal-50 whitespace-pre-wrap">{currentNote}</div>
					</div>
					<button
						type="button"
						onclick={handleStartEditing}
						class="w-full px-4 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px] flex items-center justify-center gap-2"
					>
						<FileText size={16} />
						<span>Edit Note</span>
					</button>
				{:else}
					<button
						type="button"
						onclick={handleStartEditing}
						class="w-full px-4 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px] flex items-center justify-center gap-2"
					>
						<FileText size={16} />
						<span>Add Note</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>
	
	<!-- Work Assignment Notice -->
	{#if match.InvolvedTeam === 'work'}
		<div class="px-4 py-3 rounded-lg border border-blue-500 bg-blue-500/10">
			<div class="flex items-start gap-2">
				<AlertCircle size={18} class="text-blue-400 flex-shrink-0 mt-0.5" />
				<div class="flex-1">
					<div class="text-sm font-medium text-blue-400 mb-1">Work Assignment</div>
					<div class="text-xs text-charcoal-300">
						This is a work assignment for your team.
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

