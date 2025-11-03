# CourtSync Test Suite

Comprehensive test suite for the CourtSync application, designed to catch API data structure mismatches, transformation errors, and integration issues before they reach production.

## Overview

This test suite was developed in response to production errors caused by:
- Nested API response structures not being properly handled
- Missing Division objects causing "Cannot read properties of undefined" errors
- ISO timestamp strings not being converted to Unix milliseconds
- Missing required fields (HasOutcome, CourtName) in transformed data

## Test Categories

### 1. API Service Unit Tests
**Location:** `src/lib/services/aes.test.ts`

Tests the core API client functions and data transformation logic.

**Critical Tests:**
- ✅ Nested Play/Matches structure extraction
- ✅ ISO string to Unix timestamp conversion
- ✅ Division object injection
- ✅ HasOutcome field derivation
- ✅ CourtName field extraction
- ✅ Error handling for failed requests
- ✅ Empty response handling

**What These Tests Prevent:**
- Forgetting to handle nested API structures
- Missing Division field causing render errors
- Timestamp format mismatches causing date-fns errors
- Missing computed fields breaking UI components

### 2. Utility Function Tests
**Location:** `src/lib/utils/filterMatches.test.ts`

Tests data transformation, filtering, and validation utilities.

**Critical Tests:**
- ✅ Invalid timestamp filtering (NaN, 0, negative values)
- ✅ Time-based grouping with proper sorting
- ✅ Match status detection (upcoming, live, completed)
- ✅ Conflict detection for overlapping matches
- ✅ ID-based and text-based team matching
- ✅ Division and team filtering

**What These Tests Prevent:**
- RangeError from invalid timestamps
- Matches disappearing due to bad timestamp validation
- Incorrect match status indicators
- Filter logic errors

### 3. Integration Tests
**Location:** `src/tests/integration/club-page-load.test.ts`

Tests end-to-end data loading through server load functions.

**Critical Tests:**
- ✅ Division object exists on all returned matches
- ✅ Timestamps are numbers (Unix milliseconds), not strings
- ✅ All computed fields present (HasOutcome, CourtName)
- ✅ Match deduplication across teams
- ✅ Error handling and graceful degradation
- ✅ Empty state handling

**What These Tests Prevent:**
- Server-side rendering errors from missing fields
- Data type mismatches between API and components
- Duplicate matches appearing in UI
- Unhandled API errors crashing pages

### 4. API Contract Tests
**Location:** `src/tests/api-contracts.test.ts`

Validates that external AES API responses match expected structure.

**Tests (Skipped by Default):**
- Team Schedule API structure validation
- Team Assignments OData structure validation
- Event Info API structure validation
- Response schema validation (always runs)

**Note:** Real API tests are skipped by default to avoid rate limiting. Run manually:
```bash
npm test -- api-contracts.test.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- aes.test.ts
```

### Run Tests with UI
```bash
npm run test:ui
```

## Test Fixtures

**Location:** `src/tests/fixtures/`

Realistic mock data based on actual AES API responses:

- `teamScheduleResponse.ts` - Nested Play/Matches structure
- `teamAssignmentResponse.ts` - OData nextassignments response
- `eventInfoResponse.ts` - Event with clubs and divisions
- `expectedMatches.ts` - Expected transformed Match objects

## Key Test Patterns

### 1. Structure Validation
```typescript
it('should correctly transform nested Play/Matches structure', async () => {
  const result = await fetchTeamSchedule(eventId, division, teamId, 'current', mockFetch);

  expect(result).toHaveLength(3); // Flattened from 2 plays
  result.forEach(match => {
    expect(match.Division).toBeDefined();
    expect(typeof match.ScheduledStartDateTime).toBe('number');
  });
});
```

### 2. Data Transformation Validation
```typescript
it('should convert ISO timestamp strings to Unix milliseconds', async () => {
  const result = await fetchTeamSchedule(eventId, division, teamId, 'current', mockFetch);

  expect(result[0].ScheduledStartDateTime).toBe(
    new Date('2025-11-03T12:00:00').getTime()
  );
});
```

### 3. Error Prevention
```typescript
it('should filter out matches with invalid timestamps', () => {
  const matches = [
    validMatch,
    { ...match, ScheduledStartDateTime: NaN },  // Invalid
    { ...match, ScheduledStartDateTime: 0 }      // Invalid
  ];

  const result = groupMatchesByTime(matches);
  const totalMatches = result.reduce((sum, block) => sum + block.matches.length, 0);

  expect(totalMatches).toBe(1); // Only valid match
});
```

## Coverage Goals

- **API Service Layer:** 95%+ coverage
- **Utility Functions:** 90%+ coverage
- **Integration Tests:** All critical user paths
- **Contract Tests:** All external API endpoints

## CI/CD Integration

Tests run automatically on:
- Pre-commit (unit tests only)
- Pull request creation (all tests except API contracts)
- Deployment pipeline (full suite with coverage)

## Debugging Failed Tests

### Common Issues

**Import Errors:**
- Use `$lib/` alias for absolute imports
- Fixtures use `$lib/../tests/fixtures/` path

**Mock Fetch Not Working:**
- Ensure `mockFetch.mockResolvedValueOnce()` returns both `ok` and `json()`
- Chain multiple mock responses for sequential calls

**Type Errors:**
- Use `as any` sparingly for test mocks
- Prefer proper type definitions when possible

## Adding New Tests

### 1. Create Fixture (if needed)
Add mock data to `src/tests/fixtures/` matching real API structure

### 2. Write Unit Test
Test individual functions in isolation with mocked dependencies

### 3. Write Integration Test
Test full data flow from API to component rendering

### 4. Update This README
Document what the test prevents and why it's important

## Test-Driven Development

When adding new features:

1. Write API contract test first (if using new endpoint)
2. Create fixture with expected structure
3. Write unit test that fails
4. Implement feature
5. Watch test pass
6. Write integration test
7. Refactor with confidence

## Why These Tests Matter

**Before Tests:**
- ❌ Nested structure not handled → "No matches found" despite data loading
- ❌ Missing Division field → "Cannot read properties of undefined" crash
- ❌ ISO strings not converted → "RangeError: Invalid time value"
- ❌ Invalid timestamps → Matches disappearing from UI

**After Tests:**
- ✅ All structure transformations validated
- ✅ All required fields guaranteed to exist
- ✅ All timestamp conversions verified
- ✅ All edge cases handled gracefully

## Maintenance

Update tests when:
- AES API structure changes
- New API endpoints added
- New data transformations needed
- New computed fields added
- Bug discovered in production

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/)
- [SvelteKit Testing Guide](https://kit.svelte.dev/docs/testing)
