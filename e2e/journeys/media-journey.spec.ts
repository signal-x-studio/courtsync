import { test, expect } from '@playwright/test';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ClubPage } from '../page-objects/ClubPage';
import { MatchDetailPage } from '../page-objects/MatchDetailPage';

/**
 * Media Persona User Journey Tests
 *
 * Covers the complete media/photographer workflow:
 * 1. Select media persona
 * 2. View all matches for a club
 * 3. Select matches for coverage plan
 * 4. View coverage plan page
 * 5. Filter to uncovered matches only
 * 6. Access live scoring controls
 */

const TEST_EVENT_ID = 'PTAwMDAwNDEzMTQ90';
const TEST_CLUB_ID = 24426; // 630 Volleyball Club

test.describe('Media User Journey', () => {
	test.beforeEach(async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();
	});

	test('should complete full media workflow', async ({ page }) => {
		const club = new ClubPage(page);

		// Step 1: Navigate to All Matches
		await test.step('Navigate to club matches as media', async () => {
			await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
			await expect(club.pageTitle).toBeVisible();

			const matchCount = await club.getMatchCount();
			expect(matchCount).toBeGreaterThan(0);
		});

		// Step 2: Select matches for coverage
		await test.step('Add matches to coverage plan', async () => {
			// Select first 3 matches for coverage
			await club.toggleCoverageForMatch(0);
			await club.toggleCoverageForMatch(1);
			await club.toggleCoverageForMatch(2);

			// Verify checkboxes are checked
			const firstCheckbox = club.matchCards.first().locator('input[type="checkbox"]');
			await expect(firstCheckbox).toBeChecked();
		});

		// Step 3: View coverage plan
		await test.step('Navigate to coverage plan', async () => {
			await club.navigateToCoverage();
			await expect(page).toHaveURL(/\/coverage/);

			// Verify selected matches appear in coverage plan
			const coverageMatches = page.locator('[data-testid="coverage-match"]');
			const count = await coverageMatches.count();
			expect(count).toBeGreaterThanOrEqual(3);
		});

		// Step 4: Filter to uncovered matches only
		await test.step('Filter to uncovered matches', async () => {
			await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
			await club.toggleUncoveredOnly();

			// Wait for filter to apply
			await page.waitForTimeout(500);

			// Covered matches should be hidden
			const visibleMatches = await club.getMatchCount();
			expect(visibleMatches).toBeLessThan(await club.getMatchCount());
		});
	});

	test('should access live scoring controls as media', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		await test.step('Access match scoring interface', async () => {
			await club.clickMatch(0);

			// Media persona should see Lock Match button
			await expect(matchDetail.lockMatchButton).toBeVisible();
		});

		await test.step('Lock match for scoring', async () => {
			await matchDetail.lockMatch();

			// Should show scoring controls
			await expect(matchDetail.setButtons.first()).toBeVisible();
			await expect(matchDetail.team1IncrementButton).toBeVisible();
			await expect(matchDetail.team2IncrementButton).toBeVisible();
			await expect(matchDetail.unlockMatchButton).toBeVisible();
		});

		await test.step('Unlock match', async () => {
			await matchDetail.unlockMatch();

			// Should return to locked state
			await expect(matchDetail.lockMatchButton).toBeVisible();
		});
	});

	test('should show coverage navigation tab for media only', async ({ page }) => {
		const club = new ClubPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Coverage tab should be visible
		await expect(club.navigation.coverage).toBeVisible();

		// Switch to spectator persona
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectSpectatorPersona();

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Coverage tab should NOT be visible
		await expect(club.navigation.coverage).not.toBeVisible();
	});

	test('should persist media persona across sessions', async ({ page, context }) => {
		const settings = new SettingsPage(page);

		// Verify media persona is set
		const persona = await settings.getCurrentPersona();
		expect(persona).toBe('media');

		// Close page and open new one (simulates refresh)
		await page.close();
		const newPage = await context.newPage();
		const newSettings = new SettingsPage(newPage);
		await newSettings.visit();

		// Persona should still be media (from localStorage)
		const newPersona = await newSettings.getCurrentPersona();
		expect(newPersona).toBe('media');
	});
});
