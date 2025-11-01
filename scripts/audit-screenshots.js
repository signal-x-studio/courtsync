import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Subagent-Based Visual Quality Audit
 * 
 * This script captures screenshots and generates a comprehensive audit report
 * that can be reviewed by an AI agent for visual quality and design assessment.
 * 
 * Usage: npm run audit:capture
 */

const breakpoints = [
	{ name: 'mobile', width: 375, height: 812 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'desktop', width: 1920, height: 1080 },
];

const pages = [
	{ path: '/', name: 'home' },
	// Add more pages as they're created
];

const OUTPUT_DIR = path.resolve(process.cwd(), '.agent-os/audits/screenshots');

interface AuditMetadata {
	timestamp: string;
	breakpoint: string;
	page: string;
	viewport: { width: number; height: number };
	screenshotPath: string;
	metadata: {
		url: string;
		title: string;
		chromeRatio?: number;
		contentAboveFold?: boolean;
	};
}

async function captureScreenshots() {
	const browser = await chromium.launch();
	const audits: AuditMetadata[] = [];

	// Ensure output directory exists
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	for (const bp of breakpoints) {
		const context = await browser.newContext({
			viewport: { width: bp.width, height: bp.height },
			deviceScaleFactor: 2, // For high-quality screenshots
		});
		const page = await context.newPage();

		for (const pageInfo of pages) {
			try {
				await page.goto(`http://localhost:5173${pageInfo.path}`, {
					waitUntil: 'networkidle',
					timeout: 30000
				});

				// Wait for animations to settle
				await page.waitForTimeout(1000);

				// Capture metadata
				const metadata = await page.evaluate(() => {
					const header = document.querySelector('header');
					const chromeHeight = header?.offsetHeight || 0;
					const chromeRatio = chromeHeight / window.innerHeight;

					// Check if content is above fold
					const firstContent = document.querySelector('[data-match-card], .match-card, [data-timeline]');
					const contentAboveFold = firstContent ? firstContent.getBoundingClientRect().top < window.innerHeight * 0.5 : false;

					return {
						url: window.location.href,
						title: document.title,
						chromeRatio,
						contentAboveFold
					};
				});

				// Capture viewport screenshot
				const screenshotPath = path.join(OUTPUT_DIR, `audit-${bp.name}-${pageInfo.name}.png`);
				await page.screenshot({
					path: screenshotPath,
					fullPage: false
				});

				// Store audit metadata
				audits.push({
					timestamp: new Date().toISOString(),
					breakpoint: bp.name,
					page: pageInfo.name,
					viewport: { width: bp.width, height: bp.height },
					screenshotPath: screenshotPath,
					metadata
				});

				console.log(`✓ Captured ${bp.name} - ${pageInfo.name}`);
			} catch (error: any) {
				console.error(`✗ Failed to capture ${bp.name} - ${pageInfo.name}:`, error.message);
			}
		}

		await context.close();
	}

	await browser.close();

	// Generate audit report
	const report = {
		timestamp: new Date().toISOString(),
		totalScreenshots: audits.length,
		summary: {
			breakpoints: breakpoints.map(bp => ({
				name: bp.name,
				screenshots: audits.filter(a => a.breakpoint === bp.name).length
			})),
			pages: pages.map(p => ({
				name: p.name,
				screenshots: audits.filter(a => a.page === p.name).length
			}))
		},
		audits
	};

	// Save audit report
	const reportPath = path.join(OUTPUT_DIR, 'audit-report.json');
	await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

	console.log(`\n=== AUDIT COMPLETE ===`);
	console.log(`Total screenshots: ${audits.length}`);
	console.log(`Report saved to: ${reportPath}`);
	console.log(`\nScreenshots:`);
	audits.forEach(a => {
		console.log(`  - ${a.breakpoint}/${a.page}: ${a.screenshotPath}`);
		console.log(`    Chrome ratio: ${(a.metadata.chromeRatio || 0 * 100).toFixed(1)}%`);
		console.log(`    Content above fold: ${a.metadata.contentAboveFold ? 'Yes' : 'No'}`);
	});

	return report;
}

captureScreenshots().catch(console.error);
