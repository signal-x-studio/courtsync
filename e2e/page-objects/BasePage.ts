import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object
 * Contains common elements and methods shared across all pages
 */
export class BasePage {
	readonly page: Page;
	readonly navigation: {
		allMatches: Locator;
		myTeams: Locator;
		coverage: Locator;
		filters: Locator;
		settings: Locator;
	};

	constructor(page: Page) {
		this.page = page;

		// Bottom navigation elements
		this.navigation = {
			allMatches: page.getByRole('link', { name: 'All Matches' }),
			myTeams: page.getByRole('link', { name: 'My Teams' }),
			coverage: page.getByRole('link', { name: 'Coverage' }),
			filters: page.getByRole('link', { name: /Filters/ }),
			settings: page.getByRole('link', { name: 'Settings' })
		};
	}

	async goto(path: string) {
		await this.page.goto(path);
	}

	async navigateToAllMatches() {
		await this.navigation.allMatches.click();
	}

	async navigateToMyTeams() {
		await this.navigation.myTeams.click();
	}

	async navigateToCoverage() {
		await this.navigation.coverage.click();
	}

	async navigateToFilters() {
		await this.navigation.filters.click();
	}

	async navigateToSettings() {
		await this.navigation.settings.click();
	}

	async waitForPageLoad() {
		await this.page.waitForLoadState('networkidle');
	}

	async takeScreenshot(name: string) {
		return await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
	}
}
