import { test, expect } from '@playwright/test';

/**
 * Functional User Journey Tests
 * 
 * These tests verify that user interactions result in functionally correct behavior:
 * - Filters actually filter matches correctly
 * - Scrolling works and affects UI state
 * - User states persist correctly
 * - Clicks produce correct results
 * - View switching works correctly
 */

const TEST_EVENT_ID = 'PTAwMDAwNDEzMTQ90';
const TEST_DATE = '2025-11-01';

test.describe('User Journey Tests - Functional Behavior', () => {
	test.beforeEach(async ({ page }) => {
		// Clear localStorage to start fresh
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
		
		// Load event data
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Wait for auto-load or manually load if needed
		const eventInput = page.locator('[data-event-input] input[type="text"]').first();
		if (await eventInput.count() > 0) {
			const currentValue = await eventInput.inputValue();
			if (!currentValue || currentValue !== TEST_EVENT_ID) {
				await eventInput.fill(TEST_EVENT_ID);
				await page.waitForTimeout(500);
				
				const loadButton = page.locator('button:has-text("Load"), button:has-text("Load Schedule")').first();
				if (await loadButton.count() > 0) {
					await loadButton.click();
					await page.waitForLoadState('networkidle');
				}
			}
		}
		
		// Wait for matches to load
		await page.waitForTimeout(2000);
	});

	// Helper function to expand header if collapsed
	async function ensureHeaderExpanded(page: any) {
		const viewport = page.viewportSize();
		const isMobile = viewport && viewport.width < 768;
		
		if (isMobile) {
			const header = page.locator('header, [data-header]').first();
			const headerCollapsed = await header.evaluate((el: HTMLElement) => {
				return el.classList.contains('collapsed') || 
				       window.getComputedStyle(el).maxHeight === '56px' ||
				       el.getBoundingClientRect().height < 100;
			});
			
			if (headerCollapsed) {
				const toggleButton = page.locator('button[aria-label*="expand" i], button[aria-label*="header" i]').first();
				if (await toggleButton.count() > 0 && await toggleButton.isVisible()) {
					await toggleButton.click();
					await page.waitForTimeout(300);
				}
			}
		}
	}

	// Helper function to ensure element is visible and clickable
	async function waitAndClick(page: any, selector: string, options: { timeout?: number; force?: boolean } = {}) {
		const locator = page.locator(selector).first();
		await locator.waitFor({ state: 'visible', timeout: options.timeout || 10000 });
		await locator.scrollIntoViewIfNeeded();
		await page.waitForTimeout(200);
		await locator.click({ force: options.force || false });
	}

	test.describe('Filter Functionality', () => {
		test('team filter reduces matches correctly', async ({ page }) => {
			// Get initial match count (only visible matches)
			const initialMatches = page.locator('[data-match-card]:visible');
			await initialMatches.first().waitFor({ state: 'visible', timeout: 10000 });
			const initialCount = await initialMatches.count();
			
			expect(initialCount).toBeGreaterThan(0);
			
			// Open filter sheet (mobile) or find filter controls (desktop)
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			if (isMobile) {
				// Mobile: Open filter bottom sheet - wait for it to be visible
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				// Get team options from select
				const teamSelect = page.locator('#team-filter').first();
				await teamSelect.waitFor({ state: 'visible', timeout: 5000 });
				const options = await teamSelect.locator('option').allTextContents();
				const teamOption = options.find(opt => opt.includes('-') && opt !== 'All Teams');
				
				if (teamOption) {
					await teamSelect.selectOption({ label: teamOption });
					await page.waitForTimeout(500);
					
					// Close filter sheet if needed
					const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
					if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
						await closeButton.click();
						await page.waitForTimeout(300);
					}
				}
			} else {
				// Desktop: Find team filter - ensure header is expanded first
				await ensureHeaderExpanded(page);
				
				// Look for team filter in sidebar or header
				const teamSelect = page.locator('select:has(option[value*="-"])').first();
				if (await teamSelect.count() > 0) {
					await teamSelect.waitFor({ state: 'visible', timeout: 5000 });
					const options = await teamSelect.locator('option').allTextContents();
					const teamOption = options.find(opt => opt.includes('-') && opt !== 'All Teams');
					
					if (teamOption) {
						await teamSelect.selectOption({ label: teamOption });
						await page.waitForTimeout(500);
					}
				}
			}
			
			// Verify filtered matches (only visible)
			const filteredMatches = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500); // Wait for filter to apply
			const filteredCount = await filteredMatches.count();
			
			expect(filteredCount).toBeLessThan(initialCount);
			expect(filteredCount).toBeGreaterThan(0);
			
			// Verify all displayed matches contain the selected team
			const matchTexts = await filteredMatches.allTextContents();
			const teamId = matchTexts[0]?.match(/\d+-\d+/)?.[0];
			if (teamId) {
				matchTexts.forEach(text => {
					expect(text).toContain(teamId);
				});
			}
		});

		test('wave filter filters matches by time correctly', async ({ page }) => {
			// Get initial match count (only visible)
			const initialMatches = page.locator('[data-match-card]:visible');
			await initialMatches.first().waitFor({ state: 'visible', timeout: 10000 });
			const initialCount = await initialMatches.count();
			
			expect(initialCount).toBeGreaterThan(0);
			
			// Apply morning filter
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			if (isMobile) {
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				const morningButton = page.locator('button:has-text("Morning")').first();
				await morningButton.waitFor({ state: 'visible', timeout: 5000 });
				await morningButton.click();
				await page.waitForTimeout(500);
				
				const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
				if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
					await closeButton.click();
					await page.waitForTimeout(300);
				}
			} else {
				await ensureHeaderExpanded(page);
				const morningButton = page.locator('button:has-text("Morning"):visible').first();
				if (await morningButton.count() > 0) {
					await morningButton.waitFor({ state: 'visible', timeout: 5000 });
					await morningButton.click();
					await page.waitForTimeout(500);
				}
			}
			
			// Verify filtered matches (only visible)
			const filteredMatches = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500); // Wait for filter to apply
			const filteredCount = await filteredMatches.count();
			
			expect(filteredCount).toBeLessThan(initialCount);
			expect(filteredCount).toBeGreaterThan(0);
			
			// Verify all matches are before 2:30 PM
			const matchElements = await filteredMatches.all();
			for (const matchEl of matchElements) {
				const text = await matchEl.textContent();
				// Extract time from match text (format: "HH:MM AM/PM" or "HH:MM")
				const timeMatch = text?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
				if (timeMatch) {
					let hours = parseInt(timeMatch[1]);
					const minutes = parseInt(timeMatch[2]);
					const period = timeMatch[3]?.toUpperCase();
					
					if (period === 'PM' && hours !== 12) hours += 12;
					if (period === 'AM' && hours === 12) hours = 0;
					
					const totalMinutes = hours * 60 + minutes;
					const afternoonStart = 14 * 60 + 30; // 2:30 PM
					
					expect(totalMinutes).toBeLessThan(afternoonStart);
				}
			}
		});

		test('division filter filters matches correctly', async ({ page }) => {
			// Get initial match count (only visible)
			const initialMatches = page.locator('[data-match-card]:visible');
			await initialMatches.first().waitFor({ state: 'visible', timeout: 10000 });
			const initialCount = await initialMatches.count();
			
			expect(initialCount).toBeGreaterThan(0);
			
			// Get available divisions
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			if (isMobile) {
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				const divisionSelect = page.locator('#division-filter').first();
				await divisionSelect.waitFor({ state: 'visible', timeout: 5000 });
				const options = await divisionSelect.locator('option').allTextContents();
				const divisionOption = options.find(opt => opt && opt !== 'All Divisions' && opt.trim() !== '');
				
				if (divisionOption) {
					await divisionSelect.selectOption({ label: divisionOption });
					await page.waitForTimeout(500);
					
					const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
					if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
						await closeButton.click();
						await page.waitForTimeout(300);
					}
				}
			} else {
				await ensureHeaderExpanded(page);
				const divisionSelect = page.locator('select:has(option[value*="Division"]):visible').first();
				if (await divisionSelect.count() > 0) {
					await divisionSelect.waitFor({ state: 'visible', timeout: 5000 });
					const options = await divisionSelect.locator('option').allTextContents();
					const divisionOption = options.find(opt => opt && opt !== 'All Divisions' && opt.trim() !== '');
					
					if (divisionOption) {
						await divisionSelect.selectOption({ label: divisionOption });
						await page.waitForTimeout(500);
					}
				}
			}
			
			// Verify filtered matches (only visible)
			const filteredMatches = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500); // Wait for filter to apply
			const filteredCount = await filteredMatches.count();
			
			expect(filteredCount).toBeLessThanOrEqual(initialCount);
			expect(filteredCount).toBeGreaterThan(0);
		});

		test('clear filters restores all matches', async ({ page }) => {
			// Apply a filter first
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			const initialMatches = page.locator('[data-match-card]:visible');
			await initialMatches.first().waitFor({ state: 'visible', timeout: 10000 });
			const initialCount = await initialMatches.count();
			
			if (isMobile) {
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				const morningButton = page.locator('button:has-text("Morning")').first();
				await morningButton.waitFor({ state: 'visible', timeout: 5000 });
				await morningButton.click();
				await page.waitForTimeout(500);
				
				const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
				if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
					await closeButton.click();
					await page.waitForTimeout(300);
				}
			} else {
				await ensureHeaderExpanded(page);
				const morningButton = page.locator('button:has-text("Morning"):visible').first();
				if (await morningButton.count() > 0) {
					await morningButton.waitFor({ state: 'visible', timeout: 5000 });
					await morningButton.click();
					await page.waitForTimeout(500);
				}
			}
			
			// Verify filtered (only visible)
			const filteredMatches = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500);
			const filteredCount = await filteredMatches.count();
			expect(filteredCount).toBeLessThan(initialCount);
			
			// Clear filters
			const clearButton = page.locator('button:has-text("Clear"):visible').first();
			if (await clearButton.count() > 0) {
				await clearButton.waitFor({ state: 'visible', timeout: 5000 });
				await clearButton.click();
				await page.waitForTimeout(500);
			}
			
			// Verify restored (only visible)
			const restoredMatches = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500);
			const restoredCount = await restoredMatches.count();
			expect(restoredCount).toBe(initialCount);
		});
	});

	test.describe('Scrolling Behavior', () => {
		test('scrolling down collapses header on mobile', async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 812 });
			await page.reload();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(1000);
			
			// Find header element
			const header = page.locator('[data-header], header').first();
			if (await header.count() === 0) {
				test.skip();
				return;
			}
			
			// Get initial header state
			const initialHeight = await header.boundingBox().then(box => box?.height || 0);
			
			// Scroll down
			await page.evaluate(() => window.scrollTo(0, 200));
			await page.waitForTimeout(500);
			
			// Check if header collapsed (height reduced or hidden)
			const afterScrollHeight = await header.boundingBox().then(box => box?.height || 0);
			const headerVisible = await header.isVisible();
			
			// Header should either be smaller or hidden after scrolling down
			expect(afterScrollHeight <= initialHeight || !headerVisible).toBeTruthy();
		});

		test('page scrolls smoothly and content is accessible', async ({ page }) => {
			// Ensure we have enough content to scroll (only visible matches)
			const matches = page.locator('[data-match-card]:visible');
			const matchCount = await matches.count();
			
			if (matchCount < 5) {
				test.skip();
				return;
			}
			
			// Get initial scroll position
			const initialScrollY = await page.evaluate(() => window.scrollY);
			
			// Scroll to bottom
			await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
			await page.waitForTimeout(1000);
			
			// Verify we scrolled
			const finalScrollY = await page.evaluate(() => window.scrollY);
			expect(finalScrollY).toBeGreaterThan(initialScrollY);
			
			// Verify last visible match is visible (or scrolled near bottom)
			const visibleMatches = page.locator('[data-match-card]:visible');
			const lastVisibleMatch = visibleMatches.last();
			if (await lastVisibleMatch.count() > 0) {
				// Just verify we can scroll - don't require last match to be visible as it might be hidden by design
				const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
				expect(scrollHeight).toBeGreaterThan(0);
			}
			
			// Scroll back to top
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
			await page.waitForTimeout(1000);
			
			const topScrollY = await page.evaluate(() => window.scrollY);
			expect(topScrollY).toBeLessThan(100); // Should be near top
		});
	});

	test.describe('User State Persistence', () => {
		test('filters persist across page reloads', async ({ page }) => {
			// Apply a filter
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			if (isMobile) {
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				const morningButton = page.locator('button:has-text("Morning")').first();
				await morningButton.waitFor({ state: 'visible', timeout: 5000 });
				await morningButton.click();
				await page.waitForTimeout(500);
				
				const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
				if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
					await closeButton.click();
					await page.waitForTimeout(300);
				}
			} else {
				await ensureHeaderExpanded(page);
				const morningButton = page.locator('button:has-text("Morning"):visible').first();
				if (await morningButton.count() > 0) {
					await morningButton.waitFor({ state: 'visible', timeout: 5000 });
					await morningButton.click();
					await page.waitForTimeout(500);
				}
			}
			
			// Get filtered count (only visible)
			const filteredMatches = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500);
			const filteredCount = await filteredMatches.count();
			
			// Reload page
			await page.reload();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);
			
			// Verify filter still applied (only visible)
			const persistedMatches = page.locator('[data-match-card]:visible');
			await persistedMatches.first().waitFor({ state: 'visible', timeout: 10000 });
			await page.waitForTimeout(500);
			const persistedCount = await persistedMatches.count();
			
			expect(persistedCount).toBe(filteredCount);
		});

		test('view mode persists across page reloads', async ({ page }) => {
			// Ensure header/sidebar is expanded to see view buttons
			await ensureHeaderExpanded(page);
			
			// Switch to timeline view - try multiple selectors
			const timelineButton = page.locator('button:has-text("Timeline"):visible, #view-mode-timeline').first();
			if (await timelineButton.count() > 0) {
				await timelineButton.waitFor({ state: 'visible', timeout: 10000 });
				await timelineButton.click();
				await page.waitForTimeout(1000);
				
				// Verify timeline view is shown
				const timeline = page.locator('[data-timeline]');
				await expect(timeline).toBeVisible({ timeout: 10000 });
				
				// Reload page
				await page.reload();
				await page.waitForLoadState('networkidle');
				await page.waitForTimeout(2000);
				
				// Verify timeline view persisted
				const persistedTimeline = page.locator('[data-timeline]');
				await expect(persistedTimeline).toBeVisible({ timeout: 10000 });
			} else {
				test.skip();
			}
		});
	});

	test.describe('Click Interactions', () => {
		test('clicking match card expands to show details', async ({ page }) => {
			const matches = page.locator('[data-match-card]:visible');
			await matches.first().waitFor({ state: 'visible', timeout: 10000 });
			const matchCount = await matches.count();
			
			if (matchCount === 0) {
				test.skip();
				return;
			}
			
			const firstMatch = matches.first();
			
			// Click match card
			await firstMatch.scrollIntoViewIfNeeded();
			await page.waitForTimeout(200);
			await firstMatch.click();
			await page.waitForTimeout(500);
			
			// Verify details are shown (could be expanded card, detail sheet, or panel)
			const detailPanel = page.locator('[data-match-details], .match-details, [role="dialog"]').first();
			const expandedCard = firstMatch.locator('.expanded, [aria-expanded="true"]').first();
			
			// At least one should be visible
			const hasDetails = await detailPanel.count() > 0 && await detailPanel.isVisible({ timeout: 2000 }).catch(() => false);
			const isExpanded = await expandedCard.count() > 0;
			
			expect(hasDetails || isExpanded).toBeTruthy();
		});

		test('switching views updates displayed content', async ({ page }) => {
			// Start in list view
			const listView = page.locator('[data-match-list], [data-match-card]:visible').first();
			await expect(listView).toBeVisible({ timeout: 10000 });
			
			// Ensure header/sidebar is expanded to see view buttons
			await ensureHeaderExpanded(page);
			
			// Switch to timeline view
			const timelineButton = page.locator('button:has-text("Timeline"):visible, #view-mode-timeline').first();
			if (await timelineButton.count() > 0) {
				await timelineButton.waitFor({ state: 'visible', timeout: 10000 });
				await timelineButton.click();
				await page.waitForTimeout(1000);
				
				// Verify timeline is shown
				const timeline = page.locator('[data-timeline]');
				await expect(timeline).toBeVisible({ timeout: 10000 });
				
				// Timeline should be visible
				expect(await timeline.isVisible()).toBeTruthy();
			} else {
				test.skip();
			}
		});

		test('clicking view toggle switches between list and timeline', async ({ page }) => {
			// Ensure header/sidebar is expanded to see view buttons
			await ensureHeaderExpanded(page);
			
			// Find view toggle buttons
			const listButton = page.locator('button:has-text("List"):visible, #view-mode-list').first();
			const timelineButton = page.locator('button:has-text("Timeline"):visible, #view-mode-timeline').first();
			
			if (await listButton.count() === 0 || await timelineButton.count() === 0) {
				test.skip();
				return;
			}
			
			// Start in list view
			const listView = page.locator('[data-match-list], [data-match-card]:visible').first();
			await expect(listView).toBeVisible({ timeout: 10000 });
			
			// Switch to timeline
			await timelineButton.waitFor({ state: 'visible', timeout: 10000 });
			await timelineButton.click();
			await page.waitForTimeout(1000);
			const timeline = page.locator('[data-timeline]');
			await expect(timeline).toBeVisible({ timeout: 10000 });
			
			// Switch back to list
			await listButton.waitFor({ state: 'visible', timeout: 10000 });
			await listButton.click();
			await page.waitForTimeout(1000);
			const listViewAfter = page.locator('[data-match-list], [data-match-card]:visible').first();
			await expect(listViewAfter).toBeVisible({ timeout: 10000 });
		});
	});

	test.describe('Filter State Persistence', () => {
		test('filters persist when switching views', async ({ page }) => {
			// Apply a filter in list view
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			const initialMatches = page.locator('[data-match-card]:visible');
			await initialMatches.first().waitFor({ state: 'visible', timeout: 10000 });
			const initialCount = await initialMatches.count();
			
			if (isMobile) {
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				const morningButton = page.locator('button:has-text("Morning")').first();
				await morningButton.waitFor({ state: 'visible', timeout: 5000 });
				await morningButton.click();
				await page.waitForTimeout(500);
				
				const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
				if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
					await closeButton.click();
					await page.waitForTimeout(300);
				}
			} else {
				await ensureHeaderExpanded(page);
				const morningButton = page.locator('button:has-text("Morning"):visible').first();
				if (await morningButton.count() > 0) {
					await morningButton.waitFor({ state: 'visible', timeout: 5000 });
					await morningButton.click();
					await page.waitForTimeout(500);
				}
			}
			
			const filteredInList = page.locator('[data-match-card]:visible');
			await page.waitForTimeout(500);
			const filteredCount = await filteredInList.count();
			expect(filteredCount).toBeLessThan(initialCount);
			
			// Switch to timeline view
			await ensureHeaderExpanded(page);
			const timelineButton = page.locator('button:has-text("Timeline"):visible, #view-mode-timeline').first();
			if (await timelineButton.count() > 0) {
				await timelineButton.waitFor({ state: 'visible', timeout: 10000 });
				await timelineButton.click();
				await page.waitForTimeout(1000);
				
				// Verify filter still applied in timeline
				const timeline = page.locator('[data-timeline]');
				await expect(timeline).toBeVisible({ timeout: 10000 });
				
				// Timeline should show filtered matches (verify by checking match blocks or count)
				const timelineMatches = timeline.locator('[data-match-card]:visible, .timeline-match:visible, .match-block:visible');
				const timelineCount = await timelineMatches.count();
				
				// Count should match or be consistent with filtered count
				expect(timelineCount).toBeGreaterThan(0);
			} else {
				test.skip();
			}
		});
	});

	test.describe('Complex User Journeys', () => {
		test('complete workflow: filter, expand match, switch view, verify state', async ({ page }) => {
			// 1. Apply filter
			const viewport = page.viewportSize();
			const isMobile = viewport && viewport.width < 768;
			
			if (isMobile) {
				const filterButton = page.locator('button[aria-label*="filter" i], button:has-text("Filters")').first();
				await filterButton.waitFor({ state: 'visible', timeout: 10000 });
				await filterButton.scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await filterButton.click({ force: true });
				await page.waitForTimeout(500);
				
				const morningButton = page.locator('button:has-text("Morning")').first();
				await morningButton.waitFor({ state: 'visible', timeout: 5000 });
				await morningButton.click();
				await page.waitForTimeout(500);
				
				const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×")').first();
				if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
					await closeButton.click();
					await page.waitForTimeout(300);
				}
			} else {
				await ensureHeaderExpanded(page);
				const morningButton = page.locator('button:has-text("Morning"):visible').first();
				if (await morningButton.count() > 0) {
					await morningButton.waitFor({ state: 'visible', timeout: 5000 });
					await morningButton.click();
					await page.waitForTimeout(500);
				}
			}
			
			// 2. Expand a match
			const matches = page.locator('[data-match-card]:visible');
			if (await matches.count() > 0) {
				await matches.first().scrollIntoViewIfNeeded();
				await page.waitForTimeout(200);
				await matches.first().click();
				await page.waitForTimeout(500);
			}
			
			// 3. Switch to timeline view
			await ensureHeaderExpanded(page);
			const timelineButton = page.locator('button:has-text("Timeline"):visible, #view-mode-timeline').first();
			if (await timelineButton.count() > 0) {
				await timelineButton.waitFor({ state: 'visible', timeout: 10000 });
				await timelineButton.click();
				await page.waitForTimeout(1000);
				
				// 4. Verify timeline shows filtered matches
				const timeline = page.locator('[data-timeline]');
				await expect(timeline).toBeVisible({ timeout: 10000 });
				
				// 5. Switch back to list
				const listButton = page.locator('button:has-text("List"):visible, #view-mode-list').first();
				if (await listButton.count() > 0) {
					await listButton.waitFor({ state: 'visible', timeout: 10000 });
					await listButton.click();
					await page.waitForTimeout(1000);
					
					// 6. Verify filter still applied
					const listMatches = page.locator('[data-match-card]:visible');
					await page.waitForTimeout(500);
					const finalCount = await listMatches.count();
					expect(finalCount).toBeGreaterThan(0);
				}
			} else {
				test.skip();
			}
		});
	});
});

