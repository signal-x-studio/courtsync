# Testing & Design System Audits

This project includes a comprehensive testing framework adapted from the nino-chavez-gallery project for automated visual quality and design system audits.

## Framework Overview

The testing framework consists of three main components:

1. **Screenshot Generation** - Automated capture of screenshots across breakpoints
2. **Automated UX Audits** - Programmatic checks for design system violations
3. **Visual Regression** - Comparison against baseline screenshots
4. **Subagent-Based Audits** - AI-reviewable audit reports with metadata

## Test Types

### 1. UX Audit Screenshots (`tests/ux-audit-screenshots.spec.ts`)

Generates screenshots for manual/AI review:
- Multiple breakpoints (mobile, tablet, desktop)
- Viewport and full-page screenshots
- Hover and focus state captures
- Outputs to `.agent-os/audits/screenshots/`

**Run:** `npm run test:screenshots`

### 2. Automated UX Audit (`tests/ux-audit-automated.spec.ts`)

Programmatic checks for design violations:
- **Chrome-to-content ratio** (P0 if >60%, P1 if >40%)
- **Content burial** (first content below 50% viewport = P0)
- **Component count** (chrome components >15 = P1, >20 = P0)
- **Gestalt principles** (sort proximity, visual hierarchy)
- Generates JSON reports with severity ratings

**Run:** `npm run test:audit`

**Output:** `.agent-os/audits/automated/audit-summary.json`

### 3. Visual Regression (`tests/visual-regression.spec.ts`)

Compares screenshots against baseline:
- Detects visual changes
- Supports multiple viewports
- Fails on significant differences (>100-200 pixels)

**Run:** `npm run test:visual`

**Update baselines:** `npm run test:visual -- --update-snapshots`

### 4. Subagent Audit Script (`scripts/audit-screenshots.js`)

Enhanced screenshot capture with metadata:
- Captures screenshots with audit metadata
- Generates JSON report for AI review
- Includes chrome ratio, content position, viewport info

**Run:** `npm run audit:capture`

**Output:** `.agent-os/audits/screenshots/audit-report.json`

## Usage

### Running All Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test suite
npm run test:visual      # Visual regression only
npm run test:audit       # Automated UX audit only
npm run test:screenshots # Screenshot generation only
```

### Generating Audit Reports

```bash
# Capture screenshots with metadata
npm run audit:capture

# Run automated audit
npm run test:audit

# Review reports
cat .agent-os/audits/automated/audit-summary.json
cat .agent-os/audits/screenshots/audit-report.json
```

### Debugging Tests

```bash
# Run with debugger
npm run test:debug

# Run specific test
npx playwright test tests/visual-regression.spec.ts --debug

# View test report
npm run test:report
```

## Audit Metrics

### Chrome-to-Content Ratio

**Target:** <40% chrome / >60% content

Measures the ratio of UI chrome (header, filters, controls) to actual content (matches, timeline, etc.).

- **P0 (Critical):** >60% chrome
- **P1 (High):** >40% chrome
- **Pass:** ≤40% chrome

### Content Burial

**Target:** First content visible within 50% of viewport

Ensures users can see actual content without scrolling.

- **P0 (Critical):** First content below 50% viewport
- **Pass:** Content visible above fold

### Component Count

**Target:** ≤15 chrome components

Limits UI complexity in chrome areas (header, filters, controls).

- **P0 (Critical):** >20 components
- **P1 (High):** >15 components
- **Pass:** ≤15 components

### Gestalt Principles

- **Sort Proximity:** Sort controls should be within 100px of content
- **Visual Hierarchy:** Content should be visually prominent
- **Progressive Disclosure:** Filters should be collapsible on mobile

## Adapting for New Pages

To add new pages to the audit framework:

1. **Update page lists** in:
   - `tests/ux-audit-screenshots.spec.ts` → `PAGES_TO_AUDIT`
   - `tests/ux-audit-automated.spec.ts` → `PAGES_TO_AUDIT`
   - `tests/visual-regression.spec.ts` → Add new test cases
   - `scripts/audit-screenshots.js` → `pages` array

2. **Add page-specific selectors** if needed:
   - Update `runAudit()` function in `ux-audit-automated.spec.ts`
   - Add data attributes to components: `data-match-card`, `data-timeline`, etc.

3. **Create visual regression test**:
   ```typescript
   test('new-page visual regression', async ({ page }) => {
     await page.goto('/new-page');
     await page.waitForLoadState('networkidle');
     await expect(page).toHaveScreenshot('new-page.png', {
       fullPage: false,
       maxDiffPixels: 200,
     });
   });
   ```

## Integration with CI/CD

The framework is designed to fail builds on P0 violations:

```yaml
# Example GitHub Actions
- name: Run UX Audits
  run: npm run test:audit
  
- name: Run Visual Regression
  run: npm run test:visual
```

## Reference Documentation

For detailed patterns and standards, see:
- `docs/CODING_STANDARDS.md` (if created)
- `docs/COMPONENT_PATTERNS.md` (if created)
- `docs/MOBILE_UX_AUDIT.md` (if created)

## Troubleshooting

### Screenshots not generating

- Ensure dev server is running: `npm run dev`
- Check port matches `playwright.config.ts` baseURL
- Verify breakpoints are valid viewport sizes

### Tests failing on CI

- Use `process.env.CI` checks in config
- Increase timeouts for slower CI environments
- Check that screenshots are committed to git (for visual regression)

### Audit metrics incorrect

- Verify component selectors match your HTML structure
- Update `runAudit()` function selectors
- Add data attributes to key components for reliable selection

## Next Steps

1. **Add more pages** as routes are created
2. **Customize audit metrics** for courtSync-specific needs
3. **Create design system documentation** referencing audit results
4. **Set up CI integration** to run audits on PRs
5. **Generate periodic reports** for design review

