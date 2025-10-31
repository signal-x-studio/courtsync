import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import * as path from 'path';

// Audit breakpoints
const AUDIT_BREAKPOINTS = [
	{ name: 'mobile', width: 375, height: 812 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'desktop', width: 1440, height: 900 },
];

// Pages to audit - adapt for coursync routes
const PAGES_TO_AUDIT = [
	{ name: 'home', url: '/' },
	// Add more routes as they're created
];

const OUTPUT_DIR = path.resolve(process.cwd(), '.agent-os/audits/automated');

// Chrome-to-content ratio thresholds
const CHROME_RATIO_P0_THRESHOLD = 0.60; // Critical: >60%
const CHROME_RATIO_P1_THRESHOLD = 0.40; // High: >40%

// Automated audit script (adapted for coursync)
async function runAudit(page: any) {
	return await page.evaluate(() => {
		const audit: any = {
			timestamp: new Date().toISOString(),
			url: window.location.href,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			metrics: {},
			violations: []
		};

		// Measure chrome ratio
		const header = document.querySelector('header');
		const controls = document.querySelector('[data-controls]');
		const filterSection = document.querySelector('.sticky.top-0');
		const eventInput = document.querySelector('[data-event-input]');

		// Calculate chrome height (header + any sticky filter sections + event input)
		const chromeHeight = (filterSection?.clientHeight || 0) + 
			(header?.offsetHeight || 0) + 
			(eventInput?.clientHeight || 0);
		const chromeRatio = chromeHeight / window.innerHeight;

		audit.metrics.chromeRatio = {
			value: chromeRatio,
			chromeHeight,
			viewportHeight: window.innerHeight,
			pass: chromeRatio <= 0.40,
			severity: chromeRatio > 0.60 ? 'P0' : chromeRatio > 0.40 ? 'P1' : null
		};

		if (!audit.metrics.chromeRatio.pass) {
			audit.violations.push({
				type: 'Chrome-to-content ratio',
				severity: audit.metrics.chromeRatio.severity,
				value: `${(chromeRatio * 100).toFixed(1)}%`,
				chromeHeight,
				viewportHeight: window.innerHeight,
				fix: 'Reduce header height, collapse filters, use inline utilities'
			});
		}

		// Check content above fold - look for match cards or timeline
		const isLandingPage = document.querySelector('.min-h-screen');
		const firstMatch = document.querySelector('[data-match-card], .match-card, [data-testid="match"]');
		const timeline = document.querySelector('[data-timeline], .timeline-view');

		if (isLandingPage && !firstMatch && !timeline) {
			audit.metrics.contentAboveFold = {
				value: null,
				pass: true,
				note: 'Landing page detected - skipping content burial check'
			};
		} else if (firstMatch) {
			const matchTop = firstMatch.getBoundingClientRect().top;
			const contentAboveFold = matchTop < window.innerHeight * 0.5;

			audit.metrics.contentAboveFold = {
				value: matchTop,
				pass: contentAboveFold,
				severity: !contentAboveFold ? 'P0' : null
			};

			if (!contentAboveFold) {
				audit.violations.push({
					type: 'Content burial',
					severity: 'P0',
					value: `First match at ${matchTop}px (below 50% of viewport)`,
					fix: 'Collapse chrome to bring content above fold'
				});
			}
		} else {
			audit.metrics.contentAboveFold = {
				value: null,
				pass: null,
				note: 'No match cards found on page (may be landing/input page)'
			};
		}

		// Component count (only count CHROME components, not content like match cards)
		const chromeComponents = document.querySelectorAll(
			'header button, header input, header select, [data-filter], nav button, nav input, nav select, .sticky button:not([data-match-card] button), [data-event-input] button'
		);
		const matchCardButtons = document.querySelectorAll('[data-match-card] button, .match-card button');

		audit.metrics.componentCount = {
			chromeComponents: chromeComponents.length,
			matchCardButtons: matchCardButtons.length,
			total: chromeComponents.length + matchCardButtons.length,
			pass: chromeComponents.length <= 15,
			severity: chromeComponents.length > 20 ? 'P1' : null
		};

		if (chromeComponents.length > 15) {
			audit.violations.push({
				type: 'Excessive chrome component count',
				severity: chromeComponents.length > 20 ? 'P1' : 'P2',
				value: `${chromeComponents.length} interactive controls in chrome (excluding match cards)`,
				fix: 'Consolidate header/filter controls, use dropdowns instead of multiple buttons'
			});
		}

		// Gestalt: Check sort proximity to content (if applicable)
		const sortControl = document.querySelector('select[aria-label*="sort" i], [data-sort]');
		const content = document.querySelector('[data-match-list], [data-timeline], .match-list, .timeline-view');

		if (sortControl && content) {
			const sortPos = sortControl.getBoundingClientRect();
			const contentPos = content.getBoundingClientRect();
			const distance = Math.abs(contentPos.top - sortPos.bottom);

			audit.metrics.sortProximity = {
				value: distance,
				pass: distance <= 100,
				severity: distance > 200 ? 'P1' : null
			};

			if (distance > 100) {
				audit.violations.push({
					type: 'Gestalt violation - Sort proximity',
					severity: distance > 200 ? 'P1' : 'P2',
					value: `${distance}px from content`,
					fix: 'Move sort control closer to content (within 100px)'
				});
			}
		}

		// Overall pass/fail
		audit.pass = audit.violations.filter((v: any) => v.severity === 'P0').length === 0;
		audit.grade = audit.pass ? (audit.violations.length === 0 ? 'A' : 'B') : 'F';

		return audit;
	});
}

test.describe('Automated UX/UI Audit - Content-First Hierarchy', () => {
	test.beforeAll(async () => {
		await fs.mkdir(OUTPUT_DIR, { recursive: true });
	});

	for (const pageDef of PAGES_TO_AUDIT) {
		for (const breakpoint of AUDIT_BREAKPOINTS) {
			test(`${pageDef.name} at ${breakpoint.name} (${breakpoint.width}px) - Audit`, async ({ page }) => {
				await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });

				await page.goto(`http://localhost:5173${pageDef.url}`, {
					waitUntil: 'networkidle',
					timeout: 30000,
				});

				// Wait for animations
				await page.waitForTimeout(1500);

				// Run automated audit
				const auditResults = await runAudit(page);

				// Log results
				console.log(`\n=== ${pageDef.name.toUpperCase()} @ ${breakpoint.name.toUpperCase()} ===`);
				console.log(`Grade: ${auditResults.grade}`);
				console.log(`Chrome Ratio: ${(auditResults.metrics.chromeRatio.value * 100).toFixed(1)}% (${auditResults.metrics.chromeRatio.chromeHeight}px / ${auditResults.metrics.chromeRatio.viewportHeight}px)`);

				if (auditResults.violations.length > 0) {
					console.log('\nViolations:');
					auditResults.violations.forEach((v: any, i: number) => {
						console.log(`  ${i + 1}. [${v.severity}] ${v.type}: ${v.value}`);
						console.log(`     Fix: ${v.fix}`);
					});
				} else {
					console.log('✅ No violations');
				}

				// Save audit results
				await fs.writeFile(
					path.join(OUTPUT_DIR, `${breakpoint.name}-${pageDef.name}-audit.json`),
					JSON.stringify(auditResults, null, 2)
				);

				// Take screenshot with audit overlay
				await page.screenshot({
					path: path.join(OUTPUT_DIR, `${breakpoint.name}-${pageDef.name}-viewport.png`),
					fullPage: false,
				});

				// Assertions based on severity

				// P0: Critical violations must fail test
				const p0Violations = auditResults.violations.filter((v: any) => v.severity === 'P0');
				expect(p0Violations.length, `P0 violations found:\n${p0Violations.map((v: any) => `  - ${v.type}: ${v.value}`).join('\n')}`).toBe(0);

				// Chrome ratio assertion (P0 if >60%, P1 if >40%)
				if (auditResults.metrics.chromeRatio.value > CHROME_RATIO_P0_THRESHOLD) {
					throw new Error(
						`[P0] Chrome-to-content ratio too high: ${(auditResults.metrics.chromeRatio.value * 100).toFixed(1)}% (threshold: ${CHROME_RATIO_P0_THRESHOLD * 100}%)\n` +
						`Chrome height: ${auditResults.metrics.chromeRatio.chromeHeight}px\n` +
						`Viewport height: ${auditResults.metrics.chromeRatio.viewportHeight}px`
					);
				}

				// Log P1 violations as warnings (don't fail test, but report)
				const p1Violations = auditResults.violations.filter((v: any) => v.severity === 'P1');
				if (p1Violations.length > 0) {
					console.warn(`\n⚠️  ${p1Violations.length} P1 violation(s) - should be addressed:`);
					p1Violations.forEach((v: any) => {
						console.warn(`    - ${v.type}: ${v.value}`);
					});
				}

				// Pass if no P0 violations
				expect(auditResults.pass).toBe(true);
			});
		}
	}
});

// Summary test - generate consolidated report
test('Generate consolidated audit report', async () => {
	const files = await fs.readdir(OUTPUT_DIR);
	const auditFiles = files.filter(f => f.endsWith('-audit.json'));

	const allResults: any[] = [];

	for (const file of auditFiles) {
		const content = await fs.readFile(path.join(OUTPUT_DIR, file), 'utf-8');
		const audit = JSON.parse(content);
		allResults.push({
			file: file.replace('-audit.json', ''),
			...audit
		});
	}

	// Group by severity
	const p0Count = allResults.reduce((sum, r) => sum + r.violations.filter((v: any) => v.severity === 'P0').length, 0);
	const p1Count = allResults.reduce((sum, r) => sum + r.violations.filter((v: any) => v.severity === 'P1').length, 0);
	const p2Count = allResults.reduce((sum, r) => sum + r.violations.filter((v: any) => v.severity === 'P2').length, 0);

	const report = {
		timestamp: new Date().toISOString(),
		summary: {
			totalPages: PAGES_TO_AUDIT.length,
			totalBreakpoints: AUDIT_BREAKPOINTS.length,
			totalAudits: allResults.length,
			violations: {
				p0: p0Count,
				p1: p1Count,
				p2: p2Count,
				total: p0Count + p1Count + p2Count
			},
			grades: {
				A: allResults.filter(r => r.grade === 'A').length,
				B: allResults.filter(r => r.grade === 'B').length,
				C: allResults.filter(r => r.grade === 'C').length,
				D: allResults.filter(r => r.grade === 'D').length,
				F: allResults.filter(r => r.grade === 'F').length,
			}
		},
		results: allResults
	};

	await fs.writeFile(
		path.join(OUTPUT_DIR, 'audit-summary.json'),
		JSON.stringify(report, null, 2)
	);

	console.log('\n=== AUDIT SUMMARY ===');
	console.log(`Total audits: ${report.summary.totalAudits}`);
	console.log(`\nViolations:`);
	console.log(`  P0 (Critical): ${p0Count}`);
	console.log(`  P1 (High): ${p1Count}`);
	console.log(`  P2 (Medium): ${p2Count}`);
	console.log(`\nGrades:`);
	console.log(`  A: ${report.summary.grades.A}`);
	console.log(`  B: ${report.summary.grades.B}`);
	console.log(`  C: ${report.summary.grades.C}`);
	console.log(`  D: ${report.summary.grades.D}`);
	console.log(`  F: ${report.summary.grades.F}`);
	console.log(`\nReport saved to: ${path.join(OUTPUT_DIR, 'audit-summary.json')}`);

	// Fail if any P0 violations found
	expect(p0Count, `${p0Count} P0 violations found - see audit-summary.json for details`).toBe(0);
});

