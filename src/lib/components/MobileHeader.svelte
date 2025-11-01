<script lang="ts">
	import { Bell, UserCircle } from 'lucide-svelte';

	export let eventName: string | null = null;
</script>

<header
	class="sticky top-0 z-40 border-b border-charcoal-700 bg-charcoal-950"
	style="backdrop-filter: blur(20px); background-color: rgba(37, 37, 41, 0.95);"
>
	<div class="px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<!-- Logo/Brand Area -->
			<div class="flex items-center gap-2 flex-shrink-0">
				<div class="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
					<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M8 2v4"/>
						<path d="M16 2v4"/>
						<rect x="3" y="4" width="18" height="18" rx="2"/>
						<path d="M3 10h18"/>
						<circle cx="8" cy="15" r="1"/>
						<circle cx="12" cy="15" r="1"/>
						<circle cx="16" cy="15" r="1"/>
					</svg>
				</div>
			</div>

			<!-- Event Info / Page Title -->
			<div class="flex-1 min-w-0">
				<h1 class="text-base font-bold truncate text-charcoal-50">
					{eventName || 'Match Schedule'}
				</h1>
			</div>

			<!-- Right Actions -->
			<div class="flex items-center gap-2 flex-shrink-0">
				<!-- Notifications -->
				<button
					type="button"
					class="w-9 h-9 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors min-h-[36px] min-w-[36px]"
					aria-label="Notifications"
				>
					<Bell size={18} />
				</button>

				<!-- Profile -->
				<button
					type="button"
					class="w-9 h-9 flex items-center justify-center rounded-full bg-charcoal-700 text-charcoal-300 hover:bg-charcoal-600 hover:text-charcoal-50 transition-colors min-h-[36px] min-w-[36px]"
					aria-label="User profile"
				>
					<UserCircle size={18} />
				</button>
			</div>
		</div>
	</div>
</header>

