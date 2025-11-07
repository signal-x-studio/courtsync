<!-- Purpose: Loading skeleton for match cards -->
<!-- Note: Shows animated placeholder while data loads -->

<div
	class="match-card bg-court-charcoal rounded-lg p-4 border-2 border-gray-700 animate-pulse"
	aria-label="Loading match..."
>
	<!-- Header with time and court -->
	<div class="flex justify-between items-start mb-2">
		<div class="h-4 bg-gray-700 rounded w-32"></div>
		<div class="h-6 bg-gray-700 rounded w-20"></div>
	</div>

	<!-- Teams -->
	<div class="space-y-1">
		<div class="flex items-center gap-2">
			<div class="h-5 w-5 bg-gray-700 rounded"></div>
			<div class="h-5 bg-gray-700 rounded w-48"></div>
		</div>
		<div class="h-4 bg-gray-700 rounded w-8 mx-auto"></div>
		<div class="flex items-center gap-2">
			<div class="h-5 w-5 bg-gray-700 rounded"></div>
			<div class="h-5 bg-gray-700 rounded w-48"></div>
		</div>
	</div>

	<!-- Division -->
	<div class="mt-2">
		<div class="h-3 bg-gray-700 rounded w-24"></div>
	</div>
</div>
