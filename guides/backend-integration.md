# Backend Integration Architecture

## Overview

This document outlines potential backend integration options for future real-time synchronization of coverage status, team coordination, and scorekeeping features.

## Current Architecture

The application currently uses **localStorage-based** client-side storage with manual export/import for sharing:

- **Coverage Status**: Stored in `localStorage` (`teamCoverageStatus`)
- **Team Coordination**: Stored in `localStorage` (`teamMembers`, `teamAssignments`)
- **Coverage Plan**: Stored in `localStorage` (`coveragePlan`)
- **Sharing**: JSON export/import and URL hash encoding

## Future Backend Options

### Option 1: Firebase Realtime Database

**Pros:**
- Real-time synchronization out of the box
- No backend server required
- Easy to implement
- Good for small-to-medium teams
- Built-in authentication
- Offline support

**Cons:**
- Vendor lock-in
- Pricing can scale with usage
- Less control over data structure

**Implementation:**
```typescript
// Example Firebase integration
import { getDatabase, ref, onValue, set } from 'firebase/database';

const db = getDatabase();
const coverageStatusRef = ref(db, `events/${eventId}/coverageStatus`);

// Listen for changes
onValue(coverageStatusRef, (snapshot) => {
  const data = snapshot.val();
  // Update local state
});

// Update status
set(ref(db, `events/${eventId}/coverageStatus/${teamId}`), status);
```

**API Requirements:**
- Events collection: `events/{eventId}`
- Coverage status: `events/{eventId}/coverageStatus/{teamId}`
- Team assignments: `events/{eventId}/assignments/{teamId}`
- Coverage plans: `events/{eventId}/plans/{memberId}`

### Option 2: WebSocket Server (Custom)

**Pros:**
- Full control over architecture
- Can use existing infrastructure
- No vendor lock-in
- Can optimize for specific use cases

**Cons:**
- Requires backend development
- More complex to implement
- Need to handle connection management
- Scaling considerations

**Implementation:**
```typescript
// Example WebSocket client
const ws = new WebSocket('wss://api.example.com/coverage');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle update: { type: 'coverageStatus', teamId, status, memberId }
};

// Send update
ws.send(JSON.stringify({
  type: 'updateCoverageStatus',
  eventId,
  teamId,
  status,
  memberId
}));
```

**API Endpoints:**
- `POST /api/events/{eventId}/coverage/status` - Update coverage status
- `POST /api/events/{eventId}/coverage/assign` - Assign team to member
- `GET /api/events/{eventId}/coverage/status` - Get all coverage status
- `WS /ws/events/{eventId}` - WebSocket connection for real-time updates

### Option 3: Server-Sent Events (SSE)

**Pros:**
- Simpler than WebSocket
- Built into browsers
- One-way push from server
- Automatic reconnection

**Cons:**
- One-way only (need HTTP for updates)
- Less efficient than WebSocket
- Browser connection limits

**Implementation:**
```typescript
// Example SSE client
const eventSource = new EventSource(`/api/events/${eventId}/coverage/stream`);

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle update
};

// Updates via HTTP POST
fetch(`/api/events/${eventId}/coverage/status`, {
  method: 'POST',
  body: JSON.stringify({ teamId, status, memberId })
});
```

### Option 4: REST API with Polling

**Pros:**
- Simple to implement
- No special infrastructure
- Works with any backend

**Cons:**
- Not real-time (delayed updates)
- More server load
- Battery drain on mobile

**Implementation:**
```typescript
// Poll for updates
setInterval(async () => {
  const response = await fetch(`/api/events/${eventId}/coverage/status?since=${lastUpdate}`);
  const updates = await response.json();
  // Apply updates
}, 5000); // Poll every 5 seconds
```

## Recommended Approach

For a **small-to-medium team** (5-20 photographers), **Firebase Realtime Database** is recommended:
- Easiest to implement
- Real-time synchronization
- Handles connection management
- Good free tier for small teams

For **larger teams** or **custom requirements**, a **WebSocket server** would provide more control and scalability.

## Data Models

### Coverage Status
```typescript
{
  eventId: string;
  teamId: string;
  status: 'not-covered' | 'covered' | 'partially-covered' | 'planned';
  memberId: string;
  updatedAt: timestamp;
  updatedBy: string; // memberId
}
```

### Team Assignment
```typescript
{
  eventId: string;
  teamId: string;
  memberId: string;
  assignedAt: timestamp;
  assignedBy: string; // memberId
}
```

### Coverage Plan
```typescript
{
  eventId: string;
  memberId: string;
  matchIds: number[];
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

## Migration Strategy

1. **Phase 1**: Add backend option alongside localStorage
   - Detect backend availability
   - Sync localStorage → backend on login
   - Use backend if available, fallback to localStorage

2. **Phase 2**: Real-time updates
   - Subscribe to backend events
   - Update UI on changes
   - Show "syncing" indicators

3. **Phase 3**: Remove localStorage dependency
   - Store auth tokens only
   - All data from backend
   - Offline support via service worker

## Authentication

Consider adding authentication for:
- Team member identification
- Permission management (who can assign teams)
- Audit trail (who changed what)

Options:
- Firebase Auth
- Auth0
- Custom JWT tokens
- Simple API keys (for small teams)

## Security Considerations

- Validate eventId access (team members can only see their event)
- Rate limiting on updates
- Validate team assignments (prevent conflicts)
- Audit logging for coverage changes

## Performance Considerations

- Batch updates when possible
- Debounce rapid status changes
- Use optimistic updates for better UX
- Cache coverage status locally

## Next Steps

1. Choose backend option (recommend Firebase for MVP)
2. Set up backend infrastructure
3. Create migration utilities (localStorage → backend)
4. Implement sync layer
5. Add real-time subscriptions
6. Test with multiple team members
7. Monitor performance and scaling needs

