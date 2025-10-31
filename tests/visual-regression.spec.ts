import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * Captures screenshots of key pages and compares them to baseline images
 * Run with: npm run test -- visual-regression
 */

test.describe('Visual Regression Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Set consistent viewport for screenshots
		await page.setViewportSize({ width: 1920, height: 1080 });
	});

	test('homepage visual regression', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Wait for any initial content to load
		await page.waitForTimeout(1000);
		
		// Capture full page screenshot
		await expect(page).toHaveScreenshot('homepage-full.png', {
			fullPage: true,
			maxDiffPixels: 100, // Allow small differences
		});
	});

	test('homepage with event loaded visual regression', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Fill in event input if present
		const eventInput = page.locator('input[type="text"], input[placeholder*="Event"]').first();
		if (await eventInput.count() > 0) {
			await eventInput.fill('PTAwMDAwNDEzMTQ90');
			await page.waitForTimeout(500);
		}
		
		// Click load button if present
		const loadButton = page.locator('button:has-text("Load"), button:has-text("Load Schedule")').first();
		if (await loadButton.count() > 0) {
			await loadButton.click();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000); // Wait for matches to load
		}
		
		// Capture viewport screenshot
		await expect(page).toHaveScreenshot('homepage-with-data.png', {
			fullPage: false,
			maxDiffPixels: 200,
		});
	});

	test('mobile homepage visual regression', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		await page.waitForTimeout(1000);
		
		await expect(page).toHaveScreenshot('homepage-mobile.png', {
			fullPage: true,
			maxDiffPixels: 100,
		});
	});

	test('match list view visual regression', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Load event data
		const eventInput = page.locator('input[type="text"], input[placeholder*="Event"]').first();
		if (await eventInput.count() > 0) {
			await eventInput.fill('PTAwMDAwNDEzMTQ90');
			await page.waitForTimeout(500);
			
			const loadButton = page.locator('button:has-text("Load"), button:has-text("Load Schedule")').first();
			if (await loadButton.count() > 0) {
				await loadButton.click();
				await page.waitForLoadState('networkidle');
				await page.waitForTimeout(2000);
			}
		}
		
		// Switch to list view if available
		const listViewButton = page.locator('button:has-text("List"), [data-view="list"]').first();
		if (await listViewButton.count() > 0) {
			await listViewButton.click();
			await page.waitForTimeout(500);
		}
		
		await expect(page).toHaveScreenshot('match-list-view.png', {
			fullPage: false,
			maxDiffPixels: 200,
		});
	});

	test('timeline view visual regression', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Load event data
		const eventInput = page.locator('input[type="text"], input[placeholder*="Event"]').first();
		if (await eventInput.count() > 0) {
			await eventInput.fill('PTAwMDAwNDEzMTQ90');
			await page.waitForTimeout(500);
			
			const loadButton = page.locator('button:has-text("Load"), button:has-text("Load Schedule")').first();
			if (await loadButton.count() > 0) {
				await loadButton.click();
				await page.waitForLoadState('networkidle');
				await page.waitForTimeout(2000);
			}
		}
		
		// Switch to timeline view if available
		const timelineViewButton = page.locator('button:has-text("Timeline"), [data-view="timeline"]').first();
		if (await timelineViewButton.count() > 0) {
			await timelineViewButton.click();
			await page.waitForTimeout(1000);
		}
		
		await expect(page).toHaveScreenshot('timeline-view.png', {
			fullPage: false,
			maxDiffPixels: 200,
		});
	});
});

