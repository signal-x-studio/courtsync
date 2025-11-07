import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E and Visual Testing Configuration
 *
 * Tests cover:
 * - All user journeys (spectator, media personas)
 * - Page loads and navigation
 * - Component interactions
 * - Real-time features
 * - Visual regression
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['json', { outputFile: 'test-results/results.json' }],
		['list']
	],
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},
		{
			name: 'mobile',
			use: { ...devices['iPhone 13'] }
		}
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000
	}
});
