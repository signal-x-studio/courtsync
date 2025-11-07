import { test, expect } from '@playwright/test';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ClubPage } from '../page-objects/ClubPage';
import { MatchDetailPage } from '../page-objects/MatchDetailPage';

/**
 * Live Scoring Flow Tests
 *
 * Tests the complete live scoring workflow including:
 * - Match locking/unlocking
 * - Score entry (+1/-1 buttons)
 * - Real-time score updates
 * - Multi-client lock prevention
 * - Score persistence
 * - All bug fixes from docs/live-scoring-fixes.md
 */

const TEST_EVENT_ID = 'PTAwMDAwNDEzMTQ90';
const TEST_CLUB_ID = 24426; // 630 Volleyball Club

test.describe('Live Scoring - Single Client', () => {
	test.beforeEach(async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();
	});

	test('should complete lock → score → unlock flow', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);

		await test.step('Lock match', async () => {
			await expect(matchDetail.lockMatchButton).toBeVisible();
			await matchDetail.lockMatch();

			// Verify scoring controls appear
			await expect(matchDetail.setButtons.first()).toBeVisible();
			await expect(matchDetail.unlockMatchButton).toBeVisible();
		});

		await test.step('Enter scores for Set 1', async () => {
			await matchDetail.selectSet(1);

			// Team 1 scores 3 points
			await matchDetail.incrementTeam1Score();
			await matchDetail.incrementTeam1Score();
			await matchDetail.incrementTeam1Score();

			// Team 2 scores 5 points
			await matchDetail.incrementTeam2Score();
			await matchDetail.incrementTeam2Score();
			await matchDetail.incrementTeam2Score();
			await matchDetail.incrementTeam2Score();
			await matchDetail.incrementTeam2Score();

			// Verify scores
			const team1Score = await matchDetail.getTeam1Score();
			const team2Score = await matchDetail.getTeam2Score();

			expect(team1Score).toBe('3');
			expect(team2Score).toBe('5');
		});

		await test.step('Test -1 buttons (decrement)', async () => {
			// Decrement team 2 score
			await matchDetail.decrementTeam2Score();

			const team2Score = await matchDetail.getTeam2Score();
			expect(team2Score).toBe('4');
		});

		await test.step('Test scores cannot go negative', async () => {
			// Try to decrement team 1 score below 0
			await matchDetail.decrementTeam1Score();
			await matchDetail.decrementTeam1Score();
			await matchDetail.decrementTeam1Score();
			await matchDetail.decrementTeam1Score(); // Extra decrements

			const team1Score = await matchDetail.getTeam1Score();
			expect(team1Score).toBe('0'); // Should not go negative
		});

		await test.step('Enter scores for multiple sets', async () => {
			// Set 2
			await matchDetail.selectSet(2);
			await matchDetail.incrementTeam1Score();
			await matchDetail.incrementTeam2Score();
			await matchDetail.incrementTeam2Score();

			// Set 3
			await matchDetail.selectSet(3);
			await matchDetail.incrementTeam1Score();
			await matchDetail.incrementTeam1Score();
			await matchDetail.incrementTeam1Score();

			// Verify Set 3 scores
			const team1Score = await matchDetail.getTeam1Score();
			expect(team1Score).toBe('3');
		});

		await test.step('Verify scores persist across set changes', async () => {
			// Go back to Set 1
			await matchDetail.selectSet(1);

			// Should still show original Set 1 scores
			const team1Score = await matchDetail.getTeam1Score();
			const team2Score = await matchDetail.getTeam2Score();

			expect(team1Score).toBe('0');
			expect(team2Score).toBe('4');
		});

		await test.step('Unlock match', async () => {
			await matchDetail.unlockMatch();

			// Verify back to locked state
			await expect(matchDetail.lockMatchButton).toBeVisible();
			await expect(matchDetail.unlockMatchButton).not.toBeVisible();
		});

		await test.step('Verify scores persist after unlock', async () => {
			// Scores should still be visible in read-only display
			await expect(matchDetail.scoreDisplay).toBeVisible();
		});
	});

	test('should maintain scores after page refresh', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);

		// Lock and score
		await matchDetail.lockMatch();
		await matchDetail.selectSet(1);
		await matchDetail.incrementTeam1Score();
		await matchDetail.incrementTeam1Score();
		await matchDetail.incrementTeam2Score();

		// Refresh page
		await page.reload();

		// Scores should persist
		await expect(matchDetail.scoreDisplay).toBeVisible();
	});
});

test.describe('Live Scoring - Multi-Client Lock Prevention', () => {
	test('should prevent second client from locking same match', async ({ browser }) => {
		// Create two browser contexts (simulates two users)
		const context1 = await browser.newContext();
		const context2 = await browser.newContext();

		const page1 = await context1.newPage();
		const page2 = await context2.newPage();

		const settings1 = new SettingsPage(page1);
		const settings2 = new SettingsPage(page2);

		// Both clients select media persona
		await settings1.visit();
		await settings1.selectMediaPersona();

		await settings2.visit();
		await settings2.selectMediaPersona();

		const club1 = new ClubPage(page1);
		const club2 = new ClubPage(page2);

		const matchDetail1 = new MatchDetailPage(page1);
		const matchDetail2 = new MatchDetailPage(page2);

		// Both clients navigate to same match
		await club1.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club1.clickMatch(0);

		await club2.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club2.clickMatch(0);

		await test.step('Client 1 locks match', async () => {
			await matchDetail1.lockMatch();

			// Client 1 should see scoring controls
			await expect(matchDetail1.unlockMatchButton).toBeVisible();
		});

		await test.step('Client 2 sees match is locked', async () => {
			// Give real-time update a moment to propagate
			await page2.waitForTimeout(1000);

			// Client 2 should see "locked by another user" message
			await expect(matchDetail2.lockedByMessage).toBeVisible();
			await expect(matchDetail2.lockMatchButton).not.toBeVisible();
		});

		await test.step('Client 2 cannot score', async () => {
			// Score buttons should not be visible for client 2
			await expect(matchDetail2.team1IncrementButton).not.toBeVisible();
		});

		await test.step('Client 1 updates score', async () => {
			await matchDetail1.selectSet(1);
			await matchDetail1.incrementTeam1Score();
			await matchDetail1.incrementTeam1Score();
		});

		await test.step('Client 2 sees score update in real-time', async () => {
			// Wait for real-time sync
			await page2.waitForTimeout(1000);

			// Client 2 should see updated scores in read-only display
			const score = await page2.locator('[data-testid="score-display"]').textContent();
			expect(score).toContain('2');
		});

		await test.step('Client 1 unlocks match', async () => {
			await matchDetail1.unlockMatch();
		});

		await test.step('Client 2 can now lock match', async () => {
			// Wait for real-time update
			await page2.waitForTimeout(1000);

			// Lock button should now be visible for client 2
			await expect(matchDetail2.lockMatchButton).toBeVisible();
			await expect(matchDetail2.lockedByMessage).not.toBeVisible();
		});

		// Cleanup
		await context1.close();
		await context2.close();
	});
});

test.describe('Live Scoring - Edge Cases', () => {
	test.beforeEach(async ({ page }) => {
		const settings = new SettingsPage(page);
		await settings.visit();
		await settings.selectMediaPersona();
	});

	test('should handle rapid score updates', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);
		await matchDetail.lockMatch();
		await matchDetail.selectSet(1);

		// Rapid clicking
		for (let i = 0; i < 10; i++) {
			await matchDetail.incrementTeam1Score();
		}

		// Wait for all updates to complete
		await page.waitForTimeout(2000);

		// Score should be 10
		const score = await matchDetail.getTeam1Score();
		expect(score).toBe('10');
	});

	test('should validate all 5 sets work independently', async ({ page }) => {
		const club = new ClubPage(page);
		const matchDetail = new MatchDetailPage(page);

		await club.visit(TEST_EVENT_ID, TEST_CLUB_ID);
		await club.clickMatch(0);
		await matchDetail.lockMatch();

		// Score different amounts in each set
		for (let set = 1; set <= 5; set++) {
			await matchDetail.selectSet(set);

			for (let i = 0; i < set; i++) {
				await matchDetail.incrementTeam1Score();
			}
		}

		// Verify each set independently
		for (let set = 1; set <= 5; set++) {
			await matchDetail.selectSet(set);
			const score = await matchDetail.getTeam1Score();
			expect(score).toBe(String(set));
		}
	});
});
