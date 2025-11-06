<!--
  Purpose: User menu dropdown showing profile and sign out
  Note: Shows when user is authenticated
-->

<script lang="ts">
	import { auth } from '$lib/stores/auth';

	interface Props {
		onSignInClick: () => void;
	}

	let { onSignInClick }: Props = $props();

	let showMenu = $state(false);
	let authState = $state($auth);

	$effect(() => {
		authState = $auth;
	});

	async function handleSignOut() {
		showMenu = false;
		await auth.signOut();
	}

	// Get user initials for avatar
	let userInitials = $derived(() => {
		if (!authState.user?.email) return '?';
		return authState.user.email.charAt(0).toUpperCase();
	});
</script>

<div class="user-menu relative">
	{#if authState.user}
		<!-- User Avatar Button -->
		<button
			onclick={() => (showMenu = !showMenu)}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-court-gold text-court-dark font-semibold transition-transform hover:scale-110"
			aria-label="User menu"
		>
			{userInitials()}
		</button>

		<!-- Dropdown Menu -->
		{#if showMenu}
			<div
				class="absolute right-0 top-12 z-50 w-64 rounded-lg border border-court-gold/30 bg-court-charcoal shadow-xl"
			>
				<!-- User Info -->
				<div class="border-b border-gray-700 px-4 py-3">
					<p class="text-sm font-medium text-gray-300">Signed in as</p>
					<p class="truncate text-sm text-court-gold">{authState.user.email}</p>
				</div>

				<!-- Menu Items -->
				<div class="py-2">
					<button
						onclick={handleSignOut}
						class="w-full px-4 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800"
					>
						Sign Out
					</button>
				</div>

				<!-- Sync Info -->
				<div class="border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
					Your favorites and coverage plans are syncing across devices
				</div>
			</div>
		{/if}
	{:else if !authState.loading}
		<!-- Sign In Button -->
		<button
			onclick={onSignInClick}
			class="rounded-lg bg-court-gold px-4 py-2 text-sm font-semibold text-court-dark transition-colors hover:bg-court-gold/90"
		>
			Sign In
		</button>
	{/if}
</div>

<!-- Click outside to close -->
{#if showMenu}
	<button
		class="fixed inset-0 z-40"
		onclick={() => (showMenu = false)}
		aria-label="Close menu"
	></button>
{/if}

<style>
	.user-menu {
		/* Ensure dropdown is above other elements */
	}
</style>
