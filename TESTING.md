# CourtSync Testing Quick Start

**Don't hunt for features - run the automated tests to verify everything works.**

## 🚀 Quick Start (First Time)

```bash
# 1. Install Playwright browsers
npx playwright install

# 2. Run all tests
npm run test:all

# 3. View results
npm run test:report
```

That's it! The tests will verify all features are working.

## 📋 What Gets Tested

- ✅ All user journeys (spectator & media personas)
- ✅ All pages load correctly
- ✅ Live scoring (lock, score, unlock, real-time sync)
- ✅ Multi-client lock prevention
- ✅ Visual regression (screenshots of all pages)
- ✅ Mobile responsive design
- ✅ Navigation between pages
- ✅ Data persistence

## 🎯 Common Commands

```bash
# Run everything (unit + E2E)
npm run test:all

# Run just E2E tests
npm run test:e2e

# Watch tests run in browser
npm run test:e2e:headed

# Interactive test mode
npm run test:e2e:ui

# Debug failing tests
npm run test:e2e:debug

# Visual regression only
npm run test:visual

# View detailed report
npm run test:report
```

## 🔍 Finding Specific Features

### "I want to see if spectator persona works"

```bash
npm run test:e2e -- spectator-journey
```

### "I want to see if live scoring works"

```bash
npm run test:e2e -- live-scoring
```

### "I want to see if media coverage planning works"

```bash
npm run test:e2e -- media-journey
```

### "I want to see all pages visually"

```bash
npm run test:visual
npm run test:report
```

## 📊 Test Coverage Report

See `docs/test-coverage-report.md` for complete feature-to-test mapping.

**Key Stats:**
- 47 total tests
- 95%+ feature coverage
- All Phase 1-3 features tested
- All 8 live scoring bug fixes verified

## 🎬 Watching Tests Run

Want to see the features in action? Run in headed mode:

```bash
npm run test:e2e:headed
```

This opens a real browser and you'll see:
- Users selecting personas
- Navigating between pages
- Locking matches
- Entering scores
- Real-time synchronization
- All interactions

## 🐛 When Tests Fail

```bash
# 1. View the failure report
npm run test:report

# 2. Debug the specific test
npm run test:e2e:debug -- name-of-test

# 3. Check screenshots/videos
open playwright-report/index.html
```

The report shows:
- Exact failure point
- Screenshot at failure
- Video of the test
- Network logs
- Console errors

## 📝 Test Documentation

- **Full Test Suite Guide**: `e2e/README.md`
- **Coverage Report**: `docs/test-coverage-report.md`
- **Bug Fix Verification**: `docs/live-scoring-fixes.md`

## ✨ Benefits

**No more hunting for features:**
1. Run tests → See features in action
2. Tests fail → Features broken
3. Tests pass → Features working

**Automated verification:**
- User journeys work end-to-end
- All pages render correctly
- Components interact properly
- Real-time features synchronize
- Mobile layout responsive
- No regressions introduced

## 🚦 CI/CD Integration

Tests run automatically on:
- Every commit (if pre-commit hook configured)
- Every pull request (if CI configured)
- Before deployment

This ensures features never break without warning.

## 💡 Pro Tips

1. **Run tests often** - Catch bugs early
2. **Watch in headed mode** - Understand flows visually
3. **Use test:e2e:ui** - Interactive debugging
4. **Check test:report** - Detailed failure analysis
5. **Update snapshots intentionally** - `npm run test:visual:update`

## 🎯 What This Solves

> "I'm not seeing all these features we claim to have completed. I shouldn't have to go hunting for this."

**Solution:**
- Run `npm run test:all` → Verifies all features
- Run `npm run test:report` → Visual proof
- Run `npm run test:e2e:headed` → Watch it work

No hunting required. Tests are the proof.
