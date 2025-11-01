<script lang="ts">
	import { onMount } from 'svelte';
	import { userRole } from '$lib/stores/userRole';

	export let onComplete: () => void;

	let selectedRole: 'media' | 'spectator' | 'coach' | null = null;

	const roles = [
		{
			id: 'media' as const,
			icon: '📸',
			title: 'Photographer',
			description: 'Plan your tournament coverage and avoid scheduling conflicts',
			features: [
				'Track which teams need photos',
				'Avoid double-booking with conflict detection',
				'Export your coverage schedule'
			]
		},
		{
			id: 'spectator' as const,
			icon: '📊',
			title: 'Scorekeeper',
			description: 'Track scores for your favorite teams',
			features: [
				'Claim matches to keep score',
				'Follow teams you care about',
				'See live match updates'
			]
		},
		{
			id: 'coach' as const,
			icon: '📋',
			title: 'Coach',
			description: 'View your team\'s match schedule',
			features: [
				'See all your team\'s matches',
				'Check court assignments',
				'Track match times and locations'
			]
		}
	];

	function handleSelectRole(roleId: 'media' | 'spectator' | 'coach') {
		selectedRole = roleId;
	}

	function handleContinue() {
		if (selectedRole) {
			userRole.setRole(selectedRole);
			localStorage.setItem('courtSync_hasSeenOnboarding', 'true');
			onComplete();
		}
	}

	function handleSkip() {
		localStorage.setItem('courtSync_hasSeenOnboarding', 'true');
		onComplete();
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="onboarding-title"
>
	<!-- Modal Content -->
	<div class="bg-charcoal-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-charcoal-700 shadow-2xl">
		<!-- Header -->
		<div class="sticky top-0 bg-charcoal-900 border-b border-charcoal-700 px-6 py-4 z-10">
			<div class="flex items-center justify-between">
				<div>
					<h2 id="onboarding-title" class="text-2xl font-bold text-charcoal-50">
						Welcome to CourtSync
					</h2>
					<p class="text-sm text-charcoal-300 mt-1">
						Choose your role to get started with tournament scheduling
					</p>
				</div>
				<button
					type="button"
					onclick={handleSkip}
					class="text-charcoal-400 hover:text-charcoal-200 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-charcoal-800"
					aria-label="Skip onboarding"
				>
					Skip
				</button>
			</div>
		</div>

		<!-- Role Selection -->
		<div class="px-6 py-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				{#each roles as role}
					<button
						type="button"
						onclick={() => handleSelectRole(role.id)}
						class="group relative flex flex-col p-6 rounded-lg border-2 transition-all text-left {selectedRole === role.id ? 'border-gold-500 bg-gold-500/10' : 'border-charcoal-700 bg-charcoal-800'} {selectedRole !== role.id ? 'hover:border-charcoal-600 hover:bg-charcoal-900' : ''}"
						aria-pressed={selectedRole === role.id}
					>
						<!-- Selection Indicator -->
						{#if selectedRole === role.id}
							<div class="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
								<svg class="w-4 h-4 text-charcoal-950" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							</div>
						{/if}

						<!-- Icon -->
						<div class="text-4xl mb-3" role="img" aria-label={`${role.title} icon`}>
							{role.icon}
						</div>

						<!-- Title & Description -->
						<h3 class="text-lg font-semibold mb-2"
							class:text-gold-400={selectedRole === role.id}
							class:text-charcoal-50={selectedRole !== role.id}
						>
							{role.title}
						</h3>
						<p class="text-sm text-charcoal-300 mb-4">
							{role.description}
						</p>

						<!-- Features -->
						<ul class="space-y-2 text-xs text-charcoal-400">
							{#each role.features as feature}
								<li class="flex items-start gap-2">
									<svg class="w-4 h-4 mt-0.5 flex-shrink-0"
										class:text-gold-500={selectedRole === role.id}
										class:text-charcoal-600={selectedRole !== role.id}
										fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>{feature}</span>
								</li>
							{/each}
						</ul>
					</button>
				{/each}
			</div>

			<!-- Continue Button -->
			<div class="flex items-center justify-between pt-4 border-t border-charcoal-700">
				<p class="text-xs text-charcoal-400">
					You can change your role anytime from the settings menu
				</p>
				<button
					type="button"
					onclick={handleContinue}
					disabled={!selectedRole}
					class="px-6 py-3 rounded-lg font-medium transition-all min-h-[44px]"
					class:bg-gold-500={selectedRole}
					class:text-charcoal-950={selectedRole}
					class:hover:bg-gold-400={selectedRole}
					class:bg-charcoal-700={!selectedRole}
					class:text-charcoal-500={!selectedRole}
					class:cursor-not-allowed={!selectedRole}
					aria-label="Continue with selected role"
				>
					Continue
					{#if selectedRole}
						as {selectedRole === 'media' ? 'Photographer' : selectedRole === 'spectator' ? 'Scorekeeper' : 'Coach'}
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Ensure modal is above everything */
	div[role="dialog"] {
		z-index: 9999;
	}

	/* Smooth transitions */
	button {
		transition: all 0.2s ease;
	}
</style>
