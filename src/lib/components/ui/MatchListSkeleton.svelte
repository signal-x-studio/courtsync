<!-- Purpose: Loading skeleton for match list -->
<!-- Note: Shows multiple match card skeletons -->

<script lang="ts">
	import MatchCardSkeleton from './MatchCardSkeleton.svelte';

	interface Props {
		count?: number;
	}

	let { count = 6 }: Props = $props();
</script>

<div class="space-y-4">
	<!-- Time block skeleton -->
	<div class="bg-(--subtle) border border-default rounded-lg">
		<div class="flex items-center justify-between p-4 bg-(--bg) border-b border-default">
			<div class="h-6 bg-(--subtle) rounded w-32 animate-pulse"></div>
			<div class="h-5 bg-(--subtle) rounded w-20 animate-pulse"></div>
		</div>
		<div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Array(count) as _, i (i)}
				<MatchCardSkeleton />
			{/each}
		</div>
	</div>
</div>
