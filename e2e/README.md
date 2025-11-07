# CourtSync E2E & Visual Testing Suite

Comprehensive automated testing suite using Playwright to verify all pages, components, interactions, states, and user flows function as intended.

## Overview

This test suite provides:

- **User Journey Tests** - End-to-end flows for spectator and media personas
- **Live Scoring Tests** - Complete testing of match locking, scoring, and real-time sync
- **Visual Regression Tests** - Screenshot comparisons for all pages and states
- **Multi-Client Tests** - Concurrent user testing for lock prevention
- **Mobile Testing** - Responsive design verification

## Quick Start

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests in interactive mode
npm run test:e2e:ui

# Run only visual regression tests
npm run test:visual

# View test report
npm run test:report
```

## Test Structure

```
e2e/
├── page-objects/         # Page Object Models
│   ├── BasePage.ts       # Shared navigation and utilities
│   ├── SettingsPage.ts   # Persona selection
│   ├── ClubPage.ts       # Match listing
│   └── MatchDetailPage.ts # Live scoring interface
│
├── journeys/             # User flow tests
│   ├── spectator-journey.spec.ts  # Spectator persona workflows
│   ├── media-journey.spec.ts      # Media persona workflows
│   └── live-scoring.spec.ts       # Live scoring flows
│
└── visual/               # Visual regression tests
    └── page-snapshots.spec.ts     # Screenshot comparisons
```

## Test Coverage

### ✅ Phase 1 - Foundation (Tests Included)

- [x] Event selection and loading
- [x] Club selection navigation
- [x] Basic match display
- [x] API integration verification

### ✅ Phase 2 - Core Features (Tests Included)

- [x] Match filtering by division
- [x] Team favoriting (spectator)
- [x] Coverage planning (media)
- [x] "My Teams" view
- [x] Persona switching

### ✅ Phase 3 - Live Scoring (Comprehensive Testing)

- [x] Match locking (single client)
- [x] Multi-client lock prevention
- [x] Score entry (+1/-1 buttons)
- [x] Score persistence across sets
- [x] Real-time score synchronization
- [x] Lock/unlock flows
- [x] All bug fixes from `docs/live-scoring-fixes.md`

### 📋 Phase 4 - Polish (Tests Pending)

- [ ] Conflict detection
- [ ] Coverage statistics
- [ ] Mobile optimization verification

## User Journey Tests

### Spectator Journey (`e2e/journeys/spectator-journey.spec.ts`)

Tests the complete spectator workflow:

1. **Persona Selection** - Select spectator persona and verify it persists
2. **View Matches** - Navigate to All Matches, verify match list displays
3. **Match Details** - View individual match details (read-only)
4. **Live Scores** - See real-time score updates
5. **Navigation** - Use bottom nav to switch between pages

**Key Assertions:**
- Spectator cannot access scoring controls
- Matches display correctly with all required information
- Live indicators appear for in-progress matches
- Navigation works across all pages

### Media Journey (`e2e/journeys/media-journey.spec.ts`)

Tests the complete media/photographer workflow:

1. **Persona Selection** - Select media persona
2. **Coverage Planning** - Add matches to coverage plan
3. **View Coverage** - Navigate to coverage page, verify selections
4. **Filter Uncovered** - Toggle "show only uncovered" filter
5. **Live Scoring Access** - Access match locking controls

**Key Assertions:**
- Media persona shows Coverage navigation tab
- Can select matches for coverage plan
- Scoring controls are accessible
- Coverage plan persists across navigation

### Live Scoring Tests (`e2e/journeys/live-scoring.spec.ts`)

Comprehensive tests for Phase 3 live scoring features:

#### Single Client Tests

- **Lock → Score → Unlock Flow**
  - Lock match successfully
  - Enter scores for all 5 sets
  - Test +1/-1 buttons
  - Verify scores cannot go negative
  - Scores persist across set changes
  - Unlock returns to locked state

- **Score Persistence**
  - Scores persist after page refresh
  - Scores visible in read-only display after unlock

#### Multi-Client Tests

- **Lock Prevention**
  - Client 1 locks match
  - Client 2 sees "locked by another user" message
  - Client 2 cannot access scoring controls
  - Client 1 updates scores
  - Client 2 sees real-time score updates
  - Client 1 unlocks
  - Client 2 can now lock

#### Edge Case Tests

- **Rapid Updates** - Handle rapid clicking of score buttons
- **All 5 Sets** - Verify each set works independently
- **Negative Score Prevention** - Scores cannot go below 0

## Visual Regression Tests

### Page Snapshots (`e2e/visual/page-snapshots.spec.ts`)

Captures screenshots of all major pages and UI states:

#### Desktop Views

- Settings page (spectator and media personas)
- Club page (all matches view)
- Club page with live matches
- Match detail (unlocked state)
- Match detail (locked with scoring controls)
- Match detail (with scores entered)
- My Teams page
- Coverage page (media only)
- Filters page

#### Mobile Views (375x667 - iPhone SE)

- Club page mobile layout
- Match detail mobile layout
- Settings page mobile
- Bottom navigation

#### Component States

- Match card (default, live, selected for coverage)
- Score display (all sets)
- Navigation tabs
- Filter indicators

### Running Visual Tests

```bash
# Run visual tests
npm run test:visual

# Update baseline screenshots (after intentional UI changes)
npm run test:visual:update

# View visual diff report
npm run test:report
```

## Test Reports

After running tests, Playwright generates comprehensive reports:

```bash
# View HTML report with screenshots and videos
npm run test:report
```

Reports include:
- Test execution timeline
- Screenshots on failure
- Videos of failed tests
- Trace files for debugging
- Visual diffs for regression tests

## Debugging Tests

### Interactive Mode

```bash
# Run tests with Playwright Inspector
npm run test:e2e:ui
```

Provides:
- Step-by-step test execution
- DOM snapshots at each step
- Network request inspection
- Console log viewer

### Debug Mode

```bash
# Run tests in debug mode (pauses at breakpoints)
npm run test:e2e:debug
```

### Headed Mode

```bash
# See browser while tests run
npm run test:e2e:headed
```

## Continuous Integration

### Running in CI

```bash
# CI-optimized test run
CI=true npm run test:e2e
```

CI mode:
- Runs with 2 retries for flaky tests
- Uses 1 worker (sequential execution)
- Generates JSON report for CI tools
- Captures videos/screenshots on failure

### Pre-Commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run test:e2e
```

## Test Data

Tests use the default event ID: `PTAwMDAwNDEzMTQ90`

For testing with custom data:
1. Create fixtures in `e2e/fixtures/`
2. Mock API responses in tests
3. Update event ID in test constants

## Common Issues

### Tests Failing Locally

1. **Port Already in Use**
   ```bash
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill
   ```

2. **Stale Snapshots**
   ```bash
   # Update visual snapshots after UI changes
   npm run test:visual:update
   ```

3. **Timeout Errors**
   - Increase timeout in `playwright.config.ts`
   - Check network speed
   - Verify dev server is running

### Visual Test Differences

Screenshot differences can occur due to:
- Font rendering differences (OS-specific)
- Browser version changes
- Viewport size variations

Use `npm run test:report` to review visual diffs and determine if they're intentional.

## Writing New Tests

### 1. Create Page Object (if needed)

```typescript
// e2e/page-objects/NewPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
  readonly someElement: Locator;

  constructor(page: Page) {
    super(page);
    this.someElement = page.getByRole('button', { name: 'Example' });
  }

  async someAction() {
    await this.someElement.click();
  }
}
```

### 2. Write Test

```typescript
// e2e/journeys/new-feature.spec.ts
import { test, expect } from '@playwright/test';
import { NewPage } from '../page-objects/NewPage';

test.describe('New Feature Tests', () => {
  test('should do something', async ({ page }) => {
    const newPage = new NewPage(page);
    await newPage.visit();
    await newPage.someAction();
    await expect(newPage.someElement).toBeVisible();
  });
});
```

### 3. Add Visual Test

```typescript
test('New Page Snapshot', async ({ page }) => {
  const newPage = new NewPage(page);
  await newPage.visit();
  await expect(page).toHaveScreenshot('new-page.png');
});
```

## Test Maintenance

### When to Update Tests

- **Feature Changes** - Update relevant journey tests
- **UI Changes** - Update visual snapshots: `npm run test:visual:update`
- **New Pages** - Add page object + tests
- **Bug Fixes** - Add regression test

### Test Review Checklist

- [ ] All tests pass locally
- [ ] Visual diffs reviewed and approved
- [ ] Page objects updated for new UI elements
- [ ] Test descriptions are clear
- [ ] No hardcoded waits (use Playwright's built-in waiting)
- [ ] Screenshots captured for new pages/states

## Performance

Current test execution time:
- **Unit Tests (Vitest)**: ~2 seconds
- **E2E Tests (Playwright)**: ~3-5 minutes
- **Visual Tests**: ~2 minutes
- **Full Suite**: ~7 minutes

Optimization tips:
- Run tests in parallel (default)
- Use `test.describe.configure({ mode: 'parallel' })` for independent tests
- Mock slow API calls where appropriate
- Use `test.skip()` for WIP tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Pattern](https://playwright.dev/docs/pom)
- [Visual Testing Guide](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Support

For questions or issues with tests:
1. Check this README
2. Review test reports: `npm run test:report`
3. Run in debug mode: `npm run test:e2e:debug`
4. Check Playwright docs
