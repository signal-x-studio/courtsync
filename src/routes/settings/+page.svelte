<!-- Reference: https://svelte.dev/docs/svelte/$state -->
<!-- Purpose: Settings page for app configuration -->
<!-- Note: Allows persona switching and data management -->

<script lang="ts">
	import { persona } from '$lib/stores/persona';
	import { eventId, clubId } from '$lib/stores/event';
	import { coveragePlan } from '$lib/stores/coverage';
	import { favoriteTeams } from '$lib/stores/favorites';
	import { goto } from '$app/navigation';

	let showClearConfirm = $state(false);

	function setPersona(newPersona: 'media' | 'spectator') {
		persona.set(newPersona);
		showClearConfirm = false;
	}

	function clearAllData() {
		if (
			confirm(
				'Are you sure you want to clear all data? This will remove your coverage plan, favorite teams, and event selection.'
			)
		) {
			coveragePlan.clear();
			favoriteTeams.clear();
			eventId.set('');
			clubId.set(0);
			goto('/');
		}
	}

	function clearCoverageData() {
		if (
			confirm(
				`Are you sure you want to clear your coverage plan? This will remove all ${$coveragePlan.length} matches.`
			)
		) {
			coveragePlan.clear();
		}
	}

	function clearFavoritesData() {
		if (
			confirm(
				`Are you sure you want to clear your favorite teams? This will remove all ${$favoriteTeams.length} teams.`
			)
		) {
			favoriteTeams.clear();
		}
	}
</script>

<div class="max-w-2xl mx-auto p-4">
	<div class="mb-6">
		<button
			onclick={() => window.history.back()}
			class="text-primary-600 dark:text-primary-400 hover:underline mb-4 flex items-center gap-2"
		>
			← Back
		</button>
		<h2 class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">Settings</h2>
	</div>

	<div class="space-y-6">
		<!-- Persona Selection -->
		<div class="bg-(--subtle) border border-default rounded-lg p-6">
			<h3 class="text-lg font-semibold mb-4">User Persona</h3>
			<p class="text-sm text-muted mb-4">
				Choose your role to customize the app experience
			</p>

			<div class="space-y-3">
				<button
					onclick={() => setPersona('spectator')}
					class="w-full text-left px-4 py-4 rounded-lg border-2 transition-colors"
					class:border-court-gold={$persona === 'spectator'}
					class:bg-primary-500={$persona === 'spectator'}
					class:bg-opacity-10={$persona === 'spectator'}
					class:border-default={$persona !== 'spectator'}
				>
					<div class="flex items-center gap-3">
						<span class="text-2xl">👤</span>
						<div>
							<div class="font-semibold">Spectator</div>
							<div class="text-sm text-muted">
								Follow favorite teams, view live scores, track team schedules
							</div>
						</div>
						{#if $persona === 'spectator'}
							<span class="ml-auto text-primary-600 dark:text-primary-400">✓</span>
						{/if}
					</div>
				</button>

				<button
					onclick={() => setPersona('media')}
					class="w-full text-left px-4 py-4 rounded-lg border-2 transition-colors"
					class:border-court-gold={$persona === 'media'}
					class:bg-primary-500={$persona === 'media'}
					class:bg-opacity-10={$persona === 'media'}
					class:border-default={$persona !== 'media'}
				>
					<div class="flex items-center gap-3">
						<span class="text-2xl">📷</span>
						<div>
							<div class="font-semibold">Media / Photographer</div>
							<div class="text-sm text-muted">
								Plan coverage, detect conflicts, track team coverage statistics
							</div>
						</div>
						{#if $persona === 'media'}
							<span class="ml-auto text-primary-600 dark:text-primary-400">✓</span>
						{/if}
					</div>
				</button>
			</div>
		</div>

		<!-- Data Management -->
		<div class="bg-(--subtle) border border-default rounded-lg p-6">
			<h3 class="text-lg font-semibold mb-4">Data Management</h3>

			<div class="space-y-3">
				<!-- Coverage Plan -->
				{#if $coveragePlan.length > 0}
					<div class="flex justify-between items-center">
						<div>
							<div class="font-medium">Coverage Plan</div>
							<div class="text-sm text-muted">{$coveragePlan.length} matches</div>
						</div>
						<button
							onclick={clearCoverageData}
							class="px-4 py-2 bg-red-900 text-error-500 border border-red-700 rounded hover:bg-red-800 transition-colors"
						>
							Clear
						</button>
					</div>
				{/if}

				<!-- Favorite Teams -->
				{#if $favoriteTeams.length > 0}
					<div class="flex justify-between items-center">
						<div>
							<div class="font-medium">Favorite Teams</div>
							<div class="text-sm text-muted">{$favoriteTeams.length} teams</div>
						</div>
						<button
							onclick={clearFavoritesData}
							class="px-4 py-2 bg-red-900 text-error-500 border border-red-700 rounded hover:bg-red-800 transition-colors"
						>
							Clear
						</button>
					</div>
				{/if}

				<!-- Clear All -->
				<div class="pt-4 mt-4 border-t border-default">
					<button
						onclick={clearAllData}
						class="w-full px-4 py-3 bg-red-900 text-error-500 border border-red-700 rounded-lg hover:bg-red-800 transition-colors font-semibold"
					>
						Clear All Data & Reset App
					</button>
					<p class="text-xs text-muted mt-2 text-center">
						This will clear all your data and return you to the event selection page
					</p>
				</div>
			</div>
		</div>

		<!-- App Info -->
		<div class="bg-(--subtle) border border-default rounded-lg p-6">
			<h3 class="text-lg font-semibold mb-4">About</h3>
			<div class="text-sm text-muted space-y-2">
				<p><strong>CourtSync</strong> - Volleyball Tournament Scheduling</p>
				<p>Built with SvelteKit 2.0 and Svelte 5</p>
				{#if $eventId}
					<p class="pt-2 border-t border-default">Current Event: {$eventId}</p>
				{/if}
			</div>
		</div>
	</div>
</div>
