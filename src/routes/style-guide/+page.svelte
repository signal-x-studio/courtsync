<script lang="ts">
	import { Calendar, Users, Trophy, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-svelte';

	let sampleScoreValue = 75;

	const codeExample = `// Code block example
function calculateWinPercentage(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? (wins / total) * 100 : 0;
}`;
</script>

<svelte:head>
	<title>Design System Style Guide - CourtSync</title>
</svelte:head>

<div class="min-h-screen p-4 md:p-8">
	<div class="max-w-6xl mx-auto space-y-12">
		<!-- Header -->
		<header class="space-y-4">
			<h1 class="text-4xl font-bold">CourtSync Design System</h1>
			<p class="text-muted text-lg">
				A comprehensive design system featuring Vercel-inspired dark mode and Supabase-inspired
				light mode with basketball aesthetics.
			</p>
		</header>

		<div class="divider"></div>

		<!-- Color Palette -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Color Palette</h2>

			<div class="space-y-8">
				<!-- Primary Colors -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Primary (Basketball Orange)</h3>
					<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-primary-100"></div>
							<p class="text-xs text-muted">primary-100</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-primary-300"></div>
							<p class="text-xs text-muted">primary-300</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-primary-500"></div>
							<p class="text-xs text-muted">primary-500</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-primary-700"></div>
							<p class="text-xs text-muted">primary-700</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-primary-900"></div>
							<p class="text-xs text-muted">primary-900</p>
						</div>
					</div>
				</div>

				<!-- Secondary Colors -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Secondary (Court Blue)</h3>
					<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-secondary-100"></div>
							<p class="text-xs text-muted">secondary-100</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-secondary-300"></div>
							<p class="text-xs text-muted">secondary-300</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-secondary-500"></div>
							<p class="text-xs text-muted">secondary-500</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-secondary-700"></div>
							<p class="text-xs text-muted">secondary-700</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-secondary-900"></div>
							<p class="text-xs text-muted">secondary-900</p>
						</div>
					</div>
				</div>

				<!-- Accent Colors -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Accent (Court Gold)</h3>
					<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-accent-100"></div>
							<p class="text-xs text-muted">accent-100</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-accent-300"></div>
							<p class="text-xs text-muted">accent-300</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-accent-500"></div>
							<p class="text-xs text-muted">accent-500</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-accent-700"></div>
							<p class="text-xs text-muted">accent-700</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-accent-900"></div>
							<p class="text-xs text-muted">accent-900</p>
						</div>
					</div>
				</div>

				<!-- Semantic Colors -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Semantic Colors</h3>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-success-500"></div>
							<p class="text-xs text-muted">Success</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-warning-500"></div>
							<p class="text-xs text-muted">Warning</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-error-500"></div>
							<p class="text-xs text-muted">Error</p>
						</div>
						<div class="space-y-2">
							<div class="h-20 rounded-lg bg-info-500"></div>
							<p class="text-xs text-muted">Info</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Typography -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Typography</h2>

			<div class="space-y-4">
				<div class="p-4 card">
					<h1 class="text-4xl font-bold mb-2">Heading 1 (4xl)</h1>
					<h2 class="text-3xl font-semibold mb-2">Heading 2 (3xl)</h2>
					<h3 class="text-2xl font-semibold mb-2">Heading 3 (2xl)</h3>
					<h4 class="text-xl font-medium mb-2">Heading 4 (xl)</h4>
					<h5 class="text-lg font-medium mb-2">Heading 5 (lg)</h5>
					<p class="text-base mb-2">Body text (base) - The quick brown fox jumps over the lazy dog</p>
					<p class="text-sm mb-2">Small text (sm) - The quick brown fox jumps over the lazy dog</p>
					<p class="text-xs">Extra small text (xs) - The quick brown fox jumps over the lazy dog</p>
				</div>

				<div class="p-4 card">
					<p class="metric-label">Metric Label</p>
					<p class="metric-value">1,234</p>
				</div>

				<div class="p-4 card">
					<p class="score-number text-primary-500">42</p>
					<p class="text-xs text-muted mt-2">Score Number Style</p>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Buttons -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Buttons</h2>

			<div class="space-y-6">
				<!-- Button Variants -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Variants</h3>
					<div class="flex flex-wrap gap-3">
						<button class="btn btn-primary">Primary</button>
						<button class="btn btn-secondary">Secondary</button>
						<button class="btn btn-accent">Accent</button>
						<button class="btn btn-outline">Outline</button>
						<button class="btn btn-ghost">Ghost</button>
						<button class="btn btn-primary" disabled>Disabled</button>
					</div>
				</div>

				<!-- Button Sizes -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Sizes</h3>
					<div class="flex flex-wrap items-center gap-3">
						<button class="btn btn-primary btn-sm">Small</button>
						<button class="btn btn-primary">Default</button>
						<button class="btn btn-primary btn-lg">Large</button>
					</div>
				</div>

				<!-- Buttons with Icons -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">With Icons</h3>
					<div class="flex flex-wrap gap-3">
						<button class="btn btn-primary">
							<Calendar class="w-4 h-4" />
							Schedule Match
						</button>
						<button class="btn btn-secondary">
							<Users class="w-4 h-4" />
							View Teams
						</button>
						<button class="btn btn-accent">
							<Trophy class="w-4 h-4" />
							Leaderboard
						</button>
					</div>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Form Inputs -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Form Inputs</h2>

			<div class="space-y-6">
				<!-- Text Input -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Text Input</h3>
					<div class="max-w-md space-y-3">
						<input type="text" class="input" placeholder="Enter text..." />
						<input type="text" class="input" value="Filled input" />
						<input type="text" class="input" placeholder="Disabled input" disabled />
						<input type="text" class="input input-error" placeholder="Error state" />
					</div>
				</div>

				<!-- Textarea -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Textarea</h3>
					<div class="max-w-md">
						<textarea class="textarea" placeholder="Enter longer text..."></textarea>
					</div>
				</div>

				<!-- Select -->
				<div class="space-y-3">
					<h3 class="text-xl font-medium">Select</h3>
					<div class="max-w-md">
						<select class="select">
							<option>Select an option...</option>
							<option>Basketball</option>
							<option>Volleyball</option>
							<option>Soccer</option>
						</select>
					</div>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Badges -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Badges</h2>

			<div class="flex flex-wrap gap-3">
				<span class="badge badge-primary">Primary</span>
				<span class="badge badge-secondary">Secondary</span>
				<span class="badge badge-accent">Accent</span>
				<span class="badge badge-success">Success</span>
				<span class="badge badge-warning">Warning</span>
				<span class="badge badge-error">Error</span>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Cards -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Cards</h2>

			<div class="grid md:grid-cols-3 gap-4">
				<div class="card">
					<h3 class="text-lg font-semibold mb-2">Default Card</h3>
					<p class="text-sm text-muted">This is a standard card with border and padding.</p>
				</div>

				<div class="card card-hover">
					<h3 class="text-lg font-semibold mb-2">Hover Card</h3>
					<p class="text-sm text-muted">Hover over this card to see the effect.</p>
				</div>

				<div class="card-interactive">
					<h3 class="text-lg font-semibold mb-2">Interactive Card</h3>
					<p class="text-sm text-muted">Click this card to see the interaction.</p>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Alerts -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Alerts</h2>

			<div class="space-y-4">
				<div class="alert alert-info">
					<Info class="w-5 h-5 flex-shrink-0" />
					<div>
						<h4 class="font-medium">Information</h4>
						<p class="text-sm">This is an informational alert message.</p>
					</div>
				</div>

				<div class="alert alert-success">
					<CheckCircle class="w-5 h-5 flex-shrink-0" />
					<div>
						<h4 class="font-medium">Success</h4>
						<p class="text-sm">Your action completed successfully!</p>
					</div>
				</div>

				<div class="alert alert-warning">
					<AlertCircle class="w-5 h-5 flex-shrink-0" />
					<div>
						<h4 class="font-medium">Warning</h4>
						<p class="text-sm">Please review this important information.</p>
					</div>
				</div>

				<div class="alert alert-error">
					<XCircle class="w-5 h-5 flex-shrink-0" />
					<div>
						<h4 class="font-medium">Error</h4>
						<p class="text-sm">Something went wrong. Please try again.</p>
					</div>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Score Visualization -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Score Visualization</h2>

			<div class="space-y-6">
				<div class="card max-w-md">
					<div class="flex justify-between items-center mb-2">
						<span class="text-sm font-medium">Team Score</span>
						<span class="metric-value text-primary-500">{sampleScoreValue}</span>
					</div>
					<div class="score-bar">
						<div
							class="score-fill bg-primary-500"
							style="width: {sampleScoreValue}%"
						></div>
					</div>
					<div class="flex justify-between mt-2">
						<span class="text-xs text-muted">0</span>
						<span class="text-xs text-muted">100</span>
					</div>
				</div>

				<div class="card max-w-md">
					<label for="score-slider" class="text-sm font-medium mb-2 block">Adjust Score</label>
					<input
						id="score-slider"
						type="range"
						min="0"
						max="100"
						bind:value={sampleScoreValue}
						class="w-full"
					/>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Tables -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Tables</h2>

			<div class="card overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Team</th>
							<th>Wins</th>
							<th>Losses</th>
							<th>Win %</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="font-medium">Lakers</td>
							<td>15</td>
							<td>5</td>
							<td>75%</td>
							<td><span class="badge badge-success">Active</span></td>
						</tr>
						<tr>
							<td class="font-medium">Warriors</td>
							<td>12</td>
							<td>8</td>
							<td>60%</td>
							<td><span class="badge badge-success">Active</span></td>
						</tr>
						<tr>
							<td class="font-medium">Celtics</td>
							<td>10</td>
							<td>10</td>
							<td>50%</td>
							<td><span class="badge badge-warning">Review</span></td>
						</tr>
						<tr>
							<td class="font-medium">Knicks</td>
							<td>5</td>
							<td>15</td>
							<td>25%</td>
							<td><span class="badge badge-error">Inactive</span></td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Code Blocks -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Code Blocks</h2>

			<div class="space-y-4">
				<div>
					<p class="mb-2">Inline code: <code>const teamScore = 42;</code></p>
				</div>

				<div>
					<pre><code>{codeExample}</code></pre>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Spacing & Layout -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Spacing Scale</h2>

			<div class="space-y-3">
				<div class="flex items-center gap-4">
					<div class="w-20 text-xs text-muted">xs (4px)</div>
					<div class="h-8 bg-primary-500" style="width: 0.25rem;"></div>
				</div>
				<div class="flex items-center gap-4">
					<div class="w-20 text-xs text-muted">sm (8px)</div>
					<div class="h-8 bg-primary-500" style="width: 0.5rem;"></div>
				</div>
				<div class="flex items-center gap-4">
					<div class="w-20 text-xs text-muted">md (16px)</div>
					<div class="h-8 bg-primary-500" style="width: 1rem;"></div>
				</div>
				<div class="flex items-center gap-4">
					<div class="w-20 text-xs text-muted">lg (24px)</div>
					<div class="h-8 bg-primary-500" style="width: 1.5rem;"></div>
				</div>
				<div class="flex items-center gap-4">
					<div class="w-20 text-xs text-muted">xl (32px)</div>
					<div class="h-8 bg-primary-500" style="width: 2rem;"></div>
				</div>
				<div class="flex items-center gap-4">
					<div class="w-20 text-xs text-muted">2xl (48px)</div>
					<div class="h-8 bg-primary-500" style="width: 3rem;"></div>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Border Radius -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Border Radius</h2>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="space-y-2">
					<div class="h-20 bg-primary-500 rounded-sm"></div>
					<p class="text-xs text-muted">sm (4px)</p>
				</div>
				<div class="space-y-2">
					<div class="h-20 bg-primary-500 rounded-md"></div>
					<p class="text-xs text-muted">md (8px)</p>
				</div>
				<div class="space-y-2">
					<div class="h-20 bg-primary-500 rounded-lg"></div>
					<p class="text-xs text-muted">lg (12px)</p>
				</div>
				<div class="space-y-2">
					<div class="h-20 bg-primary-500 rounded-xl"></div>
					<p class="text-xs text-muted">xl (16px)</p>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<!-- Shadows -->
		<section class="space-y-6">
			<h2 class="text-3xl font-semibold">Shadows</h2>

			<div class="grid md:grid-cols-3 gap-4">
				<div class="p-6 bg-subtle rounded-lg shadow-sm">
					<p class="text-sm font-medium">Small</p>
				</div>
				<div class="p-6 bg-subtle rounded-lg shadow-md">
					<p class="text-sm font-medium">Medium</p>
				</div>
				<div class="p-6 bg-subtle rounded-lg shadow-lg">
					<p class="text-sm font-medium">Large</p>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="pt-8 pb-4 text-center">
			<p class="text-sm text-muted">
				CourtSync Design System · Basketball-inspired aesthetics with professional polish
			</p>
		</footer>
	</div>
</div>
