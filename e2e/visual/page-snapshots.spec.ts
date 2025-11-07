import { test, expect } from '@playwright/test';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ClubPage } from '../page-objects/ClubPage';
import { MatchDetailPage } from '../page-objects/MatchDetailPage';

/**
 * Visual Regression Testing
 *
 * Takes screenshots of all major pages and UI states for:
 * - Visual regression detection
 * - UI/UX documentation
 * - Design consistency verification
 * - Accessibility audits
 */

const TEST_EVENT_ID = 'PTAwMDAwNDEzMTQ90';
const TEST_CLUB_ID = 24426; // 630 Volleyball Club

test.describe('Visual Regression - All Pages', () => {
	test('Settings Page - Spectator Persona', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectSpectatorPersona();

		await expect(page).toHaveScreenshot('settings-spectator-persona.png');
	});

	test('Settings Page - Media Persona', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();

		await expect(page).toHaveScreenshot('settings-media-persona.png');
	});

	test('Club Page - All Matches View', async ({ page }) => {
		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Wait for matches to load
		await page.waitForSelector('[data-testid="match-card"]', { timeout: 10000 });

		await expect(page).toHaveScreenshot('club-all-matches.png', {
			fullPage: true
		});
	});

	test('Club Page - With Live Matches', async ({ page }) => {
		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Wait for page load
		await page.waitForLoadState('networkidle');

		const liveCount = await club.getLiveMatchCount();

		if (liveCount > 0) {
			await expect(page).toHaveScreenshot('club-with-live-matches.png', {
				fullPage: true
			});
		}
	});

	test('Match Detail - Unlocked State (Spectator View)', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectSpectatorPersona();

		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);

		await expect(page).toHaveScreenshot('match-detail-spectator-view.png');
	});

	test('Match Detail - Locked State (Media)', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();

		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);

		await expect(page).toHaveScreenshot('match-detail-unlocked-media.png');

		// Lock the match
		await matchDetail.lockMatch();

		await expect(page).toHaveScreenshot('match-detail-locked-scoring.png');
	});

	test('Match Detail - With Scores', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();

		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);
		await matchDetail.lockMatch();

		// Enter some scores
		await matchDetail.selectSet(1);
		await matchDetail.incrementTeam1Score();
		await matchDetail.incrementTeam1Score();
		await matchDetail.incrementTeam1Score();
		await matchDetail.incrementTeam2Score();
		await matchDetail.incrementTeam2Score();

		await expect(page).toHaveScreenshot('match-detail-with-scores.png');
	});

	test('My Teams Page', async ({ page }) => {
		await page.goto('/my-teams');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('my-teams-page.png', {
			fullPage: true
		});
	});

	test('Coverage Page (Media Only)', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();

		await page.goto('/coverage');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('coverage-page.png', {
			fullPage: true
		});
	});

	test('Filters Page', async ({ page }) => {
		await page.goto('/filters');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('filters-page.png', {
			fullPage: true
		});
	});
});

test.describe('Visual Regression - Mobile', () => {
	test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

	test('Mobile - Club Page', async ({ page }) => {
		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		await expect(page).toHaveScreenshot('mobile-club-page.png', {
			fullPage: true
		});
	});

	test('Mobile - Match Detail', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);

		await expect(page).toHaveScreenshot('mobile-match-detail.png', {
			fullPage: true
		});
	});

	test('Mobile - Settings Page', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();

		await expect(page).toHaveScreenshot('mobile-settings.png', {
			fullPage: true
		});
	});

	test('Mobile - Bottom Navigation', async ({ page }) => {
		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Scroll to bottom to show nav
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		await expect(page).toHaveScreenshot('mobile-bottom-nav.png');
	});
});

test.describe('Visual Regression - Component States', () => {
	test('Match Card - All States', async ({ page }) => {
		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Capture individual match card states
		const matchCard = club.matchCards.first();

		await expect(matchCard).toHaveScreenshot('match-card-default.png');
	});

	test('Match Card - Live Match', async ({ page }) => {
		const club = new ClubPage(page);
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		const liveCount = await club.getLiveMatchCount();

		if (liveCount > 0) {
			const liveMatch = page.getByText('LIVE').first().locator('..').locator('..');
			await expect(liveMatch).toHaveScreenshot('match-card-live.png');
		}
	});

	test('Score Display - All Sets', async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();

		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);
		await matchDetail.lockMatch();

		// Score all 5 sets
		for (let set = 1; set <= 5; set++) {
			await matchDetail.selectSet(set);
			await matchDetail.incrementTeam1Score();
			await matchDetail.incrementTeam2Score();
			await matchDetail.incrementTeam2Score();
		}

		// Capture score display
		const scoreDisplay = page.locator('[data-testid="score-display"]');
		await expect(scoreDisplay).toHaveScreenshot('score-display-all-sets.png');
	});
});
