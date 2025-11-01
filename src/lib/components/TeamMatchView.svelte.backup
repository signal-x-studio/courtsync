<script lang="ts">
	import type { FilteredMatch } from '$lib/types';
	import { formatMatchTime, formatMatchDate } from '$lib/utils/dateUtils';
	import { getTeamIdentifier } from '$lib/stores/filters';
	import { createMatchNotesStore } from '$lib/stores/matchNotes';
	
	export let matches: FilteredMatch[];
	export let teamId: string;
	export let teamName: string;
	export let eventId: string = '';
	
	const matchNotes = createMatchNotesStore(eventId);
	
	let editingMatchId: number | null = null;
	let noteText = '';
	
	// Filter matches for this team
	$: teamMatches = (() => {
		return matches.filter(match => {
			const matchTeamId = getTeamIdentifier(match);
			return matchTeamId === teamId;
		}).sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
	})();
	
	// Separate matches into past, current, and upcoming
	const now = Date.now();
	$: pastMatches = teamMatches.filter(m => m.ScheduledEndDateTime < now);
	$: currentMatches = teamMatches.filter(m => m.ScheduledStartDateTime <= now && m.ScheduledEndDateTime >= now);
	$: upcomingMatches = teamMatches.filter(m => m.ScheduledStartDateTime > now);
	
	// Get opponent for a match
	function getOpponent(match: FilteredMatch): string {
		if (match.InvolvedTeam === 'first') return match.SecondTeamText;
		if (match.InvolvedTeam === 'second') return match.FirstTeamText;
		return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
	}
	
	function handleStartEditing(matchId: number) {
		editingMatchId = matchId;
		noteText = matchNotes.getNote(matchId);
	}
	
	function handleSaveNote(matchId: number) {
		matchNotes.setNote(matchId, noteText);
		editingMatchId = null;
		noteText = '';
	}
	
	function handleCancelEditing() {
		editingMatchId = null;
		noteText = '';
	}
	
	function handleDeleteNote(matchId: number) {
		matchNotes.deleteNote(matchId);
		editingMatchId = null;
	}
</script>

<div class="space-y-6">
	<!-- Team Header -->
	<div class="border-b border-[#454654] pb-4">
		<h2 class="text-xl font-bold text-[#f8f8f9]">{teamName}</h2>
		<div class="text-sm text-[#9fa2ab] mt-1">
			{teamMatches.length} total match{teamMatches.length !== 1 ? 'es' : ''}
		</div>
	</div>

	<!-- Current Matches -->
	{#if currentMatches.length > 0}
		<div>
			<h3 class="text-sm font-semibold text-[#facc15] mb-3 uppercase tracking-wider">
				Live Now
			</h3>
			<div class="space-y-2">
				{#each currentMatches as match}
					{@const hasNote = matchNotes.hasNote(match.MatchId)}
					{@const isEditing = editingMatchId === match.MatchId}
					{@const note = matchNotes.getNote(match.MatchId)}
					
					<div class="px-4 py-3 rounded-lg border-2 border-[#eab308] bg-[#eab308]/10 transition-colors">
						<div class="flex items-start justify-between mb-2">
							<div class="flex-1">
								<div class="flex items-center justify-between mb-2">
									<div class="text-sm font-semibold text-[#f8f8f9]">
										{formatMatchTime(match.ScheduledStartDateTime)}
									</div>
									<div class="text-xs font-medium text-[#facc15]">
										{match.CourtName}
									</div>
								</div>
								<div class="text-base font-bold text-[#f8f8f9]">
									vs {getOpponent(match)}
								</div>
								<div class="text-xs text-[#9fa2ab] mt-1">
									{match.Division.CodeAlias}
								</div>
							</div>
							
							<!-- Notes Button -->
							<button
								onclick={() => isEditing ? handleCancelEditing() : handleStartEditing(match.MatchId)}
								class="ml-2 px-2 py-1 text-xs rounded transition-colors flex-shrink-0 {hasNote || isEditing ? 'bg-[#eab308] text-[#18181b] hover:bg-[#facc15]' : 'bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border border-[#525463]'}"
								title={hasNote ? 'Edit note' : 'Add note'}
							>
								{hasNote ? '📝' : '📄'}
							</button>
						</div>

						<!-- Note Display/Edit -->
						{#if isEditing}
							<div class="mt-3 pt-3 border-t border-[#454654]">
								<textarea
									bind:value={noteText}
									placeholder="Add notes about this match..."
									class="w-full px-3 py-2 text-sm bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] focus:border-[#eab308] focus:outline-none resize-none"
									rows={3}
									autofocus
								/>
								<div class="flex items-center gap-2 mt-2">
									<button
										onclick={() => handleSaveNote(match.MatchId)}
										class="px-3 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
									>
										Save
									</button>
									{#if hasNote}
										<button
											onclick={() => handleDeleteNote(match.MatchId)}
											class="px-3 py-1 text-xs font-medium rounded bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
										>
											Delete
										</button>
									{/if}
									<button
										onclick={handleCancelEditing}
										class="px-3 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
									>
										Cancel
									</button>
								</div>
							</div>
						{:else if hasNote}
							<div class="mt-3 pt-3 border-t border-[#454654]">
								<div class="text-xs text-[#9fa2ab] mb-1">Note:</div>
								<div class="text-sm text-[#c0c2c8] whitespace-pre-wrap">{note}</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Upcoming Matches -->
	{#if upcomingMatches.length > 0}
		<div>
			<h3 class="text-sm font-semibold text-[#f8f8f9] mb-3 uppercase tracking-wider">
				Upcoming Matches
			</h3>
			<div class="space-y-2">
				{#each upcomingMatches as match}
					{@const hasNote = matchNotes.hasNote(match.MatchId)}
					{@const isEditing = editingMatchId === match.MatchId}
					{@const note = matchNotes.getNote(match.MatchId)}
					
					<div class="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48] hover:border-[#525463] transition-colors">
						<div class="flex items-start justify-between mb-2">
							<div class="flex-1">
								<div class="flex items-center justify-between mb-2">
									<div class="text-sm font-semibold text-[#f8f8f9]">
										{formatMatchTime(match.ScheduledStartDateTime)}
									</div>
									<div class="text-xs font-medium text-[#facc15]">
										{match.CourtName}
									</div>
								</div>
								<div class="text-base font-bold text-[#f8f8f9]">
									vs {getOpponent(match)}
								</div>
								<div class="text-xs text-[#9fa2ab] mt-1">
									{match.Division.CodeAlias}
								</div>
							</div>
							
							<!-- Notes Button -->
							<button
								onclick={() => isEditing ? handleCancelEditing() : handleStartEditing(match.MatchId)}
								class="ml-2 px-2 py-1 text-xs rounded transition-colors flex-shrink-0 {hasNote || isEditing ? 'bg-[#eab308] text-[#18181b] hover:bg-[#facc15]' : 'bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border border-[#525463]'}"
								title={hasNote ? 'Edit note' : 'Add note'}
							>
								{hasNote ? '📝' : '📄'}
							</button>
						</div>

						<!-- Note Display/Edit -->
						{#if isEditing}
							<div class="mt-3 pt-3 border-t border-[#454654]">
								<textarea
									bind:value={noteText}
									placeholder="Add notes about this match..."
									class="w-full px-3 py-2 text-sm bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] focus:border-[#eab308] focus:outline-none resize-none"
									rows={3}
									autofocus
								/>
								<div class="flex items-center gap-2 mt-2">
									<button
										onclick={() => handleSaveNote(match.MatchId)}
										class="px-3 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
									>
										Save
									</button>
									{#if hasNote}
										<button
											onclick={() => handleDeleteNote(match.MatchId)}
											class="px-3 py-1 text-xs font-medium rounded bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
										>
											Delete
										</button>
									{/if}
									<button
										onclick={handleCancelEditing}
										class="px-3 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
									>
										Cancel
									</button>
								</div>
							</div>
						{:else if hasNote}
							<div class="mt-3 pt-3 border-t border-[#454654]">
								<div class="text-xs text-[#9fa2ab] mb-1">Note:</div>
								<div class="text-sm text-[#c0c2c8] whitespace-pre-wrap">{note}</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Past Matches -->
	{#if pastMatches.length > 0}
		<div>
			<h3 class="text-sm font-semibold text-[#9fa2ab] mb-3 uppercase tracking-wider">
				Match History
			</h3>
			<div class="space-y-2">
				{#each pastMatches as match}
					{@const hasNote = matchNotes.hasNote(match.MatchId)}
					{@const isEditing = editingMatchId === match.MatchId}
					{@const note = matchNotes.getNote(match.MatchId)}
					
					<div class="px-4 py-3 rounded-lg border border-[#454654] bg-[#3b3c48]/50 opacity-75 transition-colors">
						<div class="flex items-start justify-between mb-2">
							<div class="flex-1">
								<div class="flex items-center justify-between mb-2">
									<div class="text-xs font-semibold text-[#f8f8f9]">
										{formatMatchDate(match.ScheduledStartDateTime)} • {formatMatchTime(match.ScheduledStartDateTime)}
									</div>
									<div class="text-xs font-medium text-[#facc15]">
										{match.CourtName}
									</div>
								</div>
								<div class="text-sm font-bold text-[#f8f8f9]">
									vs {getOpponent(match)}
								</div>
								<div class="text-xs text-[#9fa2ab] mt-1">
									{match.Division.CodeAlias}
								</div>
							</div>
							
							<!-- Notes Button -->
							<button
								onclick={() => isEditing ? handleCancelEditing() : handleStartEditing(match.MatchId)}
								class="ml-2 px-2 py-1 text-xs rounded transition-colors flex-shrink-0 {hasNote || isEditing ? 'bg-[#eab308] text-[#18181b] hover:bg-[#facc15]' : 'bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border border-[#525463]'}"
								title={hasNote ? 'Edit note' : 'Add note'}
							>
								{hasNote ? '📝' : '📄'}
							</button>
						</div>

						<!-- Note Display/Edit -->
						{#if isEditing}
							<div class="mt-3 pt-3 border-t border-[#454654]">
								<textarea
									bind:value={noteText}
									placeholder="Add notes about this match..."
									class="w-full px-3 py-2 text-sm bg-[#454654] border border-[#525463] rounded text-[#c0c2c8] focus:border-[#eab308] focus:outline-none resize-none"
									rows={3}
									autofocus
								/>
								<div class="flex items-center gap-2 mt-2">
									<button
										onclick={() => handleSaveNote(match.MatchId)}
										class="px-3 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
									>
										Save
									</button>
									{#if hasNote}
										<button
											onclick={() => handleDeleteNote(match.MatchId)}
											class="px-3 py-1 text-xs font-medium rounded bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-950/70 transition-colors"
										>
											Delete
										</button>
									{/if}
									<button
										onclick={handleCancelEditing}
										class="px-3 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors"
									>
										Cancel
									</button>
								</div>
							</div>
						{:else if hasNote}
							<div class="mt-3 pt-3 border-t border-[#454654]">
								<div class="text-xs text-[#9fa2ab] mb-1">Note:</div>
								<div class="text-sm text-[#c0c2c8] whitespace-pre-wrap">{note}</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if teamMatches.length === 0}
		<div class="text-center py-12 text-[#9fa2ab] text-sm">
			No matches found for {teamName}
		</div>
	{/if}
</div>

