<script lang="ts">
	import type { Priority } from '$lib/stores/priority';
	
	export let matchId: number;
	export let currentPriority: Priority;
	export let onPriorityChange: (matchId: number, priority: Priority) => void;
	export let onClose: (() => void) | undefined = undefined;
	
	let hoveredPriority: Priority | null = null;
	
	const priorityOptions: Array<{ value: Priority; label: string; color: string; icon: string }> = [
		{ value: 'must-cover', label: 'Must Cover', color: '#eab308', icon: '⭐' },
		{ value: 'priority', label: 'Priority', color: '#f59e0b', icon: '🔸' },
		{ value: 'optional', label: 'Optional', color: '#9fa2ab', icon: '○' },
		{ value: null, label: 'Clear', color: '#9fa2ab', icon: '✕' },
	];
	
	function handlePriorityClick(priority: Priority) {
		onPriorityChange(matchId, priority);
		if (onClose) {
			onClose();
		}
	}
</script>

<div class="bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 shadow-lg min-w-[160px]">
	<div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2 px-1">
		Set Priority
	</div>
	<div class="space-y-1">
		{#each priorityOptions as option}
			{@const isSelected = currentPriority === option.value}
			{@const isHovered = hoveredPriority === option.value}
			<button
				onclick={() => handlePriorityClick(option.value)}
				onmouseenter={() => hoveredPriority = option.value}
				onmouseleave={() => hoveredPriority = null}
				class="w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 {isSelected ? 'bg-gold-500/20 text-[#facc15] border border-[#eab308]/50' : isHovered ? 'bg-charcoal-700 text-charcoal-50' : 'text-charcoal-200 hover:bg-charcoal-700'}"
			>
				<span>{option.icon}</span>
				<span>{option.label}</span>
			</button>
		{/each}
	</div>
</div>

