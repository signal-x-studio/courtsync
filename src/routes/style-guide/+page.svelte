<script lang="ts">

	// Color tokens organized by category
	const colorTokens = {
		charcoal: [
			{ name: 'charcoal-50', value: '#f8f8f9', usage: 'Lightest neutral' },
			{ name: 'charcoal-100', value: '#e4e4e7', usage: 'Light backgrounds' },
			{ name: 'charcoal-200', value: '#c0c2c8', usage: 'Borders, dividers' },
			{ name: 'charcoal-300', value: '#9fa2ab', usage: 'Secondary text' },
			{ name: 'charcoal-400', value: '#808593', usage: 'Muted text' },
			{ name: 'charcoal-500', value: '#6b6d7a', usage: 'Tertiary text' },
			{ name: 'charcoal-600', value: '#525463', usage: 'Dark UI elements' },
			{ name: 'charcoal-700', value: '#454654', usage: 'Card borders' },
			{ name: 'charcoal-800', value: '#3b3c48', usage: 'Cards, surfaces' },
			{ name: 'charcoal-900', value: '#2a2b35', usage: 'Dark surfaces' },
			{ name: 'charcoal-950', value: '#18181b', usage: 'Page background' }
		],
		brand: [
			{ name: 'brand-50', value: '#f0f4ff', usage: 'Lightest blue' },
			{ name: 'brand-100', value: '#e0e9ff', usage: 'Light blue background' },
			{ name: 'brand-200', value: '#c7d6fe', usage: 'Blue accent subtle' },
			{ name: 'brand-300', value: '#a5b8fc', usage: 'Blue decorative' },
			{ name: 'brand-400', value: '#818cf8', usage: 'Blue hover' },
			{ name: 'brand-500', value: '#5b7cff', usage: 'PRIMARY ACTION' },
			{ name: 'brand-600', value: '#4b65d6', usage: 'Action hover' },
			{ name: 'brand-700', value: '#3b4fb8', usage: 'Action active' },
			{ name: 'brand-800', value: '#2e3d8f', usage: 'Dark blue' },
			{ name: 'brand-900', value: '#1e3a8a', usage: 'Darkest blue' }
		],
		gold: [
			{ name: 'gold-50', value: '#fefce8', usage: 'Lightest gold' },
			{ name: 'gold-100', value: '#fef9c3', usage: 'Gold subtle bg' },
			{ name: 'gold-200', value: '#fef08a', usage: 'Gold light' },
			{ name: 'gold-300', value: '#fde047', usage: 'Gold decorative' },
			{ name: 'gold-400', value: '#facc15', usage: 'Gold hover' },
			{ name: 'gold-500', value: '#eab308', usage: 'SELECTION ONLY' },
			{ name: 'gold-600', value: '#ca8a04', usage: 'Selection hover' },
			{ name: 'gold-700', value: '#a16207', usage: 'Selection active' },
			{ name: 'gold-800', value: '#854d0e', usage: 'Dark gold' },
			{ name: 'gold-900', value: '#713f12', usage: 'Darkest gold' }
		],
		semantic: [
			{ name: 'success-light', value: '#10b981', usage: 'Covered teams, success' },
			{ name: 'warning-light', value: '#f59e0b', usage: 'Conflicts, warnings' },
			{ name: 'error-light', value: '#ef4444', usage: 'Errors, destructive' },
			{ name: 'info-light', value: '#3b82f6', usage: 'Info, secondary actions' }
		]
	};

	// Typography scale
	const typographyScale = [
		{ name: 'text-xs', size: '0.75rem (12px)', usage: 'Metadata, utility labels' },
		{ name: 'text-sm', size: '0.875rem (14px)', usage: 'Body text, inputs' },
		{ name: 'text-base', size: '1rem (16px)', usage: 'Content' },
		{ name: 'text-lg', size: '1.125rem (18px)', usage: 'Subheadings' },
		{ name: 'text-xl', size: '1.25rem (20px)', usage: 'Page titles' },
		{ name: 'text-2xl', size: '1.5rem (24px)', usage: 'Display text' }
	];

	// Spacing scale
	const spacingScale = [
		{ name: 'spacing-1', value: '0.25rem', pixels: '4px' },
		{ name: 'spacing-2', value: '0.5rem', pixels: '8px' },
		{ name: 'spacing-3', value: '0.75rem', pixels: '12px' },
		{ name: 'spacing-4', value: '1rem', pixels: '16px' },
		{ name: 'spacing-6', value: '1.5rem', pixels: '24px' },
		{ name: 'spacing-8', value: '2rem', pixels: '32px' }
	];

	function dummyHandler() {
		console.log('Button clicked');
	}
</script>

<svelte:head>
	<title>Style Guide - CourSync</title>
</svelte:head>

<!-- Minimal Page Header -->
<header class="sticky top-0 z-20 border-b" style="background-color: rgba(37, 37, 41, 0.95); backdrop-filter: blur(20px); border-color: var(--color-border-default);">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<h1 class="text-xl lg:text-2xl font-bold" style="color: var(--color-text-primary);">Style Guide</h1>
				<span class="text-xs" style="color: var(--color-text-tertiary);">Design System v2.0.0</span>
			</div>
			<a href="/" class="text-xs hover:underline transition-colors" style="color: var(--color-brand-500);">
				← Back to App
			</a>
		</div>
	</div>
</header>

<!-- Main Content -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">

	<!-- Introduction -->
	<section>
		<h2 class="text-2xl mb-4 font-semibold" style="color: var(--color-text-primary);">Welcome to the CourSync Style Guide</h2>
		<p class="mb-6 max-w-3xl leading-relaxed" style="color: var(--color-text-secondary);">
			This page demonstrates the design tokens, component patterns, and core principles that power
			CourSync. Every element shown here is built using production code, ensuring this documentation
			always stays in sync with the live application.
		</p>
		<div class="p-6 rounded-lg border" style="background-color: var(--color-bg-secondary); border-color: var(--color-border-emphasis);">
			<h3 class="text-lg mb-3 font-semibold" style="color: var(--color-brand-400);">Core Philosophy: Data-Dense Cockpit UI</h3>
			<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
				"CourSync is a cockpit, not a brochure. Every pixel must serve rapid scanning, conflict detection, and coverage planning.
				Data density is power. Semantic colors reduce cognitive load."
			</p>
		</div>
	</section>

	<!-- 1. Color System -->
	<section>
		<h2 class="text-2xl mb-6 border-b pb-3 font-semibold" style="color: var(--color-text-primary); border-color: var(--color-border-default);">
			1. Color System
		</h2>

		<!-- Charcoal (Neutral) -->
		<div class="mb-8">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Charcoal (Neutral Palette)</h3>
			<p class="text-xs mb-4" style="color: var(--color-text-tertiary);">Foundation grayscale for structure, text hierarchy, and UI elements</p>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
				{#each colorTokens.charcoal as color}
					<div class="flex flex-col">
						<div class="h-20 rounded-lg border mb-2" style="background-color: {color.value}; border-color: var(--color-border-default);"></div>
						<span class="text-xs font-mono" style="color: var(--color-text-tertiary);">{color.name}</span>
						<span class="text-xs font-mono" style="color: var(--color-text-tertiary);">{color.value}</span>
						<span class="text-xs mt-1" style="color: var(--color-text-tertiary);">{color.usage}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Brand Blue -->
		<div class="mb-8">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Brand Blue (Primary Actions)</h3>
			<p class="text-xs mb-4" style="color: var(--color-text-tertiary);">
				Primary brand color for interactive elements: "Claim Match", primary buttons, links
			</p>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{#each colorTokens.brand as color}
					<div class="flex flex-col">
						<div class="h-20 rounded-lg border mb-2" style="background-color: {color.value}; border-color: var(--color-border-default);"></div>
						<span class="text-xs font-mono" style="color: var(--color-text-tertiary);">{color.name}</span>
						<span class="text-xs font-mono" style="color: var(--color-text-tertiary);">{color.value}</span>
						<span class="text-xs mt-1" style="color: var(--color-text-tertiary);">{color.usage}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Gold -->
		<div class="mb-8">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Gold (Selection & Highlights)</h3>
			<p class="text-xs mb-4 px-4 py-3 rounded-lg border" style="color: var(--color-warning-light); background-color: var(--color-warning-subtle); border-color: var(--color-warning-light);">
				<strong>⚠️ Important:</strong> Gold is ONLY for selection states, active tabs, and highlights. NOT for primary actions or warnings.
			</p>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{#each colorTokens.gold as color}
					<div class="flex flex-col">
						<div class="h-20 rounded-lg border mb-2" style="background-color: {color.value}; border-color: var(--color-border-default);"></div>
						<span class="text-xs font-mono" style="color: var(--color-text-tertiary);">{color.name}</span>
						<span class="text-xs font-mono" style="color: var(--color-text-tertiary);">{color.value}</span>
						<span class="text-xs mt-1" style="color: var(--color-text-tertiary);">{color.usage}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Semantic Colors -->
		<div>
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Semantic Colors (Status System)</h3>
			<p class="text-xs mb-4" style="color: var(--color-text-tertiary);">
				Each color has a specific meaning across the entire application. Consistent usage reduces cognitive load.
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each colorTokens.semantic as color}
					<div class="p-4 rounded-lg border" style="background-color: var(--color-bg-secondary); border-color: var(--color-border-default);">
						<div class="h-16 rounded-lg mb-3" style="background-color: {color.value};"></div>
						<span class="text-xs font-mono block" style="color: var(--color-text-tertiary);">{color.name}</span>
						<span class="text-xs font-mono block" style="color: var(--color-text-tertiary);">{color.value}</span>
						<span class="text-sm mt-2 block font-medium" style="color: var(--color-text-primary);">{color.usage}</span>
					</div>
				{/each}
			</div>

			<!-- Color Usage Examples -->
			<div class="mt-8 space-y-4">
				<h4 class="text-base font-semibold" style="color: var(--color-text-secondary);">Real-World Usage Examples</h4>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Before (Wrong) -->
					<div class="p-4 rounded-lg border" style="background-color: var(--color-bg-secondary); border-color: var(--color-error-light);">
						<div class="flex items-center gap-2 mb-3">
							<span class="text-red-400 font-mono text-xl">✗</span>
							<h5 class="text-sm font-semibold" style="color: var(--color-error-light);">❌ Before (Wrong)</h5>
						</div>
						<div class="space-y-2">
							<button class="px-3 py-2 text-sm font-medium rounded-lg" style="background-color: var(--color-gold-500); color: var(--color-charcoal-950);">
								Claim Match
							</button>
							<div class="flex items-center gap-2 text-sm">
								<span style="color: var(--color-gold-500);">⚠️</span>
								<span style="color: var(--color-gold-500);">Conflict detected</span>
							</div>
							<button class="px-3 py-2 text-sm font-medium rounded-lg" style="background-color: var(--color-gold-500); color: var(--color-charcoal-950);">
								Scores
							</button>
						</div>
						<p class="text-xs mt-3" style="color: var(--color-text-tertiary);">
							Gold doing too much: actions + warnings + selection = visual confusion
						</p>
					</div>

					<!-- After (Correct) -->
					<div class="p-4 rounded-lg border" style="background-color: var(--color-bg-secondary); border-color: var(--color-success-light);">
						<div class="flex items-center gap-2 mb-3">
							<span class="text-green-400 font-mono text-xl">✓</span>
							<h5 class="text-sm font-semibold" style="color: var(--color-success-light);">✅ After (Correct)</h5>
						</div>
						<div class="space-y-2">
							<button class="px-3 py-2 text-sm font-medium rounded-lg" style="background-color: var(--color-brand-500); color: white;">
								Claim Match
							</button>
							<div class="flex items-center gap-2 text-sm">
								<span style="color: var(--color-warning-light);">⚠️</span>
								<span style="color: var(--color-warning-light);">Conflict detected</span>
							</div>
							<button class="px-3 py-2 text-sm font-medium rounded-lg border" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary); border-color: var(--color-border-default);">
								Scores
							</button>
						</div>
						<p class="text-xs mt-3" style="color: var(--color-text-tertiary);">
							Semantic colors: blue=action, amber=warning, charcoal=secondary
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 2. Typography -->
	<section>
		<h2 class="text-2xl mb-6 border-b pb-3 font-semibold" style="color: var(--color-text-primary); border-color: var(--color-border-default);">
			2. Typography
		</h2>

		<!-- Typography Scale -->
		<div class="mb-8">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Typography Scale</h3>
			<div class="space-y-4">
				{#each typographyScale as type}
					<div class="flex items-baseline gap-6 p-4 rounded-lg" style="background-color: var(--color-bg-secondary); opacity: 0.5;">
						<span class="text-xs font-mono w-24 shrink-0" style="color: var(--color-text-tertiary);">
							{type.name}
						</span>
						<div class="flex-1">
							<p class={type.name}>The quick brown fox jumps over the lazy dog</p>
						</div>
						<div class="text-right shrink-0">
							<span class="text-xs block" style="color: var(--color-text-tertiary);">
								{type.size}
							</span>
							<span class="text-xs" style="color: var(--color-text-tertiary);">
								{type.usage}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Text Hierarchy -->
		<div class="mb-8">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Text Color Hierarchy</h3>
			<div class="space-y-4 p-6 rounded-lg" style="background-color: var(--color-bg-secondary);">
				<p class="text-base leading-relaxed" style="color: var(--color-text-primary);">
					<strong>Primary Text:</strong> Main content, headings, critical information. High contrast for readability.
				</p>
				<p class="text-base leading-relaxed" style="color: var(--color-text-secondary);">
					<strong>Secondary Text:</strong> Supporting information, metadata, descriptions. Medium contrast.
				</p>
				<p class="text-base leading-relaxed" style="color: var(--color-text-tertiary);">
					<strong>Tertiary Text:</strong> Subtle labels, timestamps, utility info. Low contrast, non-essential.
				</p>
			</div>
		</div>
	</section>

	<!-- 3. Component States -->
	<section>
		<h2 class="text-2xl mb-6 border-b pb-3 font-semibold" style="color: var(--color-text-primary); border-color: var(--color-border-default);">
			3. Component States
		</h2>

		<!-- Button States -->
		<div class="mb-12">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Button States</h3>

			<!-- Primary Buttons (Brand Blue) -->
			<div class="mb-8">
				<h4 class="text-base mb-4 font-medium" style="color: var(--color-text-secondary);">Primary Actions (Brand Blue)</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b" style="border-color: var(--color-border-default);">
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">State</th>
								<th class="py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">Visual</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">CSS</th>
							</tr>
						</thead>
						<tbody class="divide-y" style="border-color: var(--color-border-default);">
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Default</td>
								<td class="py-4 px-4">
									<button class="px-4 py-2 text-sm font-medium rounded-lg" style="background-color: var(--color-brand-500); color: white;">
										Claim Match
									</button>
								</td>
								<td class="py-4 px-4 text-xs font-mono" style="color: var(--color-text-tertiary);">
									bg-brand-500 text-white
								</td>
							</tr>
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Hover</td>
								<td class="py-4 px-4">
									<button class="px-4 py-2 text-sm font-medium rounded-lg" style="background-color: var(--color-brand-600); color: white;">
										Claim Match
									</button>
								</td>
								<td class="py-4 px-4 text-xs font-mono" style="color: var(--color-text-tertiary);">
									hover:bg-brand-600
								</td>
							</tr>
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Disabled</td>
								<td class="py-4 px-4">
									<button disabled class="px-4 py-2 text-sm font-medium rounded-lg cursor-not-allowed" style="background-color: rgba(91, 124, 255, 0.5); color: rgba(255, 255, 255, 0.5);">
										Claim Match
									</button>
								</td>
								<td class="py-4 px-4 text-xs font-mono" style="color: var(--color-text-tertiary);">
									disabled:opacity-50
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Secondary Buttons (Charcoal) -->
			<div class="mb-8">
				<h4 class="text-base mb-4 font-medium" style="color: var(--color-text-secondary);">Secondary Actions (Charcoal)</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b" style="border-color: var(--color-border-default);">
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">State</th>
								<th class="py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">Visual</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">CSS</th>
							</tr>
						</thead>
						<tbody class="divide-y" style="border-color: var(--color-border-default);">
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Default</td>
								<td class="py-4 px-4">
									<button class="px-4 py-2 text-sm font-medium rounded-lg border" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary); border-color: var(--color-border-default);">
										Export JSON
									</button>
								</td>
								<td class="py-4 px-4 text-xs font-mono" style="color: var(--color-text-tertiary);">
									bg-bg-tertiary border-border-default
								</td>
							</tr>
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Hover</td>
								<td class="py-4 px-4">
									<button class="px-4 py-2 text-sm font-medium rounded-lg border" style="background-color: var(--color-charcoal-700); color: var(--color-text-primary); border-color: var(--color-border-emphasis);">
										Export JSON
									</button>
								</td>
								<td class="py-4 px-4 text-xs font-mono" style="color: var(--color-text-tertiary);">
									hover:bg-charcoal-700
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Selection States (Gold) -->
			<div>
				<h4 class="text-base mb-4 font-medium" style="color: var(--color-text-secondary);">Selection/Active States (Gold)</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b" style="border-color: var(--color-border-default);">
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">State</th>
								<th class="py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">Visual</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text-tertiary);">Usage</th>
							</tr>
						</thead>
						<tbody class="divide-y" style="border-color: var(--color-border-default);">
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Unselected</td>
								<td class="py-4 px-4">
									<button class="px-4 py-2 text-sm font-medium rounded-lg border" style="background-color: transparent; color: var(--color-text-secondary); border-color: var(--color-border-default);">
										List
									</button>
								</td>
								<td class="py-4 px-4 text-xs" style="color: var(--color-text-tertiary);">
									View mode toggle (inactive)
								</td>
							</tr>
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Selected</td>
								<td class="py-4 px-4">
									<button class="px-4 py-2 text-sm font-medium rounded-lg" style="background-color: var(--color-gold-500); color: #18181b;">
										Timeline
									</button>
								</td>
								<td class="py-4 px-4 text-xs" style="color: var(--color-text-tertiary);">
									View mode toggle (active)
								</td>
							</tr>
							<tr>
								<td class="py-4 px-4" style="color: var(--color-text-secondary);">Match Selected</td>
								<td class="py-4 px-4">
									<div class="p-3 rounded-lg border-2" style="background-color: var(--color-accent-gold-subtle); border-color: var(--color-gold-500);">
										<div class="text-sm font-medium" style="color: var(--color-text-primary);">13-1 vs Epic United</div>
										<div class="text-xs mt-1" style="color: var(--color-text-secondary);">North 79 • 8:00 AM</div>
									</div>
								</td>
								<td class="py-4 px-4 text-xs" style="color: var(--color-text-tertiary);">
									Selected match in coverage plan
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Input States -->
		<div class="mb-12">
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Input States</h3>
			<div class="space-y-6 max-w-2xl">
				<div>
					<label for="input-default" class="text-sm mb-2 block" style="color: var(--color-text-tertiary);">Default State</label>
					<input
						id="input-default"
						type="text"
						placeholder="Enter text..."
						class="w-full px-4 py-2 rounded-lg border transition-colors"
						style="background-color: var(--color-bg-secondary); border-color: var(--color-border-default); color: var(--color-text-primary);"
					/>
					<code class="text-xs mt-1 block" style="color: var(--color-text-tertiary);">border-border-default</code>
				</div>

				<div>
					<label for="input-focus" class="text-sm mb-2 block" style="color: var(--color-text-tertiary);">Focus State</label>
					<input
						id="input-focus"
						type="text"
						placeholder="Enter text..."
						class="w-full px-4 py-2 rounded-lg border ring-2 transition-colors"
						style="background-color: var(--color-bg-secondary); border-color: var(--color-brand-500); color: var(--color-text-primary); box-shadow: 0 0 0 3px rgba(91, 124, 255, 0.15);"
					/>
					<code class="text-xs mt-1 block" style="color: var(--color-text-tertiary);">focus:border-brand-500 focus:ring-brand-500/15</code>
				</div>

				<div>
					<label for="input-error" class="text-sm mb-2 block" style="color: var(--color-text-tertiary);">Error State</label>
					<input
						id="input-error"
						type="text"
						placeholder="Invalid input"
						class="w-full px-4 py-2 rounded-lg border ring-2 transition-colors"
						style="background-color: var(--color-bg-secondary); border-color: var(--color-error-light); color: var(--color-text-primary); box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);"
					/>
					<p class="text-xs mt-1" style="color: var(--color-error-light);">This field is required</p>
					<code class="text-xs mt-1 block" style="color: var(--color-text-tertiary);">border-error-light ring-error-light/15</code>
				</div>
			</div>
		</div>

		<!-- Status Indicators -->
		<div>
			<h3 class="text-lg mb-4 font-semibold" style="color: var(--color-text-secondary);">Status Indicators</h3>
			<div class="space-y-4">
				<div class="p-4 rounded-lg border" style="background-color: var(--color-success-subtle); border-color: var(--color-success-light);">
					<div class="flex items-center gap-2">
						<span class="status-dot status-dot-success"></span>
						<span class="text-sm font-medium" style="color: var(--color-success-light);">Team Covered</span>
					</div>
					<p class="text-xs mt-2" style="color: var(--color-text-secondary);">All matches for this team have been covered</p>
				</div>

				<div class="p-4 rounded-lg border" style="background-color: var(--color-warning-subtle); border-color: var(--color-warning-light);">
					<div class="flex items-center gap-2">
						<span class="status-dot status-dot-warning"></span>
						<span class="text-sm font-medium" style="color: var(--color-warning-light);">Conflict Detected</span>
					</div>
					<p class="text-xs mt-2" style="color: var(--color-text-secondary);">This match overlaps with another match</p>
				</div>

				<div class="p-4 rounded-lg border" style="background-color: var(--color-error-subtle); border-color: var(--color-error-light);">
					<div class="flex items-center gap-2">
						<span class="status-dot status-dot-error"></span>
						<span class="text-sm font-medium" style="color: var(--color-error-light);">Critical Issue</span>
					</div>
					<p class="text-xs mt-2" style="color: var(--color-text-secondary);">Match cannot be scheduled due to venue conflict</p>
				</div>

				<div class="p-4 rounded-lg border" style="background-color: var(--color-info-subtle); border-color: var(--color-info-light);">
					<div class="flex items-center gap-2">
						<span class="status-dot status-dot-info"></span>
						<span class="text-sm font-medium" style="color: var(--color-info-light);">Information</span>
					</div>
					<p class="text-xs mt-2" style="color: var(--color-text-secondary);">Match has been claimed by another user</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Design Principles -->
	<section>
		<h2 class="text-2xl mb-6 border-b pb-3 font-semibold" style="color: var(--color-text-primary); border-color: var(--color-border-default);">
			4. Design Principles
		</h2>

		<div class="space-y-6">
			<div class="p-6 rounded-lg" style="background-color: var(--color-bg-secondary);">
				<h3 class="text-lg mb-3 font-semibold" style="color: var(--color-brand-400);">1. Cockpit-First Design</h3>
				<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					Data density is power. Every pixel must serve rapid scanning, conflict detection, and decision-making.
					Information architecture optimized for expert users who need to triage hundreds of matches quickly.
				</p>
			</div>

			<div class="p-6 rounded-lg" style="background-color: var(--color-bg-secondary);">
				<h3 class="text-lg mb-3 font-semibold" style="color: var(--color-brand-400);">2. Semantic Color System</h3>
				<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					Each color has ONE job: Blue = actions, Amber = warnings, Green = success, Red = errors, Gold = selection.
					Consistent color semantics reduce cognitive load and enable instant pattern recognition.
				</p>
			</div>

			<div class="p-6 rounded-lg" style="background-color: var(--color-bg-secondary);">
				<h3 class="text-lg mb-3 font-semibold" style="color: var(--color-brand-400);">3. Typography as Hierarchy</h3>
				<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					Text size and color indicate information priority: Primary (high contrast) for critical data,
					Secondary for supporting info, Tertiary for metadata. Size reflects importance, not decoration.
				</p>
			</div>

			<div class="p-6 rounded-lg" style="background-color: var(--color-bg-secondary);">
				<h3 class="text-lg mb-3 font-semibold" style="color: var(--color-brand-400);">4. Accessibility First</h3>
				<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					WCAG 2.1 AA compliant focus indicators, minimum touch targets (44x44px), keyboard navigation support,
					and screen reader compatibility. Reduced motion respected for all animations.
				</p>
			</div>

			<div class="p-6 rounded-lg" style="background-color: var(--color-bg-secondary);">
				<h3 class="text-lg mb-3 font-semibold" style="color: var(--color-brand-400);">5. Aligned with Portfolio</h3>
				<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					Design system aligned with match-flow and aiq projects: consistent brand blue (#5B7CFF),
					semantic color palette, dark-optimized charcoal scale. Cross-project consistency reduces learning curve.
				</p>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<section class="border-t pt-8" style="border-color: var(--color-border-default);">
		<p class="text-sm text-center" style="color: var(--color-text-tertiary);">
			CourSync Design System v2.0.0 • Last Updated: October 31, 2025
		</p>
	</section>
</div>
