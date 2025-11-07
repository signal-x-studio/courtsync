/**
 * Comprehensive Screenshot Capture for UX/UI Audit
 *
 * Captures screenshots of every page, view, route, interaction, and user state
 * for visual design and information architecture analysis.
 *
 * Event ID: PTAwMDAwNDE3NzU90
 * Club ID: 24426
 */

import { test, expect } from '@playwright/test';

const EVENT_ID = 'PTAwMDAwNDE3NzU90';
const CLUB_ID = '24426';
const BASE_URL = `/club/${EVENT_ID}?clubId=${CLUB_ID}`;

test.describe('Comprehensive UX/UI Audit Screenshots', () => {
	test.beforeEach(async ({ page }) => {
		// Set viewport sizes for different device types
		await page.setViewportSize({ width: 1920, height: 1080 });
	});

	test.describe('1. All Matches Page - Desktop', () => {
		test('01-all-matches-default-view', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/01-all-matches-default-view.png',
				fullPage: true
			});
		});

		test('02-all-matches-am-wave-filter', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.click('button[aria-label="Show AM wave only"]');
			await page.screenshot({
				path: 'screenshots/audit/02-all-matches-am-wave-filter.png',
				fullPage: true
			});
		});

		test('03-all-matches-pm-wave-filter', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.click('button[aria-label="Show PM wave only"]');
			await page.screenshot({
				path: 'screenshots/audit/03-all-matches-pm-wave-filter.png',
				fullPage: true
			});
		});

		test('04-all-matches-time-block-collapsed', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			// Collapse first time block
			const timeBlockButton = page.locator('.time-block button').first();
			await timeBlockButton.click();
			await page.screenshot({
				path: 'screenshots/audit/04-all-matches-time-block-collapsed.png',
				fullPage: true
			});
		});

		test('05-all-matches-match-card-hover', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			const matchCard = page.locator('[data-testid="match-card"]').first();
			await matchCard.hover();
			await page.screenshot({
				path: 'screenshots/audit/05-all-matches-match-card-hover.png',
				fullPage: true
			});
		});
	});

	test.describe('2. My Teams Page - Spectator Persona', () => {
		test('06-my-teams-spectator-empty', async ({ page }) => {
			await page.goto('/my-teams');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/06-my-teams-spectator-empty.png',
				fullPage: true
			});
		});

		test('07-my-teams-spectator-with-favorites', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Add a team to favorites
			const favoriteButton = page.locator('button[aria-label*="Add to favorites"]').first();
			await favoriteButton.click();
			await page.waitForTimeout(500);

			await page.goto('/my-teams');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/07-my-teams-spectator-with-favorites.png',
				fullPage: true
			});
		});
	});

	test.describe('3. Coverage Page - Media Persona', () => {
		test('08-coverage-media-empty', async ({ page }) => {
			// Switch to media persona
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.click('button:has-text("Media")');
			await page.waitForTimeout(500);

			await page.goto('/coverage');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/08-coverage-media-empty.png',
				fullPage: true
			});
		});

		test('09-all-matches-media-with-coverage-toggle', async ({ page }) => {
			// Switch to media persona
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.click('button:has-text("Media")');
			await page.waitForTimeout(500);

			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/09-all-matches-media-with-coverage-toggle.png',
				fullPage: true
			});
		});

		test('10-coverage-media-with-matches', async ({ page }) => {
			// Switch to media persona and add matches
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.click('button:has-text("Media")');
			await page.waitForTimeout(500);

			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Add a match to coverage
			const coverageButton = page.locator('button:has-text("+ Coverage")').first();
			await coverageButton.click();
			await page.waitForTimeout(500);

			await page.goto('/coverage');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/10-coverage-media-with-matches.png',
				fullPage: true
			});
		});
	});

	test.describe('4. Filters Page', () => {
		test('11-filters-default', async ({ page }) => {
			await page.goto('/filters');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/11-filters-default.png',
				fullPage: true
			});
		});

		test('12-filters-with-selections', async ({ page }) => {
			await page.goto('/filters');
			await page.waitForLoadState('networkidle');

			// Select some filters (if available)
			const filterCheckbox = page.locator('input[type="checkbox"]').first();
			if (await filterCheckbox.isVisible()) {
				await filterCheckbox.check();
			}

			await page.screenshot({
				path: 'screenshots/audit/12-filters-with-selections.png',
				fullPage: true
			});
		});
	});

	test.describe('5. Settings Page', () => {
		test('13-settings-spectator-persona', async ({ page }) => {
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.click('button:has-text("Spectator")');
			await page.waitForTimeout(500);
			await page.screenshot({
				path: 'screenshots/audit/13-settings-spectator-persona.png',
				fullPage: true
			});
		});

		test('14-settings-media-persona', async ({ page }) => {
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.click('button:has-text("Media")');
			await page.waitForTimeout(500);
			await page.screenshot({
				path: 'screenshots/audit/14-settings-media-persona.png',
				fullPage: true
			});
		});
	});

	test.describe('6. Match Detail Page', () => {
		test('15-match-detail-spectator-view', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Click on first match card
			const matchCard = page.locator('[data-testid="match-card"]').first();
			await matchCard.click();
			await page.waitForLoadState('networkidle');

			await page.screenshot({
				path: 'screenshots/audit/15-match-detail-spectator-view.png',
				fullPage: true
			});
		});

		test('16-match-detail-media-view', async ({ page }) => {
			// Switch to media persona
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.click('button:has-text("Media")');
			await page.waitForTimeout(500);

			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Click on first match card
			const matchCard = page.locator('[data-testid="match-card"]').first();
			await matchCard.click();
			await page.waitForLoadState('networkidle');

			await page.screenshot({
				path: 'screenshots/audit/16-match-detail-media-view.png',
				fullPage: true
			});
		});
	});

	test.describe('7. Mobile Views', () => {
		test.use({ viewport: { width: 375, height: 812 } }); // iPhone 12 Pro

		test('17-mobile-all-matches', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/17-mobile-all-matches.png',
				fullPage: true
			});
		});

		test('18-mobile-bottom-navigation', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/18-mobile-bottom-navigation.png'
			});
		});

		test('19-mobile-my-teams', async ({ page }) => {
			await page.goto('/my-teams');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/19-mobile-my-teams.png',
				fullPage: true
			});
		});

		test('20-mobile-filters', async ({ page }) => {
			await page.goto('/filters');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/20-mobile-filters.png',
				fullPage: true
			});
		});

		test('21-mobile-settings', async ({ page }) => {
			await page.goto('/settings');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/21-mobile-settings.png',
				fullPage: true
			});
		});

		test('22-mobile-match-detail', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			const matchCard = page.locator('[data-testid="match-card"]').first();
			await matchCard.click();
			await page.waitForLoadState('networkidle');

			await page.screenshot({
				path: 'screenshots/audit/22-mobile-match-detail.png',
				fullPage: true
			});
		});
	});

	test.describe('8. Tablet Views', () => {
		test.use({ viewport: { width: 768, height: 1024 } }); // iPad

		test('23-tablet-all-matches', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/23-tablet-all-matches.png',
				fullPage: true
			});
		});

		test('24-tablet-match-detail', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			const matchCard = page.locator('[data-testid="match-card"]').first();
			await matchCard.click();
			await page.waitForLoadState('networkidle');

			await page.screenshot({
				path: 'screenshots/audit/24-tablet-match-detail.png',
				fullPage: true
			});
		});
	});

	test.describe('9. Interaction States', () => {
		test('25-loading-skeleton-state', async ({ page }) => {
			await page.goto(BASE_URL);
			// Capture before full load
			await page.screenshot({
				path: 'screenshots/audit/25-loading-skeleton-state.png'
			});
			await page.waitForLoadState('networkidle');
		});

		test('26-favorite-team-interaction', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Click favorite button and capture
			const favoriteButton = page.locator('button[aria-label*="Add to favorites"]').first();
			await favoriteButton.click();
			await page.waitForTimeout(500);

			await page.screenshot({
				path: 'screenshots/audit/26-favorite-team-interaction.png',
				fullPage: true
			});
		});

		test('27-refresh-button-interaction', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Hover refresh button
			const refreshButton = page.locator('button[aria-label="Refresh match data"]');
			await refreshButton.hover();

			await page.screenshot({
				path: 'screenshots/audit/27-refresh-button-interaction.png'
			});
		});

		test('28-wave-filter-states', async ({ page }) => {
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');

			// Capture with each filter state
			await page.click('button[aria-label="Show AM wave only"]');
			await page.waitForTimeout(300);
			await page.screenshot({
				path: 'screenshots/audit/28-wave-filter-am-active.png'
			});

			await page.click('button[aria-label="Show PM wave only"]');
			await page.waitForTimeout(300);
			await page.screenshot({
				path: 'screenshots/audit/28-wave-filter-pm-active.png'
			});
		});
	});

	test.describe('10. Navigation Flow', () => {
		test('29-navigation-all-pages', async ({ page }) => {
			// Capture navigation through all main pages
			await page.goto(BASE_URL);
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/29-nav-01-all-matches.png'
			});

			await page.click('a[aria-label="My Teams"]');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/29-nav-02-my-teams.png'
			});

			await page.click('a[aria-label="Filters"]');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/29-nav-03-filters.png'
			});

			await page.click('a[aria-label="Settings"]');
			await page.waitForLoadState('networkidle');
			await page.screenshot({
				path: 'screenshots/audit/29-nav-04-settings.png'
			});
		});
	});
});
