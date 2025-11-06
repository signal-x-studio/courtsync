<!-- Reference: https://svelte.dev/docs/svelte/what-are-runes -->
<!-- Purpose: Reusable share button component with Web Share API support -->
<!-- Note: Shows appropriate feedback based on share method (shared/copied) -->

<script lang="ts">
	import { share, canShare } from '$lib/utils/share';
	import { trackShare } from '$lib/utils/analytics';

	interface Props {
		shareData: { title?: string; text: string; url?: string };
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		label?: string;
		contentType?: 'match' | 'team' | 'coverage';
	}

	let { shareData, variant = 'secondary', size = 'md', label = 'Share', contentType }: Props = $props();

	let status = $state<'idle' | 'sharing' | 'success' | 'error'>('idle');
	let feedbackMessage = $state('');

	const buttonClass = $derived(() => {
		const baseClasses = 'inline-flex items-center gap-2 font-medium transition-all rounded-lg';

		const variantClasses = {
			primary: 'bg-court-gold text-court-dark hover:bg-court-gold/90',
			secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600',
			ghost: 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
		};

		const sizeClasses = {
			sm: 'px-3 py-1.5 text-sm',
			md: 'px-4 py-2 text-sm',
			lg: 'px-6 py-3 text-base'
		};

		const statusClasses = {
			idle: '',
			sharing: 'opacity-75 cursor-wait',
			success: 'bg-green-600 text-white',
			error: 'bg-red-600 text-white'
		};

		return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${statusClasses[status]}`;
	});

	async function handleShare() {
		if (status === 'sharing') return;

		status = 'sharing';

		const result = await share(shareData);

		if (result === 'shared') {
			feedbackMessage = 'Shared!';
			status = 'success';
			// Track analytics
			if (contentType) {
				trackShare(contentType, 'share');
			}
		} else if (result === 'copied') {
			feedbackMessage = 'Copied to clipboard!';
			status = 'success';
			// Track analytics
			if (contentType) {
				trackShare(contentType, 'copy');
			}
		} else {
			feedbackMessage = 'Unable to share';
			status = 'error';
		}

		// Reset after 2 seconds
		setTimeout(() => {
			status = 'idle';
			feedbackMessage = '';
		}, 2000);
	}

	let buttonLabel = $derived(() => {
		if (status === 'success') return feedbackMessage;
		if (status === 'error') return feedbackMessage;
		if (status === 'sharing') return 'Sharing...';
		return label;
	});

	let shareIcon = $derived(canShare());
</script>

<button
	onclick={handleShare}
	class={buttonClass()}
	disabled={status === 'sharing'}
	aria-label={label}
>
	{#if status === 'success'}
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
		</svg>
	{:else if status === 'error'}
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	{:else if shareIcon}
		<!-- iOS/Web Share icon -->
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
			/>
		</svg>
	{:else}
		<!-- Clipboard icon -->
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
			/>
		</svg>
	{/if}
	<span>{buttonLabel()}</span>
</button>
