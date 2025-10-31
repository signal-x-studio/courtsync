# Real-Time Sync Architecture Documentation

## Overview

This document outlines potential backend architecture options for implementing real-time synchronization in CourtSync. The current implementation uses localStorage with BroadcastChannel API for cross-tab communication, which works well for single-user scenarios and small teams (2-3 people) using export/import.

## Architecture Options

### 1. WebSocket-Based Real-Time Sync

**Technology:** WebSocket (via Socket.io, ws, or native WebSocket API)

**Pros:**
- Full-duplex communication
- Low latency for real-time updates
- Efficient for bidirectional data flow
- Works well for score updates and match claiming

**Cons:**
- Requires persistent connection
- More complex server infrastructure
- Higher server resource usage
- Requires connection management (reconnection, heartbeat)

**Implementation Approach:**
```typescript
// Client-side example
const socket = io('https://api.courtsync.com', {
  auth: { token: userToken },
  transports: ['websocket']
});

socket.on('score-update', (data: ScoreUpdate) => {
  // Update local state
  updateScoreLocally(data.matchId, data.score);
});

socket.emit('score-update', {
  matchId: 123,
  score: { sets: [...], status: 'in-progress' }
});
```

**Server Requirements:**
- Node.js with Socket.io or similar
- Redis for pub/sub across server instances
- Connection pooling and load balancing
- Authentication middleware

---

### 2. Server-Sent Events (SSE)

**Technology:** EventSource API

**Pros:**
- Simpler than WebSocket (HTTP-based)
- Built-in reconnection support
- One-way server-to-client communication
- Lower overhead for read-heavy operations

**Cons:**
- One-way only (client can't send via SSE)
- Requires HTTP/2 for better performance
- Limited browser support (though widely supported now)
- Less efficient for bidirectional updates

**Implementation Approach:**
```typescript
// Client-side example
const eventSource = new EventSource('/api/events', {
  headers: { Authorization: `Bearer ${userToken}` }
});

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'score-update') {
    updateScoreLocally(update.matchId, update.score);
  }
};

// For sending updates, use regular fetch/POST
await fetch('/api/scores', {
  method: 'POST',
  body: JSON.stringify({ matchId, score })
});
```

**Use Case:** Best for scenarios where clients primarily consume updates rather than send them frequently.

---

### 3. Firebase Realtime Database

**Technology:** Google Firebase Realtime Database

**Pros:**
- Managed service (no server infrastructure)
- Built-in offline support
- Real-time synchronization out of the box
- Authentication integrated
- Free tier available

**Cons:**
- Vendor lock-in
- Pricing can scale with usage
- Less control over data structure
- Real-time queries can be expensive

**Implementation Approach:**
```typescript
import { database } from 'firebase/database';
import { ref, onValue, set } from 'firebase/database';

// Listen for score updates
const scoreRef = ref(database, `events/${eventId}/scores/${matchId}`);
onValue(scoreRef, (snapshot) => {
  const score = snapshot.val();
  updateScoreLocally(matchId, score);
});

// Update score
await set(scoreRef, {
  sets: [...],
  status: 'in-progress',
  lastUpdated: Date.now(),
  lastUpdatedBy: userId
});
```

**Data Structure:**
```
events/
  {eventId}/
    scores/
      {matchId}/
        sets: [...]
        status: "in-progress"
        lastUpdated: timestamp
        lastUpdatedBy: userId
    claims/
      {matchId}/
        claimedBy: userId
        claimedAt: timestamp
        expiresAt: timestamp
```

---

### 4. Supabase Realtime

**Technology:** Supabase (PostgreSQL with real-time subscriptions)

**Pros:**
- PostgreSQL database (SQL, relational)
- Real-time subscriptions via PostgreSQL replication
- Open source (self-hostable)
- Row-level security
- Built-in authentication

**Cons:**
- Requires PostgreSQL knowledge
- Real-time subscriptions use more resources
- Less mature than Firebase
- Self-hosting requires infrastructure

**Implementation Approach:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Subscribe to score updates
const channel = supabase
  .channel('score-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'scores',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    updateScoreLocally(payload.new.match_id, payload.new.score);
  })
  .subscribe();

// Update score
await supabase
  .from('scores')
  .update({
    sets: [...],
    status: 'in-progress',
    last_updated: new Date()
  })
  .eq('match_id', matchId);
```

**Database Schema:**
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR NOT NULL,
  match_id INTEGER NOT NULL,
  sets JSONB NOT NULL,
  status VARCHAR NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  last_updated_by VARCHAR NOT NULL,
  UNIQUE(event_id, match_id)
);

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR NOT NULL,
  match_id INTEGER NOT NULL,
  claimed_by VARCHAR NOT NULL,
  claimed_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(event_id, match_id)
);
```

---

## API Design Outline

### Authentication

**Required for all endpoints:**
- JWT-based authentication
- Token expiration: 24 hours
- Refresh token mechanism
- Role-based access control (Media, Spectator, Coach)

**Authentication Flow:**
```
POST /api/auth/login
  Body: { email, password }
  Response: { token, refreshToken, user }

POST /api/auth/refresh
  Headers: { Authorization: Bearer <refreshToken> }
  Response: { token, refreshToken }
```

---

### Score Update Endpoints

**POST /api/events/:eventId/scores**
- Create or update a score
- Body: `{ matchId, sets, status }`
- Requires: Authentication + Claim ownership
- Rate limit: 10 requests/second per user

**GET /api/events/:eventId/scores/:matchId**
- Get current score for a match
- Requires: Authentication
- Rate limit: 100 requests/minute

**GET /api/events/:eventId/scores**
- Get all scores for an event
- Query params: `?teamId=...`, `?division=...`
- Requires: Authentication
- Rate limit: 50 requests/minute

**GET /api/events/:eventId/scores/:matchId/history**
- Get score history for a match
- Query params: `?limit=100`, `?offset=0`
- Requires: Authentication
- Rate limit: 50 requests/minute

---

### Claim Management Endpoints

**POST /api/events/:eventId/claims/:matchId**
- Claim a match for scorekeeping
- Body: `{ expiresAt }` (optional)
- Requires: Authentication
- Rate limit: 20 requests/minute

**DELETE /api/events/:eventId/claims/:matchId**
- Release a claim
- Requires: Authentication + Claim ownership
- Rate limit: 20 requests/minute

**GET /api/events/:eventId/claims/:matchId**
- Get claim status
- Requires: Authentication
- Rate limit: 100 requests/minute

**GET /api/events/:eventId/claims**
- Get all claims for an event
- Requires: Authentication
- Rate limit: 50 requests/minute

---

### Coverage Plan Endpoints

**GET /api/events/:eventId/coverage-plans**
- Get user's coverage plan
- Requires: Authentication
- Rate limit: 50 requests/minute

**PUT /api/events/:eventId/coverage-plans**
- Update coverage plan
- Body: `{ selectedMatches: [matchId, ...] }`
- Requires: Authentication
- Rate limit: 10 requests/second

**DELETE /api/events/:eventId/coverage-plans**
- Clear coverage plan
- Requires: Authentication
- Rate limit: 10 requests/second

---

### Rate Limiting

**Strategy:** Token bucket algorithm
- Per-user rate limits
- Per-IP rate limits (for unauthenticated requests)
- Sliding window implementation

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**Rate Limit Responses:**
- 429 Too Many Requests
- Retry-After header included

---

## Migration Path

### Phase 1: Hybrid Approach (Recommended)

**Goal:** Maintain localStorage as primary storage, sync to backend when available

**Implementation:**
1. Keep existing localStorage implementation
2. Add backend sync layer that:
   - Syncs to backend when online
   - Falls back to localStorage when offline
   - Resolves conflicts on sync (latest timestamp wins)

**Code Structure:**
```typescript
// Hybrid storage adapter
class HybridStorage {
  async saveScore(matchId: number, score: MatchScore): Promise<void> {
    // Save to localStorage immediately
    localStorage.setItem(`score-${matchId}`, JSON.stringify(score));
    
    // Try to sync to backend (fire and forget)
    try {
      await fetch(`/api/events/${eventId}/scores`, {
        method: 'POST',
        body: JSON.stringify({ matchId, score })
      });
    } catch (error) {
      // Queue for sync when online
      queueForSync({ matchId, score });
    }
  }
  
  async syncPending(): Promise<void> {
    const pending = getPendingSyncs();
    for (const item of pending) {
      try {
        await syncToBackend(item);
        removeFromPending(item);
      } catch (error) {
        // Keep in queue
      }
    }
  }
}
```

**Benefits:**
- No breaking changes
- Works offline immediately
- Gradual migration path
- Users can opt-in to backend sync

---

### Phase 2: Backend as Primary

**Goal:** Make backend the source of truth, localStorage as cache

**Implementation:**
1. Read from backend first
2. Cache in localStorage
3. Update backend on changes
4. Sync localStorage cache periodically

**Migration Steps:**
1. Add feature flag: `USE_BACKEND_SYNC`
2. Implement backend adapter
3. Test with small user group
4. Roll out gradually
5. Remove localStorage fallback after stable

---

### Phase 3: Full Backend Migration

**Goal:** Remove localStorage dependency (optional)

**Implementation:**
1. All data stored in backend
2. IndexedDB for offline cache
3. Service Worker for offline support
4. Sync queue for offline changes

---

## Backward Compatibility

**Strategy:** Support both localStorage and backend during migration

**Implementation:**
```typescript
// Storage adapter factory
function createStorageAdapter(config: StorageConfig) {
  if (config.useBackend && config.backendAvailable) {
    return new BackendStorageAdapter(config);
  }
  return new LocalStorageAdapter();
}

// Unified interface
interface StorageAdapter {
  saveScore(matchId: number, score: MatchScore): Promise<void>;
  getScore(matchId: number): Promise<MatchScore | null>;
  getAllScores(eventId: string): Promise<Map<number, MatchScore>>;
}
```

---

## Data Migration Strategy

### Export/Import Approach

**Step 1:** Export all localStorage data
```typescript
// Export function
function exportAllData() {
  return {
    scores: getAllScoresFromLocalStorage(),
    claims: getAllClaimsFromLocalStorage(),
    coveragePlans: getAllCoveragePlansFromLocalStorage(),
    // ... other data
  };
}
```

**Step 2:** Import to backend
```typescript
// Import function
async function importToBackend(data: ExportedData) {
  await Promise.all([
    ...data.scores.map(score => 
      fetch('/api/events/.../scores', {
        method: 'POST',
        body: JSON.stringify(score)
      })
    ),
    // ... other imports
  ]);
}
```

### Conflict Resolution

**Strategy:** Latest timestamp wins
- Compare `lastUpdated` timestamps
- Backend always wins if timestamps are equal
- Log conflicts for review

---

## Offline-First Design

**PWA Capabilities:**
- Service Worker for offline support
- Cache API for storing API responses
- Background Sync API for deferred sync
- IndexedDB for structured data storage

**Implementation:**
```typescript
// Service Worker cache strategy
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/scores')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores());
  }
});
```

---

## Security Considerations

### Authentication
- JWT tokens with short expiration
- Refresh tokens stored securely (httpOnly cookies)
- Role-based access control

### Authorization
- Users can only update scores for matches they've claimed
- Event-level permissions (Media, Spectator, Coach roles)
- Rate limiting to prevent abuse

### Data Validation
- Validate all inputs server-side
- Sanitize user inputs
- Prevent SQL injection (parameterized queries)
- Prevent XSS (sanitize outputs)

### Privacy
- No personal data in scores
- Optional user profiles
- GDPR compliance considerations

---

## Performance Considerations

### Caching Strategy
- Cache scores for 30 seconds
- Cache events for 5 minutes
- Cache claims for 1 minute
- Invalidate on updates

### Database Optimization
- Index on `(event_id, match_id)` for scores
- Index on `(event_id, match_id)` for claims
- Pagination for large result sets
- Connection pooling

### Scalability
- Horizontal scaling with load balancer
- Redis for pub/sub across instances
- Database read replicas for read-heavy operations
- CDN for static assets

---

## Recommended Approach

**For MVP:** Continue with localStorage + BroadcastChannel
- Works for small teams (2-3 people)
- No infrastructure costs
- Simple to maintain
- Export/import for coordination

**For Scale:** Firebase Realtime Database
- Managed service (no ops overhead)
- Built-in offline support
- Real-time synchronization
- Good free tier
- Easy to implement

**For Long-term:** Supabase or Custom Backend
- More control over data structure
- Better for complex queries
- Can optimize for specific use cases
- May require more infrastructure

---

## Implementation Checklist

- [ ] Choose backend architecture option
- [ ] Set up development environment
- [ ] Implement authentication system
- [ ] Create database schema (if using database)
- [ ] Implement API endpoints
- [ ] Create storage adapter interface
- [ ] Implement backend storage adapter
- [ ] Add offline support (Service Worker)
- [ ] Implement conflict resolution
- [ ] Add migration tools
- [ ] Write integration tests
- [ ] Deploy to staging environment
- [ ] Test with real users
- [ ] Gradual rollout with feature flags
- [ ] Monitor performance and errors
- [ ] Document API endpoints
- [ ] Update user documentation

---

## Future Enhancements

1. **Push Notifications**
   - Notify users of score updates
   - Match reminders
   - Coverage plan conflicts

2. **Analytics Dashboard**
   - Track usage patterns
   - Monitor performance metrics
   - User engagement analytics

3. **Multi-Event Support**
   - Users can follow multiple events
   - Cross-event statistics
   - Event comparison tools

4. **Social Features**
   - Share coverage plans
   - Follow other users
   - Public leaderboards

5. **Mobile Apps**
   - Native iOS/Android apps
   - Push notifications
   - Offline-first architecture

---

## Resources

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Server-Sent Events Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)

