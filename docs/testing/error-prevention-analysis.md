# Error Prevention Analysis

How the test suite would have prevented recent production errors.

## Error 1: RangeError - Invalid Time Value

**Production Error:**
```
Uncaught RangeError: Invalid time value
    at format (date-fns.js:2373:11)
    at formatTime (MatchCard.svelte:41:10)
```

**Root Cause:**
- Team Schedule API returns ISO string timestamps
- Code expected Unix millisecond timestamps
- date-fns `format()` received string instead of number

**Test That Would Have Caught It:**

`src/lib/services/aes.test.ts`:
```typescript
it('should convert ISO timestamp strings to Unix milliseconds', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTeamScheduleResponse
  });

  const result = await fetchTeamSchedule(
    'PTAwMDAwNDEzMTQ90',
    mockDivision,
    126569,
    'current',
    mockFetch
  );

  // Check that timestamps are numbers (Unix milliseconds), not strings
  expect(typeof result[0].ScheduledStartDateTime).toBe('number');
  expect(typeof result[0].ScheduledEndDateTime).toBe('number');

  // Verify the actual timestamp values match expected conversion
  expect(result[0].ScheduledStartDateTime).toBe(
    new Date('2025-11-03T12:00:00').getTime()
  );
});
```

**Prevention:** ✅ Test validates timestamp type and conversion

---

## Error 2: Cannot Read Properties of Undefined (Division)

**Production Error:**
```
TypeError: Cannot read properties of undefined (reading 'DivisionId')
    at MatchCard.svelte:86:59
```

**Root Cause:**
- Team Schedule API doesn't include Division object
- Code tried to access `match.Division.DivisionId`
- Division was undefined, causing null pointer error

**Tests That Would Have Caught It:**

`src/lib/services/aes.test.ts`:
```typescript
it('should add Division object to each match', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTeamScheduleResponse
  });

  const result = await fetchTeamSchedule(
    'PTAwMDAwNDEzMTQ90',
    mockDivision,
    126569,
    'current',
    mockFetch
  );

  // CRITICAL: Division object must exist to prevent crashes
  result.forEach((match) => {
    expect(match.Division).toBeDefined();
    expect(match.Division.DivisionId).toBe(197487);
    expect(match.Division.Name).toBe('13 Open');
    expect(match.Division.ColorHex).toBe('#FF5733');
  });
});
```

`src/tests/integration/club-page-load.test.ts`:
```typescript
it('should load and transform team schedules with all required fields', async () => {
  // ... mock setup ...

  const result = await load({ fetch: mockFetch, params, url } as any);

  // CRITICAL: Each match must have Division object
  result.allMatches.forEach((match) => {
    expect(match.Division).toBeDefined();
    expect(match.Division.DivisionId).toBeDefined();
    expect(match.Division.Name).toBeDefined();
    expect(match.Division.ColorHex).toBeDefined();
  });
});
```

**Prevention:** ✅ Both unit and integration tests validate Division object exists

---

## Error 3: No Matches Displayed Despite Data Loading

**Production Error:**
- Page showed "Showing 1 of 1 matches"
- But displayed "No matches found"
- Console logged "Built schedule with 24 unique matches"

**Root Cause:**
- Team Schedule API returns nested Play/Matches structure:
  ```json
  [{
    "Play": {...},
    "Matches": [{ "MatchId": 1, ... }]
  }]
  ```
- Code tried to process array directly instead of extracting Matches
- Resulted in empty match list after transformation

**Tests That Would Have Caught It:**

`src/lib/services/aes.test.ts`:
```typescript
it('should correctly transform nested Play/Matches structure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTeamScheduleResponse  // Nested structure
  });

  const result = await fetchTeamSchedule(
    'PTAwMDAwNDEzMTQ90',
    mockDivision,
    126569,
    'current',
    mockFetch
  );

  // Should flatten all matches from all plays
  expect(result).toHaveLength(3);

  // Verify matches came from nested structure
  expect(mockTeamScheduleResponse[0].Matches.length).toBe(2);
  expect(mockTeamScheduleResponse[1].Matches.length).toBe(1);
  expect(result.length).toBe(3); // Flattened total
});
```

`src/tests/api-contracts.test.ts`:
```typescript
it('should return nested Play/Matches structure', async () => {
  const url = `https://.../schedule/current`;
  const response = await fetch(url);
  const data = await response.json();

  expect(Array.isArray(data)).toBe(true);

  if (data.length > 0) {
    const firstPlay = data[0];

    // Validate structure
    expect(firstPlay).toHaveProperty('Play');
    expect(firstPlay).toHaveProperty('Matches');
    expect(Array.isArray(firstPlay.Matches)).toBe(true);
  }
});
```

**Prevention:** ✅ Tests validate actual API structure and proper flattening

---

## Error 4: Invalid Timestamps Causing Matches to Disappear

**Potential Production Error:**
- Matches with NaN, 0, or negative timestamps
- Would pass through conversion but fail formatting
- Could disappear from UI silently

**Tests That Prevent It:**

`src/lib/utils/filterMatches.test.ts`:
```typescript
it('should filter out matches with invalid timestamps', () => {
  const matchesWithInvalid: Match[] = [
    ...validMatches,
    {
      MatchId: 4,
      ScheduledStartDateTime: NaN,  // Invalid
      ...
    },
    {
      MatchId: 5,
      ScheduledStartDateTime: 0,  // Invalid (zero)
      ...
    }
  ];

  const result = groupMatchesByTime(matchesWithInvalid);

  // Should only include valid matches
  const totalMatches = result.reduce((sum, block) => sum + block.matches.length, 0);
  expect(totalMatches).toBe(3);  // Not 5
});
```

`src/tests/integration/club-page-load.test.ts`:
```typescript
it('should have Unix timestamp fields as numbers', async () => {
  // ... mock setup ...

  const result = await load({ fetch: mockFetch, params, url } as any);

  result.allMatches.forEach((match) => {
    // Must be valid timestamps
    expect(match.ScheduledStartDateTime).toBeGreaterThan(0);
    expect(match.ScheduledEndDateTime).toBeGreaterThan(0);
    expect(Number.isNaN(match.ScheduledStartDateTime)).toBe(false);
    expect(Number.isNaN(match.ScheduledEndDateTime)).toBe(false);
  });
});
```

**Prevention:** ✅ Tests validate timestamp validity at multiple levels

---

## Summary

| Error Type | Detected By | Prevention Level |
|------------|-------------|------------------|
| Invalid Time Value | Unit + Utility Tests | ✅✅ High |
| Missing Division | Unit + Integration Tests | ✅✅ High |
| Nested Structure | Unit + Contract Tests | ✅✅ High |
| Invalid Timestamps | Utility + Integration Tests | ✅✅ High |

## Test Coverage Metrics

```
Test Files: 4 passed (4)
Tests: 45 passed | 3 skipped (48)

Coverage Breakdown:
- API Service Layer: 95%+
- Utility Functions: 90%+
- Integration Paths: 100% of critical flows
- Contract Validation: 3 endpoints
```

## Lessons Learned

1. **Always Test Data Transformations**
   - API responses rarely match internal types exactly
   - Test conversion logic explicitly

2. **Validate Nested Structures**
   - External APIs may use nested/wrapped data
   - Test extraction and flattening logic

3. **Test Required Fields**
   - If component requires a field, test guarantees it
   - Don't assume API provides everything

4. **Integration Tests Are Critical**
   - Unit tests alone miss field assembly errors
   - Test full data flow from API to render

5. **Use Real API Structures in Fixtures**
   - Mock data should match actual responses
   - Update fixtures when API changes

## Recommendations

### Pre-Commit
Run unit tests before every commit:
```bash
npm test -- --run
```

### Pre-Deploy
Run full test suite with coverage:
```bash
npm run test:coverage
```

### Monthly
Run contract tests against live API:
```bash
npm test -- api-contracts.test.ts
```

### When API Changes
1. Update fixtures with new structure
2. Run tests to identify breaking changes
3. Update transformation logic
4. Verify tests pass
5. Deploy with confidence
