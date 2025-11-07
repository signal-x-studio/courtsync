// Purpose: Test fixtures and utilities for Playwright tests
// Note: Provides common setup and helpers for E2E tests

import { test as base, expect } from '@playwright/test';

/**
 * Test fixture with common utilities
 */
export const test = base.extend({
	// Add custom fixtures here if needed
});

export { expect };

/**
 * Navigate to home page and wait for load
 */
export async function navigateToHome(page: any) {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
}

/**
 * Select spectator persona
 */
export async function selectSpectatorPersona(page: any) {
	// Click on spectator persona button if available
	const spectatorButton = page.locator('button:has-text("Spectator")');
	if (await spectatorButton.isVisible()) {
		await spectatorButton.click();
	}
}

/**
 * Select media persona
 */
export async function selectMediaPersona(page: any) {
	// Click on media persona button if available
	const mediaButton = page.locator('button:has-text("Media")');
	if (await mediaButton.isVisible()) {
		await mediaButton.click();
	}
}

/**
 * Accept analytics consent
 */
export async function acceptAnalyticsConsent(page: any) {
	const acceptButton = page.locator('button:has-text("Accept")');
	if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
		await acceptButton.click();
		await page.waitForTimeout(500);
	}
}

/**
 * Decline analytics consent
 */
export async function declineAnalyticsConsent(page: any) {
	const declineButton = page.locator('button:has-text("Decline")');
	if (await declineButton.isVisible({ timeout: 2000 }).catch(() => false)) {
		await declineButton.click();
		await page.waitForTimeout(500);
	}
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: any) {
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(500); // Extra buffer for client-side rendering
}

/**
 * Check if element contains text
 */
export async function expectToContainText(locator: any, text: string) {
	await expect(locator).toContainText(text);
}

/**
 * Check if element is visible
 */
export async function expectToBeVisible(locator: any) {
	await expect(locator).toBeVisible();
}

/**
 * Clear local storage
 */
export async function clearStorage(page: any) {
	await page.evaluate(() => {
		localStorage.clear();
		sessionStorage.clear();
	});
}

/**
 * Set local storage item
 */
export async function setLocalStorage(page: any, key: string, value: string) {
	await page.evaluate(
		({ k, v }) => {
			localStorage.setItem(k, v);
		},
		{ k: key, v: value }
	);
}

/**
 * Get local storage item
 */
export async function getLocalStorage(page: any, key: string): Promise<string | null> {
	return await page.evaluate(
		(k: string) => {
			return localStorage.getItem(k);
		},
		key
	);
}

/**
 * Mock API response
 */
export async function mockAPIResponse(page: any, url: string, response: any) {
	await page.route(url, (route: any) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(response)
		});
	});
}

/**
 * Wait for API call
 */
export async function waitForAPICall(page: any, url: string) {
	return await page.waitForResponse((response: any) => {
		return response.url().includes(url) && response.status() === 200;
	});
}
