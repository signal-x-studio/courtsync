<script lang="ts">
	import type { CoverageStatus } from '$lib/stores/coverageStatus';
	
	export let teamId: string;
	export let currentStatus: CoverageStatus;
	export let onStatusChange: (teamId: string, status: CoverageStatus) => void;
	export let onClose: (() => void) | undefined = undefined;
	
	let hoveredStatus: CoverageStatus | null = null;
	
	const statusOptions: Array<{ value: CoverageStatus; label: string; color: string; icon: string }> = [
		{ value: 'not-covered', label: 'Not Covered', color: '#9fa2ab', icon: '○' },
		{ value: 'covered', label: 'Covered', color: '#10b981', icon: '✓' },
		{ value: 'partially-covered', label: 'Partially Covered', color: '#f59e0b', icon: '◐' },
		{ value: 'planned', label: 'Planned', color: '#eab308', icon: '📋' },
	];
	
	function handleStatusClick(status: CoverageStatus) {
		onStatusChange(teamId, status);
		if (onClose) {
			onClose();
		}
	}
</script>

<div class="bg-[#3b3c48] border border-[#454654] rounded-lg p-2 shadow-lg min-w-[180px]">
	<div class="text-xs font-medium text-[#9fa2ab] uppercase tracking-wider mb-2 px-1">
		Coverage Status
	</div>
	<div class="text-xs text-[#c0c2c8] mb-2 px-1">
		Team {teamId}
	</div>
	<div class="space-y-1">
		{#each statusOptions as option}
			{@const isSelected = currentStatus === option.value}
			{@const isHovered = hoveredStatus === option.value}
			<button
				onclick={() => handleStatusClick(option.value)}
				onmouseenter={() => hoveredStatus = option.value}
				onmouseleave={() => hoveredStatus = null}
				class="w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 {isSelected ? (option.value === 'covered' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : option.value === 'planned' ? 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50' : option.value === 'partially-covered' ? 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/50' : 'bg-[#454654] text-[#9fa2ab] border border-[#525463]') : isHovered ? 'bg-[#454654] text-[#f8f8f9]' : 'text-[#c0c2c8] hover:bg-[#454654]'}"
			>
				<span>{option.icon}</span>
				<span>{option.label}</span>
			</button>
		{/each}
	</div>
</div>

