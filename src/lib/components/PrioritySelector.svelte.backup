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

<div class="bg-[#3b3c48] border border-[#454654] rounded-lg p-2 shadow-lg min-w-[160px]">
	<div class="text-xs font-medium text-[#9fa2ab] uppercase tracking-wider mb-2 px-1">
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
				class="w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 {isSelected ? 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50' : isHovered ? 'bg-[#454654] text-[#f8f8f9]' : 'text-[#c0c2c8] hover:bg-[#454654]'}"
			>
				<span>{option.icon}</span>
				<span>{option.label}</span>
			</button>
		{/each}
	</div>
</div>

