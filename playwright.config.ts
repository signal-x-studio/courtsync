import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for CourtSync
 *
 * E2E testing configuration for SvelteKit application
 * Includes web server setup, browser configs, and test settings
 */
export default defineConfig({
	// Test directory
	testDir: './tests',

	// Maximum time one test can run
	timeout: 30 * 1000,

	// Run tests in files in parallel
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI
	workers: process.env.CI ? 1 : undefined,

	// Reporter to use
	reporter: [
		['html'],
		['list'],
		['json', { outputFile: 'test-results/results.json' }]
	],

	// Shared settings for all projects
	use: {
		// Base URL for tests
		baseURL: 'http://localhost:5173',

		// Collect trace when retrying the failed test
		trace: 'on-first-retry',

		// Screenshot on failure
		screenshot: 'only-on-failure',

		// Video on failure
		video: 'retain-on-failure',
	},

	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},

		// Mobile viewports
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],

	// Run local dev server before starting the tests
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});

