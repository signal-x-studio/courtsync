import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Match Detail Page Object
 * Handles live scoring interface and match details
 */
export class MatchDetailPage extends BasePage {
	readonly backButton: Locator;
	readonly divisionName: Locator;
	readonly liveIndicator: Locator;
	readonly team1Name: Locator;
	readonly team2Name: Locator;
	readonly lockMatchButton: Locator;
	readonly unlockMatchButton: Locator;
	readonly setButtons: Locator;
	readonly team1ScoreDisplay: Locator;
	readonly team2ScoreDisplay: Locator;
	readonly team1IncrementButton: Locator;
	readonly team1DecrementButton: Locator;
	readonly team2IncrementButton: Locator;
	readonly team2DecrementButton: Locator;
	readonly scoreDisplay: Locator;
	readonly lockedByMessage: Locator;

	constructor(page: Page) {
		super(page);

		this.backButton = page.getByRole('button', { name: /Back/i });
		this.divisionName = page.locator('h3').first();
		this.liveIndicator = page.locator('[data-testid="live-indicator"]');
		this.team1Name = page.locator('.text-2xl.font-bold').first();
		this.team2Name = page.locator('.text-2xl.font-bold').last();
		this.lockMatchButton = page.getByRole('button', { name: /Lock Match for Scoring/i });
		this.unlockMatchButton = page.getByRole('button', { name: /Unlock Match/i });
		this.setButtons = page.getByRole('button', { name: /Set \d/ });
		this.team1ScoreDisplay = page.locator('.text-4xl.font-bold').first();
		this.team2ScoreDisplay = page.locator('.text-4xl.font-bold').last();
		this.team1IncrementButton = page
			.locator('.text-center')
			.first()
			.getByRole('button', { name: '+1' });
		this.team1DecrementButton = page
			.locator('.text-center')
			.first()
			.getByRole('button', { name: '-1' });
		this.team2IncrementButton = page
			.locator('.text-center')
			.last()
			.getByRole('button', { name: '+1' });
		this.team2DecrementButton = page
			.locator('.text-center')
			.last()
			.getByRole('button', { name: '-1' });
		this.scoreDisplay = page.locator('[data-testid="score-display"]');
		this.lockedByMessage = page.getByText(/locked by another user/i);
	}

	async visit(matchId: number) {
		await this.goto(`/match/${matchId}`);
		await this.waitForPageLoad();
	}

	async lockMatch() {
		await this.lockMatchButton.click();
		await this.page.waitForTimeout(500); // Wait for lock to register
	}

	async unlockMatch() {
		await this.unlockMatchButton.click();
		await this.page.waitForTimeout(500); // Wait for unlock to register
	}

	async selectSet(setNumber: number) {
		await this.setButtons.nth(setNumber - 1).click();
	}

	async incrementTeam1Score() {
		await this.team1IncrementButton.click();
		await this.page.waitForTimeout(300); // Wait for update
	}

	async decrementTeam1Score() {
		await this.team1DecrementButton.click();
		await this.page.waitForTimeout(300);
	}

	async incrementTeam2Score() {
		await this.team2IncrementButton.click();
		await this.page.waitForTimeout(300);
	}

	async decrementTeam2Score() {
		await this.team2DecrementButton.click();
		await this.page.waitForTimeout(300);
	}

	async getTeam1Score(): Promise<string> {
		return await this.team1ScoreDisplay.textContent() || '0';
	}

	async getTeam2Score(): Promise<string> {
		return await this.team2ScoreDisplay.textContent() || '0';
	}

	async isLocked(): Promise<boolean> {
		return await this.unlockMatchButton.isVisible();
	}

	async isLockedByAnother(): Promise<boolean> {
		return await this.lockedByMessage.isVisible();
	}

	async goBack() {
		await this.backButton.click();
		await this.waitForPageLoad();
		// Wait for match cards to render after navigation
		await this.page.waitForSelector('[data-testid="match-card"]', { timeout: 10000 }).catch(() => {});
	}
}
