import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Settings Page Object
 * Handles persona selection and settings configuration
 */
export class SettingsPage extends BasePage {
	readonly spectatorPersonaButton: Locator;
	readonly mediaPersonaButton: Locator;
	readonly eventIdInput: Locator;
	readonly loadEventButton: Locator;
	readonly clubSelectionList: Locator;

	constructor(page: Page) {
		super(page);

		this.spectatorPersonaButton = page.getByRole('button', { name: /Spectator/ });
		this.mediaPersonaButton = page.getByRole('button', { name: /Media/ });
		this.eventIdInput = page.getByLabel(/Event ID/i);
		this.loadEventButton = page.getByRole('button', { name: /Load Event/i });
		this.clubSelectionList = page.getByRole('list').filter({ hasText: /Select Club/i });
	}

	async visit() {
		await this.goto('/settings');
		await this.waitForPageLoad();
	}

	async selectSpectatorPersona() {
		await this.spectatorPersonaButton.click();
	}

	async selectMediaPersona() {
		await this.mediaPersonaButton.click();
	}

	async getCurrentPersona(): Promise<string> {
		// Check which button is highlighted/active
		const spectatorActive = await this.spectatorPersonaButton.getAttribute('class');
		if (spectatorActive?.includes('gold')) {
			return 'spectator';
		}
		return 'media';
	}

	async loadEvent(eventId: string) {
		await this.eventIdInput.fill(eventId);
		await this.loadEventButton.click();
		await this.waitForPageLoad();
	}

	async selectClub(clubName: string) {
		const clubButton = this.page.getByRole('button', { name: clubName });
		await clubButton.click();
		await this.waitForPageLoad();
	}
}
