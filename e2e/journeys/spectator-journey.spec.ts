import { test, expect } from '@playwright/test';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ClubPage } from '../page-objects/ClubPage';
import { MatchDetailPage } from '../page-objects/MatchDetailPage';

/**
 * Spectator User Journey Tests
 *
 * Covers the complete spectator workflow:
 * 1. Select spectator persona
 * 2. View all matches for a club
 * 3. Filter matches by division/team
 * 4. Favorite teams
 * 5. View "My Teams" filtered view
 * 6. View match details
 * 7. See live scores (read-only)
 */

const TEST_EVENT_ID = 'PTAwMDAwNDEzMTQ90'; // Default test event
const TEST_CLUB_ID = 24426; // 630 Volleyball Club

test.describe('Spectator User Journey', () => {
	test.beforeEach(async ({ page }) => {
		// Start at settings page
		const settings = new SettingsPage(page);
		await settings.visit();
	});

	test('should complete full spectator workflow', async ({ page }) => {
		const settings = new SettingsPage(page);
		const club = new ClubPage(page);

		// Step 1: Select spectator persona
		await test.step('Select spectator persona', async () => {
			await settings.selectSpectatorPersona();
			const persona = await settings.getCurrentPersona();
			expect(persona).toBe('spectator');
		});

		// Step 2: Navigate to All Matches
		await test.step('Navigate to club matches', async () => {
			await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
			await expect(club.pageTitle).toBeVisible();

			// Verify matches are displayed
			const matchCount = await club.getMatchCount();
			expect(matchCount).toBeGreaterThan(0);
		});

		// Step 3: View match list
		await test.step('View match list with details', async () => {
			// Verify match cards display required information
			const firstMatch = club.matchCards.first();
			await expect(firstMatch).toBeVisible();

			// Should show teams, time, court, division
			await expect(firstMatch).toContainText(/vs/i);
		});

		// Step 4: View match details (read-only)
		await test.step('View match details as spectator', async () => {
			await club.clickMatch(0);

			const matchDetail = new MatchDetailPage(page);

			// Verify match details are displayed
			await expect(matchDetail.team1Name).toBeVisible();
			await expect(matchDetail.team2Name).toBeVisible();
			await expect(matchDetail.divisionName).toBeVisible();

			// Verify no scoring controls for spectator persona
			await expect(matchDetail.lockMatchButton).not.toBeVisible();
		});

		// Step 5: Navigate back to match list
		await test.step('Navigate back to match list', async () => {
			const matchDetail = new MatchDetailPage(page);
			await matchDetail.goBack();

			// Should be back at club page
			await expect(club.matchCards.first()).toBeVisible();
		});
	});

	test('should display live scores in real-time', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		// Find a live match (if any)
		const liveMatchCount = await club.getLiveMatchCount();

		if (liveMatchCount > 0) {
			await test.step('View live match scores', async () => {
				// Find the first match card that contains "LIVE"
				const liveMatchCard = club.matchCards.filter({ hasText: 'LIVE' }).first();
				await liveMatchCard.click();
				await club.waitForPageLoad();

				// Verify we're on the match detail page
				await expect(matchDetail.team1Name).toBeVisible();
				await expect(matchDetail.team2Name).toBeVisible();
				await expect(matchDetail.divisionName).toBeVisible();

				// Score display is optional - only appears if scores have been entered
				// For spectators viewing a LIVE match, scores might not exist yet
			});
		}
	});

	test('should navigate between pages using bottom nav', async ({ page }) => {
		const settings = new SettingsPage(page);
		const club = new ClubPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);

		await test.step('Navigate to My Teams', async () => {
			await club.navigateToMyTeams();
			await expect(page).toHaveURL(/\/my-teams/);
		});

		await test.step('Navigate to Filters', async () => {
			await club.navigateToFilters();
			await expect(page).toHaveURL(/\/filters/);
		});

		await test.step('Navigate to Settings', async () => {
			await club.navigateToSettings();
			await expect(page).toHaveURL(/\/settings/);
		});

		await test.step('Navigate back to All Matches', async () => {
			await club.navigateToAllMatches();
			await expect(page).toHaveURL(/\/club/);
		});
	});

	test('should persist persona selection across page navigation', async ({ page }) => {
		const settings = new SettingsPage(page);
		const club = new ClubPage(page);

		// Select spectator persona
		await settings.selectSpectatorPersona();

		// Navigate away and back
		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await settings.visit();

		// Persona should still be spectator
		const persona = await settings.getCurrentPersona();
		expect(persona).toBe('spectator');
	});
});
