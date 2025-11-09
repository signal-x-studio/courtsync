<!--
  Purpose: Authentication modal for sign in/sign up
  Note: Optional user accounts - anonymous mode still available
-->

<script lang="ts">
	import { auth } from '$lib/stores/auth';

	interface Props {
		show: boolean;
		onClose: () => void;
	}

	let { show, onClose }: Props = $props();

	let mode = $state<'signin' | 'signup' | 'reset'>('signin');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');

	async function handleSubmit() {
		error = '';
		successMessage = '';

		// Validation
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		if (mode === 'signup' && password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6 && mode !== 'reset') {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;

		if (mode === 'signin') {
			const result = await auth.signIn(email, password);
			if (result.success) {
				successMessage = 'Signed in successfully!';
				setTimeout(() => onClose(), 1000);
			} else {
				error = result.error || 'Sign in failed';
			}
		} else if (mode === 'signup') {
			const result = await auth.signUp(email, password);
			if (result.success) {
				successMessage = 'Account created! Please check your email to verify.';
				setTimeout(() => onClose(), 2000);
			} else {
				error = result.error || 'Sign up failed';
			}
		} else if (mode === 'reset') {
			const result = await auth.resetPassword(email);
			if (result.success) {
				successMessage = 'Password reset email sent! Check your inbox.';
				setTimeout(() => {
					mode = 'signin';
					successMessage = '';
				}, 2000);
			} else {
				error = result.error || 'Password reset failed';
			}
		}

		loading = false;
	}

	async function handleGoogleSignIn() {
		error = '';
		loading = true;

		const result = await auth.signInWithGoogle();
		if (!result.success) {
			error = result.error || 'Google sign in failed';
			loading = false;
		}
		// If successful, it will redirect
	}

	function switchMode(newMode: typeof mode) {
		mode = newMode;
		error = '';
		successMessage = '';
	}
</script>

{#if show}
	<div
		class="auth-modal fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
	>
		<div
			class="w-full max-w-md rounded-lg border border-court-gold/30 bg-(--subtle) p-6 shadow-xl"
		>
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-primary-600 dark:text-primary-400">
					{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
				</h2>
				<button
					onclick={onClose}
					class="text-muted transition-colors hover:text-(--fg)"
					aria-label="Close"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<div class="space-y-4">
					<!-- Email -->
					<div>
						<label for="email" class="mb-1 block text-sm font-medium text-(--fg)">
							Email
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							class="w-full rounded-lg border border-default bg-(--bg) px-4 py-2 text-white placeholder-gray-500 focus:border-court-gold focus:outline-none"
							required
						/>
					</div>

					<!-- Password -->
					{#if mode !== 'reset'}
						<div>
							<label for="password" class="mb-1 block text-sm font-medium text-(--fg)">
								Password
							</label>
							<input
								id="password"
								type="password"
								bind:value={password}
								placeholder="••••••••"
								class="w-full rounded-lg border border-default bg-(--bg) px-4 py-2 text-white placeholder-gray-500 focus:border-court-gold focus:outline-none"
								required
							/>
						</div>
					{/if}

					<!-- Confirm Password (Sign Up only) -->
					{#if mode === 'signup'}
						<div>
							<label for="confirm-password" class="mb-1 block text-sm font-medium text-(--fg)">
								Confirm Password
							</label>
							<input
								id="confirm-password"
								type="password"
								bind:value={confirmPassword}
								placeholder="••••••••"
								class="w-full rounded-lg border border-default bg-(--bg) px-4 py-2 text-white placeholder-gray-500 focus:border-court-gold focus:outline-none"
								required
							/>
						</div>
					{/if}

					<!-- Error Message -->
					{#if error}
						<div class="rounded border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-500">
							{error}
						</div>
					{/if}

					<!-- Success Message -->
					{#if successMessage}
						<div class="rounded border border-green-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-500">
							{successMessage}
						</div>
					{/if}

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-court-gold px-4 py-2 font-semibold text-(--fg) transition-colors hover:bg-court-gold/90 disabled:opacity-50"
					>
						{loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
					</button>

					<!-- Google Sign In (not for reset) -->
					{#if mode !== 'reset'}
						<button
							type="button"
							onclick={handleGoogleSignIn}
							disabled={loading}
							class="w-full rounded-lg border border-default px-4 py-2 font-medium text-(--fg) transition-colors hover:bg-(--subtle) disabled:opacity-50"
						>
							<span class="flex items-center justify-center gap-2">
								<svg class="h-5 w-5" viewBox="0 0 24 24">
									<path
										fill="currentColor"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="currentColor"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="currentColor"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="currentColor"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								Continue with Google
							</span>
						</button>
					{/if}
				</div>
			</form>

			<!-- Mode Switcher -->
			<div class="mt-6 text-center text-sm text-muted">
				{#if mode === 'signin'}
					<p>
						Don't have an account?
						<button
							onclick={() => switchMode('signup')}
							class="text-primary-600 dark:text-primary-400 hover:underline"
						>
							Sign up
						</button>
					</p>
					<button
						onclick={() => switchMode('reset')}
						class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
					>
						Forgot password?
					</button>
				{:else if mode === 'signup'}
					<p>
						Already have an account?
						<button
							onclick={() => switchMode('signin')}
							class="text-primary-600 dark:text-primary-400 hover:underline"
						>
							Sign in
						</button>
					</p>
				{:else}
					<button
						onclick={() => switchMode('signin')}
						class="text-primary-600 dark:text-primary-400 hover:underline"
					>
						Back to sign in
					</button>
				{/if}
			</div>

			<!-- Anonymous Mode Note -->
			<div class="mt-4 rounded border border-default bg-(--subtle)/50 p-3 text-xs text-muted">
				<strong>Note:</strong> Creating an account is optional. You can continue using CourtSync
				without an account, but your favorites and coverage plans will only be stored on this device.
			</div>
		</div>
	</div>
{/if}

<style>
	.auth-modal {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
