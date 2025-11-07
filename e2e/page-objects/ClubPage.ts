import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Club Page Object (All Matches View)
 * Handles match listing, filtering, and coverage selection
 */
export class ClubPage extends BasePage {
	readonly pageTitle: Locator;
	readonly clubName: Locator;
	readonly liveMatchesSection: Locator;
	readonly matchCards: Locator;
	readonly divisionFilters: Locator;
	readonly teamFilters: Locator;
	readonly uncoveredOnlyToggle: Locator;

	constructor(page: Page) {
		super(page);

		this.pageTitle = page.getByRole('heading', { level: 1 });
		this.clubName = page.locator('[data-testid="club-name"]');
		this.liveMatchesSection = page.locator('[data-testid="live-matches"]');
		this.matchCards = page.locator('[data-testid="match-card"]');
		this.divisionFilters = page.locator('[data-testid="division-filter"]');
		this.teamFilters = page.locator('[data-testid="team-filter"]');
		this.uncoveredOnlyToggle = page.getByLabel(/Show only uncovered/i);
	}

	async visit(eventId: string, clubId?: number) {
		const url = clubId ? `/club/${eventId}?clubId=${clubId}` : `/club/${eventId}`;
		await this.goto(url);
		await this.waitForPageLoad();
		// Wait for match cards to render (they load via server-side data)
		await this.page.waitForSelector('[data-testid="match-card"]', { timeout: 10000 }).catch(() => {
			// If no matches found after timeout, that's ok - page might have 0 matches
		});
	}

	async getMatchCount(): Promise<number> {
		// Wait a moment for any dynamic rendering
		await this.page.waitForTimeout(500);
		return await this.matchCards.count();
	}

	async clickMatch(index: number) {
		await this.matchCards.nth(index).click();
		await this.waitForPageLoad();
	}

	async getLiveMatchCount(): Promise<number> {
		const liveIndicators = this.page.getByText('LIVE');
		return await liveIndicators.count();
	}

	async toggleCoverageForMatch(matchIndex: number) {
		const coverageCheckbox = this.matchCards.nth(matchIndex).locator('input[type="checkbox"]');
		await coverageCheckbox.click();
	}

	async favoriteTeam(teamName: string) {
		const starButton = this.page
			.locator('[data-testid="match-card"]')
			.filter({ hasText: teamName })
			.locator('[aria-label*="favorite"]')
			.first();
		await starButton.click();
	}

	async applyDivisionFilter(divisionName: string) {
		await this.navigateToFilters();
		const filterCheckbox = this.page.getByLabel(divisionName);
		await filterCheckbox.check();
		await this.page.getByRole('button', { name: /Apply/i }).click();
		await this.waitForPageLoad();
	}

	async toggleUncoveredOnly() {
		await this.uncoveredOnlyToggle.click();
	}
}
